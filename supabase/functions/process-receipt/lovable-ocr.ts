// Lovable AI OCR using Gemini 2.5 Flash for receipt extraction
// Uses multimodal vision + tool calling for structured data extraction

type NormalizedLineItem = {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: string | null; // Changed from 'total' to 'totalPrice' to match expected format
  suggestedCategoryId?: string | null;
  categoryConfidence?: number | null;
};

type NormalizedResult = {
  amount?: number | null;
  date?: Date | null;
  description?: string | null;
  supplier?: { value?: string | null } | null;
  place?: string | null;
  storeDetails?: { name?: string | null } | null;
  confidence?: number | null;
  lineItems?: NormalizedLineItem[];
  raw?: any;
} | { error: string; status?: number; details?: any };

function mkErr(message: string, status?: number, details?: any): NormalizedResult {
  const errorMessage = status ? `${message} (status=${status})` : message;
  return { error: errorMessage, status, details };
}

export async function lovableOCR(imageData: string): Promise<NormalizedResult> {
  try {
    const apiKey = (globalThis as any).Deno?.env?.get('LOVABLE_API_KEY') ?? '';
    if (!apiKey) {
      return mkErr("LOVABLE_API_KEY is not configured");
    }

    console.log("🤖 Starting Lovable AI OCR with Gemini 2.5 Flash");

    // Prepare the image in base64 format
    let base64Image = imageData;
    if (!imageData.startsWith('data:image')) {
      base64Image = `data:image/jpeg;base64,${imageData}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert receipt data extraction system. Analyze this receipt image and extract all relevant information with high accuracy.

CRITICAL REQUIREMENTS:
1. MERCHANT NAME: Extract the EXACT store/business name as it appears at the top of the receipt
2. TOTAL AMOUNT: Extract the FINAL TOTAL paid (look for "TOTAL", "AMOUNT DUE", "GRAND TOTAL", or similar labels - usually at the bottom after tax)
   - If this is ONLY A PARTIAL RECEIPT (middle section without the final total), set total_amount to 0
3. TRANSACTION DATE: Extract the date and convert to YYYY-MM-DD format
   - CRITICAL DATE RULE: ALWAYS interpret slash/dash-separated dates as DD/MM/YYYY format
   - Examples that MUST be correct:
     * "8/7/2025" → "2025-08-07" (August 7, 2025, NOT July 8 or November 7)
     * "8/11/2025" → "2025-08-11" (August 11, 2025, NOT November 8)
     * "15/3/2024" → "2024-03-15" (March 15, 2024)
   - DOUBLE-CHECK: If the date you extracted is more than tomorrow, you made a mistake - use DD/MM/YYYY interpretation
   - Most receipts worldwide use DD/MM/YYYY format
   - Common formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
4. LINE ITEMS: For EACH product/service purchased, extract:
   - Full item description/name (exactly as printed)
   - Quantity (if visible, otherwise assume 1)
   - Individual item's TOTAL PRICE (this is MANDATORY - look on the RIGHT SIDE of each product line)
   - Unit price per item (if visible separately)

EXTRACTION TIPS:
- Line item prices are RIGHT-ALIGNED on each product line - look at the FAR RIGHT EDGE
- MANDATORY: Each line item MUST have its individual price extracted (this is critical!)
- Look for prices in this typical format: [Item Description] .............. [Price]
- Prices are usually formatted as: $X.XX or X.XX
- The TOTAL at the bottom is separate from individual line item prices
- If this is a PARTIAL RECEIPT (top or middle section):
  - Still extract ALL visible line items with their prices from the right side
  - Set total_amount to 0 to indicate the total is not visible
  - The user will scan additional pages to capture the complete receipt
- Tax and subtotal are separate from line items
- If you truly cannot read a price for an item, set it to 0.00 (but look harder first!)

Be extremely precise with decimal points and currency amounts. Each line item MUST have a total_price extracted.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_receipt_data',
              description: 'Extract structured data from a receipt image',
              parameters: {
                type: 'object',
                properties: {
                  merchant_name: {
                    type: 'string',
                    description: 'Name of the store or merchant'
                  },
                  total_amount: {
                    type: 'number',
                    description: 'Total amount paid on the receipt'
                  },
                  date: {
                    type: 'string',
                    description: 'Transaction date in YYYY-MM-DD format'
                  },
                  tax_amount: {
                    type: 'number',
                    description: 'Tax amount if visible'
                  },
                  subtotal: {
                    type: 'number',
                    description: 'Subtotal before tax if visible'
                  },
                  line_items: {
                    type: 'array',
                    description: 'Individual items purchased - MUST include total_price for each item',
                    items: {
                      type: 'object',
                      properties: {
                        description: {
                          type: 'string',
                          description: 'Item name or description'
                        },
                        quantity: {
                          type: 'number',
                          description: 'Quantity purchased (default to 1 if not visible)'
                        },
                        unit_price: {
                          type: 'number',
                          description: 'Price per unit (optional if only total is visible)'
                        },
                        total_price: {
                          type: 'number',
                          description: 'REQUIRED: Total price for this line item - look on the right side of each product line'
                        }
                      },
                      required: ['description', 'total_price']
                    }
                  },
                  confidence_notes: {
                    type: 'string',
                    description: 'Any notes about data quality or uncertainty'
                  }
                },
                required: ['merchant_name', 'total_amount', 'date']
              }
            }
          }
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'extract_receipt_data' }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Lovable AI request failed:", response.status, errorText);
      
      if (response.status === 429) {
        return mkErr("Rate limit exceeded - too many requests", 429, errorText);
      }
      if (response.status === 402) {
        return mkErr("Payment required - please add credits to your Lovable workspace", 402, errorText);
      }
      
      return mkErr("Lovable AI request failed", response.status, errorText);
    }

    const result = await response.json();
    console.log("✅ Lovable AI response received");

    // Extract the tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_receipt_data') {
      console.error("❌ No valid tool call in response:", JSON.stringify(result, null, 2));
      return mkErr("Invalid AI response format", undefined, result);
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("📊 Extracted data:", JSON.stringify(extractedData, null, 2));

    // Normalize to the expected format (compatible with MindeeOCRResult)
    const normalized = normalizeExtractedData(extractedData);
    return normalized;

  } catch (err: any) {
    console.error("❌ Lovable OCR error:", err);
    return mkErr(err?.message || "Lovable AI OCR unexpected error");
  }
}

function normalizeExtractedData(data: any): NormalizedResult {
  try {
    // Parse and validate the date
    let parsedDate: Date | null = null;
    if (data.date) {
      parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      } else {
        // Validate: if date is more than 1 day in the future, it's likely wrong
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (parsedDate > tomorrow) {
          console.warn(`⚠️ Date ${data.date} is in the future, likely misinterpreted`);
          
          // Check if the date is already in YYYY-MM-DD format
          if (data.date.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
            // Input is YYYY-MM-DD, AI may have swapped day/month
            const parts = data.date.split('-');
            const year = parts[0];
            const firstNum = parts[1];  // Could be month or day
            const secondNum = parts[2];  // Could be day or month
            
            // Try swapping: YYYY-MM-DD → YYYY-DD-MM (interpret as DD/MM input)
            if (parseInt(firstNum) <= 31 && parseInt(secondNum) <= 12) {
              const correctedDateStr = `${year}-${secondNum.padStart(2, '0')}-${firstNum.padStart(2, '0')}`;
              const correctedDate = new Date(correctedDateStr);
              
              if (!isNaN(correctedDate.getTime()) && correctedDate <= tomorrow) {
                console.log(`✅ Corrected date from ${data.date} to ${correctedDateStr} (swapped day/month)`);
                parsedDate = correctedDate;
              }
            }
          } else {
            // Input might be in DD/MM/YYYY format, parse it correctly
            const parts = data.date.split(/[-\/\.]/);
            if (parts.length === 3) {
              const potentialDay = parts[0];
              const potentialMonth = parts[1];
              const year = parts[2];
              
              if (parseInt(potentialDay) <= 31 && parseInt(potentialMonth) <= 12) {
                const correctedDateStr = `${year}-${potentialMonth.padStart(2, '0')}-${potentialDay.padStart(2, '0')}`;
                const correctedDate = new Date(correctedDateStr);
                
                if (!isNaN(correctedDate.getTime()) && correctedDate <= tomorrow) {
                  console.log(`✅ Corrected date from ${data.date} to ${correctedDateStr}`);
                  parsedDate = correctedDate;
                }
              }
            }
          }
        }
      }
    }

    // Normalize line items
    const lineItems: NormalizedLineItem[] = Array.isArray(data.line_items)
      ? data.line_items.map((item: any) => ({
          description: item.description || null,
          quantity: item.quantity || null,
          unitPrice: item.unit_price || null,
          totalPrice: item.total_price ? String(item.total_price) : '0.00', // Convert to string and provide default
        }))
      : [];

    // Log warning for items without prices
    const itemsWithoutPrices = lineItems.filter(item => 
      !item.totalPrice || parseFloat(item.totalPrice) === 0
    );
    if (itemsWithoutPrices.length > 0) {
      console.warn(`⚠️ ${itemsWithoutPrices.length} items extracted without prices:`, 
        itemsWithoutPrices.map(i => i.description).slice(0, 5)
      );
    }

    console.log("📦 Processed line items:", {
      count: lineItems.length,
      withPrices: lineItems.length - itemsWithoutPrices.length,
      withoutPrices: itemsWithoutPrices.length,
      sample: lineItems.slice(0, 3).map(item => ({
        desc: item.description,
        total: item.totalPrice
      }))
    });

    // Calculate confidence based on completeness of data
    let confidenceFactors = 0;
    let confidenceTotal = 0;

    if (data.merchant_name) {
      confidenceFactors++;
      confidenceTotal += 0.9; // High confidence if we got merchant
    }
    if (data.total_amount) {
      confidenceFactors++;
      confidenceTotal += 0.95; // Very high confidence if we got total
    }
    if (data.date) {
      confidenceFactors++;
      confidenceTotal += 0.85; // Good confidence if we got date
    }
    if (lineItems.length > 0) {
      confidenceFactors++;
      confidenceTotal += 0.8; // Good confidence if we got line items
    }

    const confidence = confidenceFactors > 0 ? confidenceTotal / confidenceFactors : 0.5;

    // Log the normalized result for debugging
    console.log("📊 Normalized result:", {
      merchant: data.merchant_name,
      amount: data.total_amount,
      date: parsedDate?.toISOString(),
      lineItemCount: lineItems.length,
      confidence
    });

    return {
      amount: data.total_amount || null,
      date: parsedDate,
      description: null,
      supplier: data.merchant_name ? { value: data.merchant_name } : null,
      place: data.merchant_name || null, // FIX: Map merchant_name to place field
      storeDetails: data.merchant_name ? { name: data.merchant_name } : null,
      confidence,
      lineItems,
      raw: data
    };
  } catch (err: any) {
    console.error("❌ Error normalizing extracted data:", err);
    return mkErr("Failed to normalize extracted data", undefined, err.message);
  }
}
