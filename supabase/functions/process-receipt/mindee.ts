// process-receipt/mindee.ts
type ModelId =
  | { kind: "uuid"; uuid: string }
  | { kind: "owner_model"; owner: string; model: string; version?: string };

function parseModelId(raw?: string): ModelId {
  // Safe default: official Mindee receipts model v5.3
  const fallback = { kind: "owner_model", owner: "mindee", model: "expense_receipts", version: "v5.3" } as const;
  if (!raw || !raw.trim()) return fallback;

  // UUID form (custom model on legacy app)
  if (/^[0-9a-fA-F-]{36}$/.test(raw)) return { kind: "uuid", uuid: raw };

  // owner/model[@vX[.Y]]
  const m = raw.match(/^([^/]+)\/([^@]+)(?:@v?([\d.]+))?$/);
  if (!m) return fallback;
  const [, owner, model, ver] = m;
  return { kind: "owner_model", owner, model, version: ver ? `v${ver}` : "v5.3" };
}

function modelBase(id: ModelId): string {
  const apiBase = "https://api.mindee.net";
  return id.kind === "uuid"
    ? `${apiBase}/v1/products/${id.uuid}`
    : `${apiBase}/v1/products/${id.owner}/${id.model}/${id.version ?? "v5.3"}`;
}

function mkErr(status: number, data: any) {
  const msg = (data?.message || data?.error || "Mindee request failed").toString();
  return { error: `${status} ${msg}` };
}

async function callMindeePredict(
  apiKey: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const rawModel = Deno.env.get("MINDEE_MODEL_ID"); // e.g. "mindee/expense_receipts@v5.3" or UUID
  const base = modelBase(parseModelId(rawModel));

  const headers: Record<string, string> = {
    Authorization: `Token ${apiKey}`,
    "Content-Type": contentType || "application/octet-stream",
  };

  // Try async first
  let r: Response | null = null;
  try {
    r = await fetch(`${base}/predict_async`, { method: "POST", headers, body: bytes });
    console.log("🔍 Mindee response (async)", r?.status);
  } catch (_) {
    // network error → treat as backend unavailable and try sync
  }

  // If async not supported/allowed → fall back to sync
  if (!r || !r.ok && [404, 405, 501].includes(r.status)) {
    console.log("Mindee: async unsupported, falling back to /predict");
    const rs = await fetch(`${base}/predict`, { method: "POST", headers, body: bytes });
    console.log("🔍 Mindee response (sync)", rs.status);
    const data = await rs.json().catch(() => ({}));
    if (!rs.ok) return mkErr(rs.status, data);
    return data;
  }

  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    return mkErr(r.status, data);
  }

  return await r.json().catch(() => ({}));
}

/** Extracts a compact, Nuacha-friendly result from Mindee's receipts response */
function normalizePrediction(json: any) {
  // Mindee V2 receipts structure:
  // json.document.inference.prediction.{total_amount,date,locale,supplier, ...}
  const pred = json?.document?.inference?.prediction ?? {};

  const toNumber = (v: any) => (typeof v === "number" ? v : (typeof v?.value === "number" ? v.value : undefined));
  const toString = (v: any) => (typeof v === "string" ? v : (typeof v?.value === "string" ? v.value : undefined));

  // Amount/date
  const amount = toNumber(pred.total_amount ?? pred.total_incl ?? pred.total_excl);
  const dateStr = toString(pred.date);
  const date = dateStr ? new Date(dateStr) : undefined;

  // Supplier / place
  const supplier = pred?.supplier ?? pred?.supplier_name ?? {};
  const supplierName = toString(supplier) || toString(pred?.company_name) || undefined;

  // Description – best effort
  const description =
    toString(pred?.category) ||
    toString(pred?.document_type) ||
    undefined;

  // Confidence (Mindee gives per-field confidence; take a simple average of a few)
  const confidences: number[] = []
    .concat(pred?.total_amount?.confidence ?? pred?.total_incl?.confidence ?? [])
    .concat(pred?.date?.confidence ?? [])
    .concat(supplier?.confidence ?? []);
  const confidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) / confidences.length
      : undefined;

  // Line items (if available)
  const items = Array.isArray(pred?.line_items) ? pred.line_items : [];
  const lineItems = items.map((it: any) => ({
    description: toString(it?.description) || "",
    quantity: toNumber(it?.quantity),
    unitPrice: toNumber(it?.unit_price),
    total: toNumber(it?.total_amount ?? it?.amount),
  }));

  return {
    amount,
    date,
    description,
    place: undefined, // not always provided separately by Mindee
    supplier: supplierName ? { value: supplierName } : undefined,
    confidence,
    lineItems,
    storeDetails: supplierName ? { name: supplierName } : undefined,
  };
}

/** Public API used by the handler */
export async function mindeeClient(apiKey: string, image: Blob): Promise<
  | {
      amount?: number;
      date?: Date;
      description?: string;
      place?: string;
      supplier?: { value: string };
      confidence?: number;
      lineItems?: Array<{ description: string; quantity?: number; unitPrice?: number; total?: number }>;
      storeDetails?: { name?: string };
    }
  | { error: string }
> {
  try {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const contentType = image.type || "application/octet-stream";

    const raw = await callMindeePredict(apiKey, bytes, contentType);
    if (raw && "error" in raw) {
      // Pass through for the handler's existing `'error' in result` checks.
      return raw;
    }

    const normalized = normalizePrediction(raw);

    console.log("🔧 Using model:", Deno.env.get("MINDEE_MODEL_ID") || "mindee/expense_receipts@v5.3 (defaulted)");
    console.log("🔍 Raw OCR result from Mindee (condensed):", {
      date: normalized.date,
      amount: normalized.amount,
      description: normalized.description,
      supplier: normalized.supplier?.value,
      confidence: normalized.confidence,
      lineItems: normalized.lineItems?.length ?? 0,
    });

    return normalized;
  } catch (e: any) {
    const msg = (e?.message || "Unexpected error calling Mindee").toString();
    return { error: `500 ${msg}` };
  }
}