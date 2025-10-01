// supabase/functions/process-receipt/mindee.ts
// Mindee v2 client: enqueue -> poll -> fetch result -> normalize
// Uses multipart/form-data as required by v2. No Bearer prefix for Authorization.

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

const V2_BASE = "https://api-v2.mindee.net";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getModelId(): string {
  const raw = (globalThis as any).Deno?.env?.get('MINDEE_MODEL_ID') ?? '';
  const modelId = raw.trim();
  if (!modelId) {
    throw new Error(
      "MINDEE_MODEL_ID is missing. For v2 you must set a model UUID from the Mindee console."
    );
  }
  return modelId;
}

function mkErr(message: string, status?: number, details?: any): NormalizedResult {
  const errorMessage = status ? `${message} (status=${status})` : message;
  return { error: errorMessage, status, details };
}

async function enqueue(apiKey: string, file: Blob, modelId: string) {
  const fd = new FormData();
  fd.set("model_id", modelId);
  fd.set("file", new File([file], "receipt.jpg", { type: file.type || "image/jpeg" }));

  const r = await fetch(`${V2_BASE}/v2/inferences/enqueue`, {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Accept": "application/json",
    },
    body: fd,
  });

  const txt = await r.text();
  console.log("📥 Mindee enqueue raw response:", txt);
  
  let json: any = null;
  try { json = txt ? JSON.parse(txt) : null; } catch {}

  if (!r.ok) {
    console.error("❌ Mindee enqueue failed:", r.status, json || txt);
    return mkErr("Mindee enqueue failed", r.status, json || txt);
  }

  console.log("✅ Mindee enqueue parsed JSON:", JSON.stringify(json, null, 2));
  console.log("🔍 Response keys:", Object.keys(json || {}));
  
  return json;
}

async function pollForResult(apiKey: string, jobId: string, timeoutMs = 120000, intervalMs = 1200) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > timeoutMs) {
      return mkErr("Mindee polling timed out");
    }

    const url = `${V2_BASE}/v2/jobs/${jobId}`;
    const r = await fetch(url, {
      headers: {
        "Authorization": apiKey,
        "Accept": "application/json",
      },
      redirect: "manual",
    });

    if (r.status === 302) {
      const loc = r.headers.get("Location");
      if (!loc) return mkErr("Mindee returned 302 without Location");
      return await fetchResult(apiKey, loc);
    }

    const bodyText = await r.text();
    let json: any = null;
    try { json = bodyText ? JSON.parse(bodyText) : null; } catch {}

    if (!r.ok) {
      return mkErr("Mindee job status error", r.status, json || bodyText);
    }

    const status = json?.status;
    if (status === "Failed") {
      return mkErr("Mindee job failed", r.status, json);
    }
    
    await sleep(intervalMs);
  }
}

async function fetchResult(apiKey: string, resultUrl: string) {
  const rr = await fetch(resultUrl, {
    headers: {
      "Authorization": apiKey,
      "Accept": "application/json",
    },
  });
  const txt = await rr.text();
  let json: any = null;
  try { json = txt ? JSON.parse(txt) : null; } catch {}

  if (!rr.ok) return mkErr("Mindee result fetch failed", rr.status, json || txt);
  return json;
}

function normalizePrediction(v2json: any): NormalizedResult {
  const pred = v2json?.inference?.prediction ?? v2json?.document?.inference?.prediction ?? v2json?.prediction;

  if (!pred) {
    return { error: "Unexpected Mindee v2 response shape", details: { keys: Object.keys(v2json || {}) } };
  }

  const total =
    Number(pred?.total_amount?.value ?? pred?.total_incl?.value ?? pred?.amount?.value ?? pred?.total?.value) || null;

  const dateStr = pred?.date?.value ?? pred?.invoice_date?.value ?? pred?.document_date?.value ?? null;
  const date = dateStr ? new Date(dateStr) : null;

  const supplierName =
    pred?.supplier_name?.value ?? pred?.merchant_name?.value ?? pred?.supplier?.value ?? null;

  const lineItemsRaw = Array.isArray(pred?.line_items) ? pred?.line_items : pred?.items;
  const lineItems: NormalizedLineItem[] = Array.isArray(lineItemsRaw)
    ? lineItemsRaw.map((it: any) => ({
        description: it?.description?.value ?? it?.product_code?.value ?? null,
        quantity: it?.quantity?.value ? Number(it.quantity.value) : null,
        unitPrice: it?.unit_price?.value ? Number(it.unit_price.value) : null,
        total: it?.total_amount?.value ? Number(it.total_amount.value) : null,
      }))
    : [];

  const confs: number[] = [];
  const pushConf = (c: any) => { 
    const n = typeof c === "number" ? c : (c?.value ?? c); 
    if (typeof n === "number") confs.push(n); 
  };
  pushConf(pred?.total_amount?.confidence);
  pushConf(pred?.date?.confidence);
  pushConf(pred?.supplier_name?.confidence);
  const confidence = confs.length ? confs.reduce((a,b)=>a+b,0)/confs.length : null;

  return {
    amount: total,
    date,
    description: null,
    supplier: supplierName ? { value: supplierName } : null,
    place: null,
    storeDetails: supplierName ? { name: supplierName } : null,
    confidence,
    lineItems,
    raw: v2json
  };
}

export async function mindeeClient(apiKey: string, imageData: Blob): Promise<NormalizedResult> {
  try {
    const key = (apiKey || "").trim();
    if (!key) return mkErr("Missing Mindee API key");

    const modelId = getModelId();
    console.log("🔧 (v2) Using model_id:", modelId);
    console.log("🌐 (v2) Base:", V2_BASE);

    const enq = await enqueue(key, imageData, modelId);
    if ("error" in enq) return enq as any;

    console.log("🔍 Enqueue result:", JSON.stringify(enq, null, 2));
    
    const jobId = enq?.job_id || enq?.id || enq?.job?.id;
    console.log("🔍 Extracted jobId:", jobId);
    
    if (!jobId) {
      console.error("❌ No job ID found. Full enqueue response:", JSON.stringify(enq, null, 2));
      return mkErr("Mindee enqueue did not return job_id", undefined, enq);
    }

    const res = await pollForResult(key, jobId);
    if ("error" in res) return res as any;

    const norm = normalizePrediction(res);
    return norm;
  } catch (err: any) {
    return mkErr(err?.message || "Mindee v2 unexpected error");
  }
}
