// Lovable AI OCR using Gemini 2.5 Flash for receipt extraction
// Uses multimodal vision + tool calling for structured data extraction

type NormalizedLineItem = {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  total?: number | null;
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

Extract the following data:
- Merchant/store name
- Total amount (the final total paid)
- Transaction date (in YYYY-MM-DD format)
- Individual line items with:
  * Item description
  * Quantity (if visible)
  * Unit price (if visible)
  * Total price for that line item
- Tax amount (if visible)
- Subtotal (if visible)

Important guidelines:
- Be precise with numbers - double-check decimal places
- For dates, use YYYY-MM-DD format
- If a field is unclear or not visible, omit it rather than guessing
- Focus on accuracy over completeness
- Line items should capture individual products/services purchased`
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
                    description: 'Individual items purchased',
                    items: {
                      type: 'object',
                      properties: {
                        description: {
                          type: 'string',
                          description: 'Item name or description'
                        },
                        quantity: {
                          type: 'number',
                          description: 'Quantity purchased'
                        },
                        unit_price: {
                          type: 'number',
                          description: 'Price per unit'
                        },
                        total_price: {
                          type: 'number',
                          description: 'Total price for this line item'
                        }
                      },
                      required: ['description']
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
    // Parse the date
    let parsedDate: Date | null = null;
    if (data.date) {
      parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    }

    // Normalize line items
    const lineItems: NormalizedLineItem[] = Array.isArray(data.line_items)
      ? data.line_items.map((item: any) => ({
          description: item.description || null,
          quantity: item.quantity || null,
          unitPrice: item.unit_price || null,
          total: item.total_price || null,
        }))
      : [];

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

    return {
      amount: data.total_amount || null,
      date: parsedDate,
      description: null,
      supplier: data.merchant_name ? { value: data.merchant_name } : null,
      place: null,
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
