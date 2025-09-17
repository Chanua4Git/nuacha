
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { mapPredictionToResult } from './prediction-mapper.ts';
import { MindeeOCRResult } from './types.ts';

export const mindeeClient = async (apiKey: string, imageBlob: Blob): Promise<MindeeOCRResult> => {
  try {
    const rawModelId = Deno.env.get('MINDEE_MODEL_ID')?.trim() || '';
    const ownerModelPattern = /^[a-z0-9_-]+\/[a-z0-9._-]+(@[a-z0-9._-]+)?$/i;
    const resolvedModelId = ownerModelPattern.test(rawModelId) ? rawModelId : 'mindee/expense_receipts';
    if (!ownerModelPattern.test(rawModelId)) {
      console.warn('⚠️ MINDEE_MODEL_ID missing or invalid. Falling back to default model "mindee/expense_receipts".');
    }
    
    // Validate API key format
    if (!apiKey || (!apiKey.startsWith('md_') && !apiKey.startsWith('Token '))) {
      console.error('🚨 Invalid API key format. Expected format: md_... or Token ...');
      throw new Error('Invalid API key format. Please check your Mindee API key.');
    }
    
    console.log(`📄 Processing receipt image (${Math.round(imageBlob.size / 1024)}KB) with model ${resolvedModelId}`);
    console.log(`🔑 API Key format: ${apiKey.substring(0, 10)}...`);
    
    // Step 1: Enqueue the inference using the correct API endpoint
    const enqueueEndpoint = `https://api.mindee.net/v1/products/${resolvedModelId}/predict_async`;
    
    // Build form data with the image
    const buildFormData = () => {
      const formData = new FormData();
      formData.append('document', imageBlob, 'receipt.jpg');
      return formData;
    };
    
    console.log('📤 Enqueueing inference with Mindee API...');
    
    // Format the authorization header properly
    const authHeader = apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`;
    
    // Initial enqueue
    let enqueueResponse = await fetch(enqueueEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: buildFormData()
    });

    if (!enqueueResponse.ok) {
      const errorText = await enqueueResponse.text();
      console.error('🚨 Mindee enqueue error:', errorText);
      
      // Provide more specific error messages
      if (enqueueResponse.status === 401) {
        throw new Error('Authentication failed. Please verify your Mindee API key is correct.');
      } else if (enqueueResponse.status === 402) {
        throw new Error('Payment required. Please check your Mindee account billing status.');
      } else if (enqueueResponse.status === 429) {
        throw new Error('Too many requests. Please wait and try again.');
      } else {
        throw new Error(`Mindee API error: ${enqueueResponse.status} - ${errorText}`);
      }
    }
    
    const jobData = await enqueueResponse.json();
    console.log('🔍 Job enqueue response:', JSON.stringify(jobData, null, 2));
    
    const jobId = jobData.job?.id;
    
    if (!jobId) {
      console.error('🚨 No job ID returned from enqueue:', jobData);
      throw new Error('Failed to get job ID from Mindee API');
    }
    
    console.log(`✅ Job enqueued successfully: ${jobId}`);
    
    // Step 2: Poll for completion
    const maxPollingAttempts = 30;
    const pollingInterval = 3000; // 3 seconds
    let attempts = 0;
    
    while (attempts < maxPollingAttempts) {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxPollingAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      const statusUrl = `https://api.mindee.net/v1/products/${resolvedModelId}/predict_async/${jobId}`;
      const pollResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': authHeader,
        }
      });
      
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
        console.log('✅ Job completed successfully');
        return mapPredictionToResult(pollData, pollData.document);
      }
      
      if (pollData.job?.status === 'failed') {
        throw new Error('Mindee job processing failed');
      }
    }
    
    throw new Error('Mindee job polling timeout - the document is taking too long to process');
    
  } catch (error) {
    console.error('🚨 Error in Mindee client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client',
      details: error
    };
  }
}
