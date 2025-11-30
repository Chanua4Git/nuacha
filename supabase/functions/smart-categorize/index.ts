import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineItem {
  description: string;
  totalPrice: number;
}

interface Category {
  id: string;
  name: string;
  group: 'needs' | 'wants' | 'savings';
}

interface CategorizationRequest {
  lineItems: LineItem[];
  vendor?: string;
  categories: Category[];
}

interface Categorization {
  description: string;
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning?: string;
}

interface CategorizationResponse {
  categorizations: Categorization[];
  suggestNew?: boolean;
  suggestedName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lineItems, vendor, categories }: CategorizationRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`[smart-categorize] Processing ${lineItems.length} items from vendor: ${vendor || 'unknown'}`);

    // Build category list for AI context (inject real data pattern from Garden Ohm)
    const categoryList = categories
      .map(c => `- ${c.name} (ID: ${c.id}, Group: ${c.group})`)
      .join('\n');

    const systemPrompt = `You are an intelligent expense categorization assistant for a household budgeting app.

AVAILABLE CATEGORIES (ONLY USE THESE):
${categoryList}

CATEGORIZATION RULES:
1. Restaurant food items (fries, burgers, shrimp, pasta, salads, appetizers, entrees, desserts) = "Dining out / takeout"
2. Coffee items (americano, cappuccino, espresso, latte, macchiato) = "Dining out / takeout"
3. Toy stores (Micles, Toys R Us) or toy items (slime, lego, dolls) = "Kids Toys & Games"
4. Personal services (piercing, tattoo, nails, waxing, threading, alterations) = "Personal Services"
5. Kids clothing (t-shirts, shorts, shoes from kids stores) = "Kids Clothing & Shoes"
6. NEVER use "Accommodation" for food items - accommodation is for hotels/lodging only
7. If vendor is a restaurant, ALL line items should inherit "Dining out / takeout" unless item is clearly not food
8. Groceries = raw ingredients bought at supermarkets for cooking at home
9. If no category fits well, respond with: { "suggestNew": true, "suggestedName": "appropriate category name" }

TRINIDAD & TOBAGO SPECIFIC VENDORS:
- JTA Supermarket, PriceSmart, Massy Stores = Groceries
- Naked, Feast, Paprika, Chaud = Dining out / takeout
- Micles = Kids Toys & Games
- Anton's = Personal Services (if service related)

Respond with valid JSON only (no markdown):
{
  "categorizations": [
    { 
      "description": "item name", 
      "categoryId": "best-match-id", 
      "categoryName": "category name",
      "confidence": 0.9,
      "reasoning": "brief explanation"
    }
  ],
  "suggestNew": false,
  "suggestedName": null
}`;

    const userPrompt = `Vendor: ${vendor || 'Unknown'}

Line items to categorize:
${lineItems.map((item, i) => `${i + 1}. ${item.description} ($${item.totalPrice.toFixed(2)})`).join('\n')}

Categorize each item using ONLY the available categories. Use vendor context to inform your decisions.`;

    console.log(`[smart-categorize] Calling Lovable AI with ${categories.length} categories`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent categorization
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[smart-categorize] AI Gateway error (${response.status}):`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Lovable AI credits required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log(`[smart-categorize] AI response received, parsing JSON`);
    
    let parsedResponse: CategorizationResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('[smart-categorize] Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON');
    }

    console.log(`[smart-categorize] Successfully categorized ${parsedResponse.categorizations.length} items`);
    
    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[smart-categorize] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        categorizations: [] 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
