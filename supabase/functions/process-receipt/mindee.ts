
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
    
    const formData = new FormData();
    formData.append('model_id', modelId);
    formData.append('file', imageBlob, 'receipt.jpg');
    formData.append('confidence', 'true');  // Enable confidence scores
    formData.append('raw_text', 'false');   // We don't need raw text
    formData.append('polygon', 'false');    // We don't need polygons
    
    console.log('📤 Enqueueing inference with Mindee v2 API...');
    
    const enqueueResponse = await fetch(enqueueEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: formData
    });
    
    if (!enqueueResponse.ok) {
      const errorText = await enqueueResponse.text();
      console.error('🚨 Mindee enqueue error:', errorText);
      throw new Error(`Mindee enqueue failed: ${enqueueResponse.status} ${errorText}`);
    }
    
    const jobData = await enqueueResponse.json();
    const jobId = jobData.job?.id;
    
    if (!jobId) {
      console.error('🚨 No job ID returned from enqueue:', jobData);
      throw new Error('Failed to get job ID from Mindee API');
    }
    
    console.log(`✅ Job enqueued successfully: ${jobId}`);
    
    // Step 2: Poll for completion
    const maxPollingAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max
    const pollingInterval = 2000; // 2 seconds
    let attempts = 0;
    let jobStatus = 'Processing';
    let resultUrl = null;
    
    while (jobStatus === 'Processing' && attempts < maxPollingAttempts) {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxPollingAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      const pollResponse = await fetch(`https://api-v2.mindee.net/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': apiKey,
        }
      });
      
      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error('🚨 Mindee polling error:', errorText);
        throw new Error(`Mindee polling failed: ${pollResponse.status} ${errorText}`);
      }
      
      const pollData = await pollResponse.json();
      jobStatus = pollData.job?.status;
      resultUrl = pollData.job?.result_url;
      
      console.log(`📊 Job status: ${jobStatus}`);
      
      if (pollData.job?.error) {
        console.error('🚨 Job failed with error:', pollData.job.error);
        throw new Error(`Mindee job failed: ${pollData.job.error.detail || 'Unknown error'}`);
      }
    }
    
    if (jobStatus !== 'Processed') {
      throw new Error(`Job did not complete in time. Status: ${jobStatus} after ${attempts} attempts`);
    }
    
    if (!resultUrl) {
      throw new Error('No result URL provided for completed job');
    }
    
    console.log(`✅ Job completed, fetching results from: ${resultUrl}`);
    
    // Step 3: Get the inference result
    const resultResponse = await fetch(resultUrl, {
      headers: {
        'Authorization': apiKey,
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
