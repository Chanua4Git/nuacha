
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { lovableOCR } from './lovable-ocr.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { suggestCategories } from './category-suggestions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

type ErrorResponse = {
  error: string;
  type: 'UPLOAD_ERROR' | 'SERVER_ERROR' | 'OCR_CONFIDENCE_LOW' | 'IMAGE_FORMAT_ERROR' | 'FETCH_ERROR';
  message: string;
  confidence?: number;
};

/**
 * Converts an ArrayBuffer to base64 using chunked processing
 * to avoid stack overflow errors with large images
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // Process in 8KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    console.log('🤖 Using Lovable AI (Gemini 2.5 Flash) for OCR');
    console.log('🔑 API key configured:', lovableApiKey ? 'Yes' : 'No');

    if (!lovableApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "We're experiencing technical difficulties",
          type: 'SERVER_ERROR',
          message: 'OCR service is not properly configured'
        } as ErrorResponse),
        { status: 200, headers: corsHeaders }
      );
    }

    const requestBody = await req.json();
    let imageData: Blob;
    let originalBase64: string | null = null;
    
    // Handle demo mode/direct base64 upload (for unauthenticated users)
    if (requestBody.receiptBase64 && requestBody.contentType) {
      console.log('🧾 Processing receipt from base64 data (demo mode)');
      
      // Store original base64 to avoid redundant conversion
      originalBase64 = requestBody.receiptBase64;
      
      // Convert base64 to Blob for size checking
      const binaryString = atob(requestBody.receiptBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      imageData = new Blob([bytes], { type: requestBody.contentType });
      console.log(`📄 Using original base64 (${Math.round(imageData.size / 1024)}KB)`);
    }
    // Handle standard storage-based processing (for authenticated users)
    else if (requestBody.receiptUrl) {
      const receiptUrl = requestBody.receiptUrl;
      
      if (!receiptUrl) {
        return new Response(
          JSON.stringify({
            error: "We couldn't find the receipt image",
            type: 'UPLOAD_ERROR',
            message: 'Please try uploading your receipt again'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }

      const projectId = 'fjrxqeyexlusjwzzecal';
      const expectedUrlPrefix = `https://${projectId}.supabase.co/storage/v1/object/public/receipts/`;
      
      if (!receiptUrl.startsWith(expectedUrlPrefix)) {
        return new Response(
          JSON.stringify({
            error: "We're having trouble accessing your receipt",
            type: 'FETCH_ERROR',
            message: 'The image location is not valid'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }

      const receiptPath = receiptUrl
        .replace(expectedUrlPrefix, '')
        .split('?')[0];
      
      console.log('🧾 Processing receipt path:', receiptPath);
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: downloadedImageData, error: downloadError } = await supabaseAdmin.storage
        .from('receipts')
        .download(receiptPath);
      
      if (downloadError || !downloadedImageData) {
        console.error('❌ Error downloading receipt:', downloadError);
        return new Response(
          JSON.stringify({
            error: "We couldn't access your receipt image",
            type: 'FETCH_ERROR',
            message: downloadError?.message || 'Please try uploading again'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      imageData = downloadedImageData;
      console.log(`📄 Downloaded image (${Math.round(imageData.size / 1024)}KB)`);
    } else {
      return new Response(
        JSON.stringify({
          error: "We couldn't find the receipt image",
          type: 'UPLOAD_ERROR',
          message: 'Please provide either a receipt URL or base64 image data'
        } as ErrorResponse),
        { status: 200, headers: corsHeaders }
      );
    }
    
    console.log('📊 Starting OCR processing with Lovable AI...');
    
    // Use original base64 if available (demo mode), otherwise convert with chunked processing
    let base64: string;
    if (originalBase64) {
      console.log('✨ Using original base64 (no conversion needed)');
      base64 = originalBase64;
    } else {
      console.log('🔄 Converting to base64 with chunked processing...');
      const arrayBuffer = await imageData.arrayBuffer();
      base64 = arrayBufferToBase64(arrayBuffer);
    }
    
    const result = await lovableOCR(base64);
    
    // Check for errors first
    if ('error' in result) {
      console.error('🚨 Error processing receipt:', result.error);

      const errMsg = String(result.error || '');

      // Map specific HTTP status codes to user-friendly messages
      if (errMsg.includes('status=402')) {
        return new Response(
          JSON.stringify({
            error: 'Payment required',
            type: 'SERVER_ERROR',
            message: 'Please add credits to your Lovable workspace to continue processing receipts.'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      if (errMsg.includes('status=429')) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            type: 'SERVER_ERROR',
            message: 'Too many requests. Please wait a moment and try again.'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      if (errMsg.match(/status=5\d\d/)) {
        return new Response(
          JSON.stringify({
            error: 'Temporary service issue',
            type: 'SERVER_ERROR',
            message: 'Our AI service is experiencing issues. Please try again in a moment.'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }

      // Network errors
      if (errMsg.includes('mindee_network_error')) {
        return new Response(
          JSON.stringify({
            error: 'Network connection issue',
            type: 'SERVER_ERROR',
            message: 'Please check your connection and try again'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }

      // Legacy error message handling for backwards compatibility
      if (errMsg.includes('401') || errMsg.toLowerCase().includes('unauthorized')) {
        return new Response(
          JSON.stringify({
            error: 'Secure connection hiccup with our OCR',
            type: 'SERVER_ERROR',
            message: 'We refreshed the connection—please try that receipt again.'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }

      // Clearer message when model path is misconfigured
      if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
        return new Response(
          JSON.stringify({
            error: 'Our receipt reader needed a quick tune-up',
            type: 'SERVER_ERROR',
            message: 'We’ve adjusted the settings. Please try that scan again.'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      if (errMsg.includes('fetch image')) {
        return new Response(
          JSON.stringify({
            error: "We're having trouble with this image",
            type: 'FETCH_ERROR',
            message: 'Could you try uploading it again?'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      if (errMsg.includes('format')) {
        return new Response(
          JSON.stringify({
            error: "This image format isn't supported",
            type: 'IMAGE_FORMAT_ERROR',
            message: 'Please upload a JPEG or PNG file'
          } as ErrorResponse),
          { status: 200, headers: corsHeaders }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: "We're having technical difficulties",
          type: 'SERVER_ERROR',
          message: 'Please try again in a moment'
        } as ErrorResponse),
        { status: 200, headers: corsHeaders }
      );
    }
    
    // Debug logging for successful result
    console.log('🔍 OCR result:', {
      date: result.date,
      amount: result.amount,
      description: result.description,
      place: result.place,
      supplier: result.supplier,
      confidence: result.confidence
    });
    
    // Implement fallback date handling if date is undefined
    if (!result.date && imageData) {
      console.log('⚠️ Date is undefined, using current timestamp as fallback');
      result.date = new Date();
      console.log('📅 Fallback date set to:', result.date);
    }
    
    if (result.confidence && result.confidence < 0.3) {
      return new Response(
        JSON.stringify({
          error: "The receipt text wasn't clear enough",
          type: 'OCR_CONFIDENCE_LOW',
          message: 'Feel free to adjust any details that need fixing',
          confidence: result.confidence,
          data: result
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // If we have line items, try to suggest categories for them
    if (result.lineItems && result.lineItems.length > 0 && supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        // Get user ID from authorization header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '');
          try {
            // For authenticated users, get their user ID
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            userId = user?.id;
            console.log(`👤 Authenticated user ID: ${userId}`);
          } catch (authError) {
            console.log('⚠️ Auth error, proceeding without user-specific categories:', authError);
          }
        } else {
          console.log('🔍 No auth header found, processing as demo user');
        }
        
        // Get the vendor name to help with categorization
        const vendorName = result.supplier?.value || 
                          result.storeDetails?.name || 
                          "";
        
        // Get familyId from request body
        const familyId = requestBody.familyId;
        
        console.log(`🏪 Vendor name detected: "${vendorName}"`);
        console.log(`👨‍👩‍👧‍👦 Family ID: ${familyId}`);
        console.log(`📦 Processing ${result.lineItems.length} line items for categorization`);
        
        // Get categories from database - filter by user if authenticated
        let categories = [];
        let rules = [];
        
        if (userId) {
          console.log(`🔍 Fetching unified categories for user: ${userId}, family: ${familyId}`);
          
          // For authenticated users, get unified categories (both budget and family categories)
          let categoryQueries = [];
          
          // Always get budget categories
          categoryQueries.push(
            supabaseAdmin
              .from('categories')
              .select('id, name, color, group_type')
              .eq('user_id', userId)
              .eq('is_budget_category', true)
              .is('family_id', null)
          );
          
          // If familyId is provided, also get family-specific categories
          if (familyId) {
            categoryQueries.push(
              supabaseAdmin
                .from('categories')
                .select('id, name, color, group_type')
                .eq('user_id', userId)
                .eq('family_id', familyId)
                .order('name')
            );
          }
          
          // Execute all category queries
          const categoryResults = await Promise.all(categoryQueries);
          const allCategories = [];
          
          for (const { data: categoryData, error: categoryError } of categoryResults) {
            if (categoryError) {
              console.error('❌ Error fetching categories:', categoryError);
            } else if (categoryData) {
              allCategories.push(...categoryData);
            }
          }
          
          // Deduplicate categories by name (family categories override budget categories)
          const categoryMap = new Map();
          allCategories.forEach(cat => {
            const existing = categoryMap.get(cat.name.toLowerCase());
            // Family categories take precedence (check if cat has family_id property)
            const catFamilyId = (cat as any).family_id;
            if (!existing || catFamilyId) {
              categoryMap.set(cat.name.toLowerCase(), cat);
            }
          });
          
          categories = Array.from(categoryMap.values());
          console.log(`✅ Found ${categories.length} unified categories:`, categories.map(c => c.name));
          
          // Get categorization rules if available
          const { data: userRules, error: rulesError } = await supabaseAdmin
            .from('categorization_rules')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('priority', { ascending: false });
            
          if (rulesError) {
            console.error('❌ Error fetching categorization rules:', rulesError);
          } else {
            rules = userRules || [];
            console.log(`✅ Found ${rules.length} categorization rules:`, rules.map(r => r.name));
          }
        } else {
          console.log('🔍 Demo mode: using sample categories');
          // For demo users, provide sample categories
          categories = [
            { id: 'sample-groceries', name: 'Groceries', color: '#22C55E', group_type: 'needs' },
            { id: 'sample-dining', name: 'Dining out', color: '#F97316', group_type: 'wants' },
            { id: 'sample-household', name: 'Household supplies', color: '#10B981', group_type: 'needs' }
          ];
          console.log('✅ Using sample categories for demo:', categories.map(c => c.name));
        }
        
        if (categories && categories.length > 0) {
          console.log(`🤖 Starting AI-powered categorization with ${categories.length} categories`);
          
          // Convert line items to format expected by smart-categorize
          const formattedLineItems = result.lineItems.map(item => ({
            description: item.description || '',
            totalPrice: parseFloat((item.totalPrice ?? (item as any).total_price)?.toString() || '0')
          }));
          
          // Format categories for AI categorization
          const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            group: cat.group_type as 'needs' | 'wants' | 'savings'
          }));
          
          try {
            // Call the smart-categorize edge function using AI
            const smartCategorizeUrl = `${supabaseUrl}/functions/v1/smart-categorize`;
            console.log(`🔗 Calling smart-categorize at: ${smartCategorizeUrl}`);
            
            const aiResponse = await fetch(smartCategorizeUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader || `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                lineItems: formattedLineItems,
                vendor: vendorName,
                categories: formattedCategories
              })
            });
            
            if (!aiResponse.ok) {
              const errorText = await aiResponse.text();
              console.error(`❌ Smart categorize error (${aiResponse.status}):`, errorText);
              throw new Error(`Smart categorize returned ${aiResponse.status}`);
            }
            
            const aiResult = await aiResponse.json();
            console.log(`✅ AI categorization complete`);
            
            // Apply AI suggestions to line items
            const enhancedLineItems = result.lineItems.map((item, index) => {
              const aiCategorization = aiResult.categorizations?.[index];
              
              return {
                description: item.description || '',
                quantity: item.quantity ?? undefined,
                unitPrice: (item.unitPrice ?? (item as any).unit_price)?.toString(),
                totalPrice: (item.totalPrice ?? (item as any).total_price)?.toString() || '0',
                confidence: 0.5,
                suggestedCategoryId: aiCategorization?.categoryId,
                categoryConfidence: aiCategorization?.confidence
              };
            });
            
            // Log categorization results
            const categorizedCount = enhancedLineItems.filter(item => item.suggestedCategoryId).length;
            console.log(`✅ AI Categorization complete: ${categorizedCount}/${enhancedLineItems.length} items categorized`);
            
            enhancedLineItems.forEach((item, index) => {
              if (item.suggestedCategoryId) {
                const category = categories.find(c => c.id === item.suggestedCategoryId);
                const aiCat = aiResult.categorizations?.[index];
                console.log(`  🤖 Item ${index + 1}: "${item.description}" → ${category?.name || item.suggestedCategoryId} (confidence: ${item.categoryConfidence || 0}, reasoning: ${aiCat?.reasoning || 'N/A'})`);
              } else {
                console.log(`  ❓ Item ${index + 1}: "${item.description}" → No category suggested`);
              }
            });
            
            // Replace the original line items with the AI-enhanced ones
            result.lineItems = enhancedLineItems;
            
          } catch (aiError) {
            console.error('❌ AI categorization failed, falling back to pattern matching:', aiError);
            
            // Fallback to original pattern matching if AI fails
            const formattedLineItems = result.lineItems.map(item => ({
              description: item.description || '',
              quantity: item.quantity ?? undefined,
              unitPrice: (item.unitPrice ?? (item as any).unit_price)?.toString(),
              totalPrice: (item.totalPrice ?? (item as any).total_price)?.toString() || '0',
              confidence: 0.5,
              suggestedCategoryId: item.suggestedCategoryId ?? undefined,
              categoryConfidence: item.categoryConfidence ?? undefined
            }));
            
            const enhancedLineItems = await suggestCategories(
              formattedLineItems,
              vendorName,
              categories,
              rules
            );
            
            result.lineItems = enhancedLineItems;
            console.log('✅ Fallback categorization complete');
          }
        } else {
          console.log('⚠️ No categories found, skipping category suggestions');
        }
      } catch (error) {
        console.error('❌ Error in categorization process:', error);
        // We don't want to fail the whole process if category suggestion fails
      }
    }
    
    console.log('✅ Successfully processed receipt');
    
    return new Response(
      JSON.stringify({
        ...result,
        confidence: result.confidence || 0
      }),
      { status: 200, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: "Something unexpected happened",
        type: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ErrorResponse),
      { status: 200, headers: corsHeaders }
    );
  }
});
