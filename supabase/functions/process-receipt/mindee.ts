
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { mapPredictionToResult } from './prediction-mapper.ts';
import { MindeeOCRResult } from './types.ts';

// Model ID parsing types and helpers
type ModelId =
  | { kind: "uuid"; uuid: string }
  | { kind: "owner_model"; owner: string; model: string; version?: string };

function parseModelId(raw: string | undefined): ModelId {
  const fallback = { kind: "owner_model", owner: "mindee", model: "expense_receipts", version: "v5.3" } as const;
  if (!raw || !raw.trim()) return fallback;

  // UUID form from old app.mindee.com: 8-4-4-4-12 (loosely)
  if (/^[0-9a-fA-F-]{36}$/.test(raw)) return { kind: "uuid", uuid: raw };

  // owner/model[@vX[.Y]]
  const m = raw.match(/^([^/]+)\/([^@]+)(?:@v?([\d.]+))?$/);
  if (!m) return fallback;
  const [, owner, model, ver] = m;
  return { kind: "owner_model", owner, model, version: ver ? `v${ver}` : "v5.3" };
}

function modelUrlBase(apiBase: string, id: ModelId): string {
  if (id.kind === "uuid") return `${apiBase}/v1/products/${id.uuid}`;
  // Note: version is a path segment, never with '@'
  return `${apiBase}/v1/products/${id.owner}/${id.model}/${id.version ?? "v5.3"}`;
}

function makeMindeeError(status: number, data: any): Error & { status: number; code: string } {
  const msg = (data?.message || data?.error || "Mindee request failed").toString();
  const err = new Error(msg) as Error & { status: number; code: string };
  err.status = status;
  err.code =
    status === 401 ? "OCR_UNAUTHORIZED" :
    status === 404 ? "OCR_MODEL_NOT_FOUND" :
    status === 429 ? "OCR_RATE_LIMIT" :
    status >= 500 ? "OCR_BACKEND_UNAVAILABLE" :
    "OCR_REQUEST_FAILED";
  return err;
}

