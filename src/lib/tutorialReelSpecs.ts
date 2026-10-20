export const REEL_W = 1080;
export const REEL_H = 1920;
export const REEL_FPS = 30;
export type SceneKind = "home" | "camera" | "photos" | "reading" | "review" | "saved";
export interface ReelStep { scene: SceneKind; caption: string; receipt: number; count: number; seconds: number; via?: "snap" | "upload"; lessonStepId?: string }
export interface ReelSpec {
  slug: string; order: number; title: string; hook: string[]; steps: ReelStep[]; moduleId: string;
  stamp: string; cta: string[]; caption_instagram: string; caption_whatsapp: string; caption_tiktok: string;
}
export const DEMO_RECEIPTS = [
  { merchant: "Massy Stores", total: "TT$214.50", date: "20/10/2026", category: "Groceries", items: [["Fresh fruit", "48.00"], ["Rice", "36.50"], ["Milk & cereal", "75.00"], ["Household essentials", "55.00"]] },
  { merchant: "NP Service Station", total: "TT$150.00", date: "20/10/2026", category: "Transportation", items: [["Fuel", "150.00"]] },
  { merchant: "Massy Stores", total: "TT$86.00", date: "20/10/2026", category: "Groceries", items: [["Vegetables", "36.00"], ["Bread & eggs", "50.00"]] },
] as const;
export const SCAN_FIRST_RECEIPT: ReelSpec = {
  slug: "scan-first-receipt", order: 2, title: "Scan your first receipt", moduleId: "first-receipt-scan",
  hook: ["Still keeping receipts", "in a shoebox?"],
  steps: [
    { scene: "home", caption: "Tap Snap Receipt", receipt: 0, count: 0, seconds: 3, via: "snap", lessonStepId: "step-2-1" },
    { scene: "camera", caption: "Snap your receipt", receipt: 0, count: 0, seconds: 3.5, lessonStepId: "step-2-2" },
    { scene: "reading", caption: "Nuacha reads the details", receipt: 0, count: 1, seconds: 3.5, lessonStepId: "step-2-3" },
    { scene: "review", caption: "Check it, then save", receipt: 0, count: 1, seconds: 4, lessonStepId: "step-2-4" },
    { scene: "saved", caption: "Your first receipt, organised", receipt: 0, count: 1, seconds: 2, lessonStepId: "step-2-6" },
  ], stamp: "SAVED", cta: ["Next: scan receipts", "2 and 3"],
  caption_instagram: "Still keeping receipts in a shoebox? Scan, check, save. A softer way to track spending. https://nuacha.com/?start=scan #Nuacha #TrinidadAndTobago",
  caption_whatsapp: "Your first receipt, organised. Three free scans a day. https://nuacha.com/?start=scan",
  caption_tiktok: "Posting this until it finds its tribe. Scan, check, save. https://nuacha.com/?start=scan #Nuacha #TrinidadAndTobago",
};
export const SCAN_TWO_AND_THREE: ReelSpec = {
  slug: "scan-receipts-two-and-three", order: 3, title: "Scan receipts 2 and 3", moduleId: "first-receipt-scan",
  hook: ["One receipt down.", "Two more to go."],
  steps: [
    { scene: "home", caption: "Already have a photo? Tap Upload Receipt", receipt: 1, count: 1, seconds: 2.5, via: "upload" },
    { scene: "photos", caption: "Pick receipt two from your photos", receipt: 1, count: 1, seconds: 3 },
    { scene: "reading", caption: "Two scans today", receipt: 1, count: 2, seconds: 2.5 },
    { scene: "review", caption: "Check the details and save", receipt: 1, count: 2, seconds: 3 },
    { scene: "home", caption: "Receipt three? Tap Snap Receipt", receipt: 2, count: 2, seconds: 2, via: "snap" },
    { scene: "camera", caption: "Snap it with your camera", receipt: 2, count: 2, seconds: 2.5 },
    { scene: "reading", caption: "Three scans today", receipt: 2, count: 3, seconds: 2.5 },
    { scene: "review", caption: "Check, save, and you're done", receipt: 2, count: 3, seconds: 3 },
  ], stamp: "3 SCANS TODAY", cta: ["Next: see where", "your spending goes"],
  caption_instagram: "Three receipts, one calmer day. Use your three free daily scans, check the details and save. https://nuacha.com/?start=scan #Nuacha",
  caption_whatsapp: "Make space for a little clarity: three free receipt scans every day. https://nuacha.com/?start=scan",
  caption_tiktok: "Receipt two. Receipt three. A little less clutter. https://nuacha.com/?start=scan #Nuacha #ReceiptScanning",
};
export const REEL_DEFAULTS = [SCAN_FIRST_RECEIPT, SCAN_TWO_AND_THREE];
export function reelsForLesson(moduleId: string) { return REEL_DEFAULTS.filter(reel => reel.moduleId === moduleId); }
export function reelLessonPath(reel: ReelSpec, stepId?: string) {
  return `/updates?tab=learning&module=${encodeURIComponent(reel.moduleId)}${stepId ? `&step=${encodeURIComponent(stepId)}` : ''}`;
}
export const UPCOMING_REELS = ["Sign up and log in", "Review and fix a scanned receipt", "Categories and your spending overview", "Make your first budget", "Run payroll", "Reports and export", "Upgrade: the payment screen", "What you unlock after paying"];

