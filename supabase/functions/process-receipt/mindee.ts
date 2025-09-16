
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { mapPredictionToResult } from './prediction-mapper.ts';
import { MindeeOCRResult } from './types.ts';

export const mindeeClient = async (apiKey: string, imageBlob: Blob): Promise<MindeeOCRResult> => {
  try {
    const modelId = Deno.env.get('MINDEE_MODEL_ID');
    
    if (!modelId) {
      throw new Error('MINDEE_MODEL_ID is not configured');
    }
    
    console.log(`📄 Processing receipt image (${Math.round(imageBlob.size / 1024)}KB) with model ${modelId}`);
    
    // Step 1: Enqueue the inference
    const enqueueEndpoint = 'https://api-v2.mindee.net/v2/inferences/enqueue';
    
    // Build minimal form data (some options are not available on all plans)
    const buildFormData = () => {
      const formData = new FormData();
      formData.append('model_id', modelId);
      formData.append('file', imageBlob, 'receipt.jpg');
      return formData;
    };
    
    console.log('📤 Enqueueing inference with Mindee v2 API...');
    
    // Initial enqueue
    let enqueueResponse = await fetch(enqueueEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`,
      },
      body: buildFormData()
    });

    // Retry once on 402 (Payment Required) or similar plan-related errors
    if (!enqueueResponse.ok && enqueueResponse.status === 402) {
      const errorText = await enqueueResponse.text();
      console.warn('💳 Mindee 402 Payment Required. Retrying with minimal options...', errorText);
      await new Promise((r) => setTimeout(r, 1000));
      enqueueResponse = await fetch(enqueueEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`,
        },
        body: buildFormData()
      });
    }
    
    if (!enqueueResponse.ok) {
      const errorText = await enqueueResponse.text();
      console.error('🚨 Mindee enqueue error:', errorText);
      throw new Error(`Mindee enqueue failed: ${enqueueResponse.status} ${errorText}`);
    }
    
    const jobData = await enqueueResponse.json();
    const jobId = jobData.job?.id;
    const pollingUrl: string | null = jobData.job?.polling_url || (jobId ? `https://api-v2.mindee.net/v2/jobs/${jobId}` : null);
    
    if (!jobId) {
      console.error('🚨 No job ID returned from enqueue:', jobData);
      throw new Error('Failed to get job ID from Mindee API');
    }
    
    if (!pollingUrl) {
      console.error('🚨 No polling URL available for job:', jobData);
      throw new Error('Failed to determine polling URL for Mindee job');
    }
    
    console.log(`✅ Job enqueued successfully: ${jobId}`);
    
    // Step 2: Poll for completion or get inference data directly
    const maxPollingAttempts = 35; // Slightly increased attempts
    const pollingInterval = 2000; // 2 seconds
    let attempts = 0;
    let jobStatus: string | undefined = 'processing';
    let lastPollData: any = null;
    let inferenceData: any = null;
    
    while (attempts < maxPollingAttempts) {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxPollingAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      const pollResponse = await fetch(pollingUrl, {
        headers: {
          'Authorization': apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`,
        }
      });
      
      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('🚨 Mindee polling error:', errorText);
        throw new Error(`Mindee polling failed: ${pollResponse.status} ${errorText}`);
      }
      
      const pollData = await pollResponse.json();
      lastPollData = pollData;
      
      // Debug: Log the complete polling response to understand structure
      console.log('🔍 Debug: Full polling response:', JSON.stringify(pollData, null, 2));
      
      // Check if inference data is available directly in the response
      if (pollData.inference && pollData.inference.result) {
        console.log('✅ Inference data found directly in polling response');
        inferenceData = pollData.inference;
        break;
      }
      
      // Try multiple ways to access the job status (API might have different structures)
      jobStatus = pollData.job?.status || pollData.status || pollData.job_status;
      
      // Debug: Log what we extracted
      console.log('🔍 Debug: Extracted jobStatus:', jobStatus);
      
      const normalizedStatus = (jobStatus || '').toLowerCase();
      console.log(`📊 Job status: ${jobStatus}`);
      
      if (pollData.job?.error) {
        console.error('🚨 Job failed with error:', pollData.job.error);
        throw new Error(`Mindee job failed: ${pollData.job.error.detail || 'Unknown error'}`);
      }
      
      if (normalizedStatus === 'processed') {
        break;
      }
    }
    
    // If we got inference data directly, use it
    if (inferenceData) {
      console.log('✅ Using inference data from polling response');
      return mapPredictionToResult(inferenceData, null);
    }
    
    // If we have lastPollData with inference, use that as fallback
    if (lastPollData?.inference?.result) {
      console.log('✅ Using inference data from last poll as fallback');
      return mapPredictionToResult(lastPollData.inference, null);
    }
    
    // Traditional flow: check for result URL and fetch
    const resultUrl = lastPollData?.job?.result_url || lastPollData?.result_url;
    
    if (!resultUrl) {
      throw new Error('No result URL or inference data available after polling');
    }
    
    console.log(`✅ Job completed, fetching results from: ${resultUrl}`);
    
    // Step 3: Get the inference result
    const resultResponse = await fetch(resultUrl, {
      headers: {
        'Authorization': apiKey.startsWith('Token ') ? apiKey : `Token ${apiKey}`,
      }
    });
    
    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      console.error('🚨 Mindee result fetch error:', errorText);
      throw new Error(`Mindee result fetch failed: ${resultResponse.status} ${errorText}`);
    }
    
    const resultData = await resultResponse.json();
    console.log('✅ Successfully received inference results from Mindee v2');
    
    // Map the v2 response to our expected format
    return mapPredictionToResult(resultData.inference, null);
    
  } catch (error) {
    console.error('🚨 Error in Mindee v2 client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee v2 client',
      details: error
    };
  }
}