async function callMindeePredict(
  imageBlob: Blob,
  modelIdRaw: string | undefined,
  apiKey: string,
): Promise<any> {
  const apiBase = "https://api.mindee.net";
  const modelId = parseModelId(modelIdRaw);
  const base = modelUrlBase(apiBase, modelId);

  console.log(`📄 Using model ${modelId.kind === "uuid" ? `UUID: ${modelId.uuid}` : `${modelId.owner}/${modelId.model} ${modelId.version}`}`);
  console.log(`🔗 Base URL: ${base}`);

  // Format the authorization header properly
  const authHeader = apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`;
  
  // Build form data with the image
  const formData = new FormData();
  formData.append('document', imageBlob, 'receipt.jpg');

  const headers = {
    'Authorization': authHeader,
  };

  // Try async first, then graceful fallback to sync
  const tryAsync = async () => {
    console.log('📤 Trying async endpoint...');
    const r = await fetch(`${base}/predict_async`, { method: "POST", headers, body: formData });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data, isAsync: true };
  };

  const trySync = async () => {
    console.log('📤 Trying sync endpoint...');
    const r = await fetch(`${base}/predict`, { method: "POST", headers, body: formData });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data, isAsync: false };
  };

  let res = await tryAsync();
  
  if (!res.ok && [404, 405, 501].includes(res.status)) {
    console.log('⚠️ Async unsupported, falling back to synchronous endpoint');
    res = await trySync();
    if (!res.ok) throw makeMindeeError(res.status, res.data);
    
    // Sync returns immediate results
    console.log('✅ Sync prediction completed');
    return res.data;
  }

  if (!res.ok) throw makeMindeeError(res.status, res.data);
  
  // Handle async response with polling
  if (res.isAsync) {
    return await handleAsyncResponse(res.data, base, headers);
  }
  
  return res.data;
}

async function handleAsyncResponse(jobData: any, baseUrl: string, headers: any): Promise<any> {
  const jobId = jobData.job?.id;
  
  if (!jobId) {
    console.error('🚨 No job ID returned from async enqueue:', jobData);
    throw new Error('Failed to get job ID from Mindee API');
  }
  
  console.log(`✅ Job enqueued successfully: ${jobId}`);
  
  // Poll for completion
  const maxPollingAttempts = 30;
  const pollingInterval = 3000; // 3 seconds
  let attempts = 0;
  
  while (attempts < maxPollingAttempts) {
    attempts++;
    console.log(`🔄 Polling attempt ${attempts}/${maxPollingAttempts}...`);
    
    await new Promise(resolve => setTimeout(resolve, pollingInterval));
    
    const statusUrl = `${baseUrl}/predict_async/${jobId}`;
    const pollResponse = await fetch(statusUrl, { headers });
    
    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      console.error('🚨 Mindee polling error:', errorText);
      throw new Error(`Mindee polling failed: ${pollResponse.status} ${errorText}`);
    }
    
    const pollData = await pollResponse.json();
    console.log(`📊 Job status: ${pollData.job?.status || 'unknown'}`);
    
    if (pollData.job?.error) {
      console.error('🚨 Job failed with error:', pollData.job.error);
      throw new Error(`Mindee job failed: ${pollData.job.error.message || 'Unknown error'}`);
    }
    
    // Check if job is completed
    if (pollData.job?.status === 'completed' && pollData.document) {
      console.log('✅ Async job completed successfully');
      return pollData;
    }
    
    if (pollData.job?.status === 'failed') {
      throw new Error('Mindee job processing failed');
    }
  }
  
  throw new Error('Mindee job polling timeout - the document is taking too long to process');
}

export const mindeeClient = async (apiKey: string, imageBlob: Blob): Promise<MindeeOCRResult> => {
  try {
    const rawModelId = Deno.env.get('MINDEE_MODEL_ID')?.trim();
    
    // Validate API key format
    if (!apiKey || (!apiKey.startsWith('md_') && !apiKey.startsWith('Token '))) {
      console.error('🚨 Invalid API key format. Expected format: md_... or Token ...');
      throw new Error('Invalid API key format. Please check your Mindee API key.');
    }
    
    console.log(`📄 Processing receipt image (${Math.round(imageBlob.size / 1024)}KB)`);
    console.log(`🔑 API Key format: ${apiKey.substring(0, 10)}...`);
    
    console.log('📊 Starting OCR processing...');
    
    // Call the improved Mindee API
    const prediction = await callMindeePredict(imageBlob, rawModelId, apiKey);
    
    console.log('🔍 Raw OCR result from Mindee:', {
      date: prediction.document?.inference?.prediction?.date?.value,
      amount: prediction.document?.inference?.prediction?.total_amount?.value,
      description: prediction.document?.inference?.prediction?.supplier_name?.value,
      place: prediction.document?.inference?.prediction?.supplier_name?.value,
      supplier: prediction.document?.inference?.prediction?.supplier_name?.value,
      confidence: prediction.document?.inference?.prediction?.total_amount?.confidence
    });
    
    return mapPredictionToResult(prediction, prediction.document);
    
  } catch (error) {
    console.error('🚨 Error in Mindee client:', error);
    
    // Map specific error codes to user-friendly messages
    if (error instanceof Error && 'code' in error) {
      switch ((error as any).code) {
        case 'OCR_MODEL_NOT_FOUND':
          return {
            error: "Our receipt reader isn't configured correctly. We're updating it now.",
            details: error,
            type: 'CONFIGURATION_ERROR'
          };
        case 'OCR_UNAUTHORIZED':
          return {
            error: "Secure connection issue with our OCR. We're fixing your session.",
            details: error,
            type: 'AUTH_ERROR'
          };
        case 'OCR_BACKEND_UNAVAILABLE':
          return {
            error: "Our OCR service is temporarily busy. Please try again in a moment.",
            details: error,
            type: 'SERVER_ERROR'
          };
        case 'OCR_RATE_LIMIT':
          return {
            error: "We're processing a lot of receipts right now. Please wait a moment and try again.",
            details: error,
            type: 'RATE_LIMIT_ERROR'
          };
        default:
          return {
            error: "We hit a snag reading that receipt. Please try again.",
            details: error,
            type: 'SERVER_ERROR'
          };
      }
    }
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client',
      details: error,
      type: 'SERVER_ERROR'
    };
  }
}