/** Saved legacy media/tap/data fields must never enter a rendered reel. Only words are accepted. */
export function applyReelWords(base: ReelSpec, saved: unknown): ReelSpec {
  const value = saved && typeof saved === "object" ? saved as Record<string, unknown> : {};
  const words = (key: string, fallback: string) => typeof value[key] === "string" ? (value[key] as string).slice(0, 2000) : fallback;
  const lines = (key: string, fallback: string[]) => Array.isArray(value[key]) && (value[key] as unknown[]).every(x => typeof x === "string") ? (value[key] as string[]).slice(0, 8).map(x => x.slice(0, 240)) : [...fallback];
  const steps = Array.isArray(value.steps) ? value.steps as Record<string, unknown>[] : [];
  // Old screenshot specs are intentionally reset to the new scripted defaults.
  const scripted = value.version === 2;
  return { ...base, hook: scripted ? lines("hook", base.hook) : [...base.hook], cta: scripted ? lines("cta", base.cta) : [...base.cta],
    steps: base.steps.map((step, i) => ({ ...step, caption: scripted && typeof steps[i]?.caption === "string" ? String(steps[i].caption).slice(0, 240) : step.caption })),
    stamp: scripted ? words("stamp", base.stamp) : base.stamp,
    caption_instagram: scripted ? words("caption_instagram", base.caption_instagram) : base.caption_instagram,
    caption_whatsapp: scripted ? words("caption_whatsapp", base.caption_whatsapp) : base.caption_whatsapp,
    caption_tiktok: scripted ? words("caption_tiktok", base.caption_tiktok) : base.caption_tiktok };
}
export function reelWords(spec: ReelSpec) {
  return { version: 2, hook: spec.hook, steps: spec.steps.map(s => ({ caption: s.caption })), stamp: spec.stamp, cta: spec.cta, caption_instagram: spec.caption_instagram, caption_whatsapp: spec.caption_whatsapp, caption_tiktok: spec.caption_tiktok };
}
export function reelTimeline(spec: ReelSpec) {
  const stepsStart = 1.8;
  let start = stepsStart;
  const scenes = spec.steps.map(step => { const scene = { start, end: start + step.seconds, step }; start = scene.end; return scene; });
  return { hookEnd: stepsStart, stepsStart, scenes, resultStart: start, ctaStart: start + 2, duration: start + 5 };
}
/** Where in each scene (as a fraction of its length) the scripted finger taps. */
export const TAP_AT: Partial<Record<SceneKind, number[]>> = { home: [0.72], camera: [0.72], photos: [0.42, 0.8], review: [0.72] };
export function reelTapTimes(spec: ReelSpec) {
  return reelTimeline(spec).scenes.flatMap(s => (TAP_AT[s.step.scene] ?? []).map(f => s.start + s.step.seconds * f));
}