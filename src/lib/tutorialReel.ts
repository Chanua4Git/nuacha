// Tutorial reel renderer: pure drawing of one frame at time t (seconds) on a 1080x1920 canvas.
export const REEL_W = 1080;
export const REEL_H = 1920;
export const REEL_FPS = 30;

export interface ReelStep { screenshot: string | null; tap: { x: number; y: number } | null; caption: string }
export interface ReelSpec {
  slug: string;
  order: number;
  hook: string[];
  steps: ReelStep[];
  stamp: string;
  progress: { current: number; total: number };
  cta: string[];
  caption_instagram: string;
  caption_whatsapp: string;
}
/** Loaded images keyed by step index; hook image optional. */
export interface ReelAssets { steps: (HTMLImageElement | null)[]; hook?: HTMLImageElement | null }

const C = { primary: "#5A7684", accent: "#F4E8D3", green: "#C3DCD1", blush: "#F1CBC7", bg: "#FAF9F7", text: "#2F2F2F" };
const HOOK = 2, SHOW = 2, STEP = 2.6, RESULT = 2, CTA = 2.5;

export function reelTimeline(spec: ReelSpec) {
  const stepsStart = HOOK + SHOW;
  const resultStart = stepsStart + spec.steps.length * STEP;
  const ctaStart = resultStart + RESULT;
  return { hookEnd: HOOK, stepsStart, resultStart, ctaStart, duration: ctaStart + CTA };
}

/** Times at which a tap lands (for click sounds). */
export function reelTapTimes(spec: ReelSpec): number[] {
  const { stepsStart } = reelTimeline(spec);
  return spec.steps.flatMap((s, i) => (s.tap ? [stepsStart + i * STEP + 1.2] : []));
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

function bigText(ctx: CanvasRenderingContext2D, lines: string[], y: number, size: number, color: string, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.textAlign = "center";
  ctx.font = `700 ${size}px "Playfair Display", Georgia, serif`;
  const all = lines.flatMap((l) => wrap(ctx, l, REEL_W - 140));
  all.forEach((l, i) => ctx.fillText(l, REEL_W / 2, y + i * size * 1.2));
  ctx.restore();
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

// Phone frame geometry
const PW = 760, PH = 1500, PX = (REEL_W - PW) / 2, PY = 230;
const SX = PX + 24, SY = PY + 24, SW = PW - 48, SH = PH - 48;

function drawScreen(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, zoom: number, label: string) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#1d1d1f"; rr(ctx, PX, PY, PW, PH, 90); ctx.fill();
  ctx.restore();
  ctx.save(); rr(ctx, SX, SY, SW, SH, 70); ctx.clip();
  ctx.fillStyle = C.bg; ctx.fillRect(SX, SY, SW, SH);
  if (img) {
    const s = Math.max(SW / img.width, SH / img.height) * zoom;
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, SX + (SW - w) / 2, SY + (SH - h) / 2, w, h);
  } else {
    ctx.fillStyle = C.accent; ctx.fillRect(SX, SY, SW, 200);
    ctx.fillStyle = C.primary; ctx.font = '600 44px "Inter", sans-serif'; ctx.textAlign = "center";
    ctx.fillText("Add a screenshot", SX + SW / 2, SY + SH / 2);
    ctx.font = '400 32px "Inter", sans-serif'; ctx.fillText(label, SX + SW / 2, SY + SH / 2 + 60);
  }
  ctx.restore();
}

/** Maps a 0–1 tap point on the screenshot to canvas coordinates (matches cover-fit at zoom). */
function tapToCanvas(img: HTMLImageElement | null, tap: { x: number; y: number }, zoom: number) {
  if (!img) return { x: SX + tap.x * SW, y: SY + tap.y * SH };
  const s = Math.max(SW / img.width, SH / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  return { x: SX + (SW - w) / 2 + tap.x * w, y: SY + (SH - h) / 2 + tap.y * h };
}

function finger(ctx: CanvasRenderingContext2D, x: number, y: number, press: number) {
  ctx.save(); ctx.translate(x, y); const s = 1 - press * 0.12; ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.strokeStyle = C.primary; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.primary; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function caption(ctx: CanvasRenderingContext2D, text: string, alpha: number) {
  if (!text) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = '700 58px "Inter", sans-serif';
  const w = Math.min(REEL_W - 100, ctx.measureText(text).width + 90);
  ctx.fillStyle = C.primary; rr(ctx, (REEL_W - w) / 2, 1770, w, 110, 55); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(text, REEL_W / 2, 1845, REEL_W - 160);
  ctx.restore();
}

function progressBar(ctx: CanvasRenderingContext2D, p: { current: number; total: number }, fill: number) {
  const x = 140, w = REEL_W - 280, y = 120;
  ctx.fillStyle = "rgba(90,118,132,0.18)"; rr(ctx, x, y, w, 22, 11); ctx.fill();
  ctx.fillStyle = C.primary; rr(ctx, x, y, Math.max(22, (w * (p.current - 1 + fill)) / p.total), 22, 11); ctx.fill();
  ctx.fillStyle = C.text; ctx.font = '500 34px "Inter", sans-serif'; ctx.textAlign = "center";
  ctx.fillText(`Step ${p.current} of ${p.total}`, REEL_W / 2, y + 80);
}

export function renderReel(ctx: CanvasRenderingContext2D, t: number, spec: ReelSpec, assets: ReelAssets) {
  const tl = reelTimeline(spec);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, REEL_W, REEL_H);

  // 1. Hook
  if (t < tl.hookEnd) {
    const g = ctx.createLinearGradient(0, 0, 0, REEL_H); g.addColorStop(0, C.accent); g.addColorStop(1, C.green);
    ctx.fillStyle = g; ctx.fillRect(0, 0, REEL_W, REEL_H);
    if (assets.hook) { ctx.globalAlpha = 0.35; const s = Math.max(REEL_W / assets.hook.width, REEL_H / assets.hook.height); ctx.drawImage(assets.hook, (REEL_W - assets.hook.width * s) / 2, (REEL_H - assets.hook.height * s) / 2, assets.hook.width * s, assets.hook.height * s); ctx.globalAlpha = 1; }
    const a = ease(t / 0.5);
    bigText(ctx, spec.hook, 820 + (1 - a) * 60, 110, C.text, a);
    return;
  }

  // 2–3. Show + steps
  if (t < tl.resultStart) {
    progressBar(ctx, spec.progress, clamp01((t - tl.stepsStart) / (tl.resultStart - tl.stepsStart)));
    if (t < tl.stepsStart) {
      const k = (t - tl.hookEnd) / SHOW; const zoom = 1 + 0.06 * k;
      drawScreen(ctx, assets.steps[0] ?? null, zoom, spec.steps[0]?.caption ?? "");
      caption(ctx, spec.steps[0]?.caption ?? "", ease(k * 2));
      return;
    }
    const i = Math.min(spec.steps.length - 1, Math.floor((t - tl.stepsStart) / STEP));
    const lt = t - tl.stepsStart - i * STEP; const step = spec.steps[i]; const img = assets.steps[i] ?? null;
    const zoom = 1.06;
    drawScreen(ctx, img, zoom, step.caption);
    if (lt < 0.25 && i > 0) { ctx.fillStyle = `rgba(250,249,247,${1 - lt / 0.25})`; ctx.fillRect(SX, SY, SW, SH); }
    if (step.tap) {
      const p = tapToCanvas(img, step.tap, zoom);
      // highlight ring
      ctx.save(); ctx.strokeStyle = C.blush; ctx.lineWidth = 10; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(lt * 6);
      ctx.beginPath(); ctx.arc(p.x, p.y, 80, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      const travel = ease((lt - 0.2) / 0.9);
      const fx = p.x + (1 - travel) * 220, fy = p.y + (1 - travel) * 320;
      const press = lt > 1.1 && lt < 1.4 ? 1 : 0;
      if (lt > 1.2) { const r = (lt - 1.2) * 300; ctx.save(); ctx.strokeStyle = C.primary; ctx.globalAlpha = clamp01(1 - (lt - 1.2) / 0.7); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      finger(ctx, fx, fy, press);
    }
    caption(ctx, step.caption, ease(lt / 0.3));
    return;
  }

  // 4. Result stamp
  if (t < tl.ctaStart) {
    const lt = t - tl.resultStart;
    progressBar(ctx, spec.progress, 1);
    drawScreen(ctx, assets.steps[assets.steps.length - 1] ?? null, 1.06, "");
    ctx.fillStyle = "rgba(250,249,247,0.55)"; ctx.fillRect(0, 0, REEL_W, REEL_H);
    const s = lt < 0.3 ? 2.2 - 1.2 * ease(lt / 0.3) : 1;
    ctx.save(); ctx.translate(REEL_W / 2, 960); ctx.rotate(-0.08); ctx.scale(s, s);
    ctx.font = '800 76px "Inter", sans-serif'; const w = ctx.measureText(spec.stamp).width + 100;
    ctx.strokeStyle = C.primary; ctx.lineWidth = 12; rr(ctx, -w / 2, -80, w, 160, 30); ctx.stroke();
    ctx.fillStyle = C.primary; ctx.textAlign = "center"; ctx.fillText(spec.stamp, 0, 26);
    ctx.restore();
    return;
  }

  // 5. CTA
  const lt = t - tl.ctaStart; const a = ease(lt / 0.5);
  ctx.fillStyle = C.primary; ctx.fillRect(0, 0, REEL_W, REEL_H);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = '700 120px "Playfair Display", Georgia, serif'; ctx.fillText("Nuacha", REEL_W / 2, 620);
  ctx.font = '400 44px "Inter", sans-serif'; ctx.fillText("A softer way to track spending", REEL_W / 2, 700);
  ctx.restore();
  bigText(ctx, spec.cta, 1000, 84, C.accent, a);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = '600 64px "Inter", sans-serif';
  ctx.fillText("nuacha.com", REEL_W / 2, 1500); ctx.restore();
}

/** WebAudio sound effects scheduled against an AudioContext start time. */
export function scheduleReelSounds(ac: AudioContext, dest: AudioNode, start: number, spec: ReelSpec) {
  const tl = reelTimeline(spec);
  const click = (at: number) => {
    const len = Math.floor(ac.sampleRate * 0.03); const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); src.buffer = buf; const g = ac.createGain(); g.gain.value = 0.5;
    src.connect(g).connect(dest); src.start(start + at);
  };
  const tone = (at: number, f1: number, f2: number, dur: number, vol: number) => {
    const o = ac.createOscillator(); const g = ac.createGain();
    o.frequency.setValueAtTime(f1, start + at); o.frequency.exponentialRampToValueAtTime(f2, start + at + dur);
    g.gain.setValueAtTime(vol, start + at); g.gain.exponentialRampToValueAtTime(0.001, start + at + dur);
    o.connect(g).connect(dest); o.start(start + at); o.stop(start + at + dur);
  };
  reelTapTimes(spec).forEach(click);
  tone(tl.resultStart + 0.3, 140, 50, 0.4, 0.8); // thud
  tone(tl.ctaStart + 0.2, 660, 660, 0.5, 0.25); tone(tl.ctaStart + 0.45, 990, 990, 0.8, 0.25); // chime
  // soft pad
  const pad = ac.createOscillator(); const pg = ac.createGain(); pad.type = "sine"; pad.frequency.value = 220;
  pg.gain.setValueAtTime(0.0001, start); pg.gain.linearRampToValueAtTime(0.04, start + 1); pg.gain.linearRampToValueAtTime(0.0001, start + tl.duration);
  pad.connect(pg).connect(dest); pad.start(start); pad.stop(start + tl.duration);
}

export const SCAN_FIRST_RECEIPT: ReelSpec = {
  slug: "scan-first-receipt",
  order: 3,
  hook: ["Your first receipt", "in 10 seconds"],
  steps: [
    { screenshot: null, tap: { x: 0.5, y: 0.82 }, caption: "Tap Scan" },
    { screenshot: null, tap: { x: 0.5, y: 0.9 }, caption: "Snap the receipt" },
    { screenshot: null, tap: null, caption: "Nuacha reads it for you" },
  ],
  stamp: "RECEIPT 1 OF 3 ✓",
  progress: { current: 3, total: 10 },
  cta: ["Next:", "Scan receipt #2"],
  caption_instagram: "Your first receipt, read for you in seconds.\nTap Scan, snap it, done.\nhttps://nuacha.com/?start=scan&utm_source=instagram&utm_medium=social\n#Nuacha #TrinidadAndTobago #FamilyBudget #ReceiptScanning",
  caption_whatsapp: "First receipt done in 10 seconds 🌿 Tap Scan, snap it, Nuacha fills it in. https://nuacha.com/?start=scan&utm_source=whatsapp&utm_medium=social",
};
