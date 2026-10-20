import { DEMO_RECEIPTS, REEL_H, REEL_W, ReelSpec, ReelStep, TAP_AT, reelTimeline, reelTapTimes } from './tutorialReelSpecs';
export * from './tutorialReelSpecs';

/**
 * Reels always use Nuacha's light brand palette (same values as the light theme tokens in index.css),
 * so an admin in dark mode still exports on-brand videos. The native camera/photo picker
 * colours below imitate the phone's own screens, which are not Nuacha UI.
 */
type Palette = { bg: string; text: string; muted: string; primary: string; onPrimary: string; card: string; accent: string; green: string; blush: string; border: string; mutedBg: string };
const BRAND: Palette = { bg: '#FAF9F7', text: '#2F2F2F', muted: '#5C5C5C', primary: '#5A7684', onPrimary: '#FAF9F7', card: '#FFFFFF', accent: '#F4E8D3', green: '#C3DCD1', blush: '#F1CBC7', border: '#E5E0DA', mutedBg: '#F2EFEB' };
const DEVICE = { dark: '#121212', glass: 'rgba(255,255,255,0.18)', sheet: '#FFFFFF', sheetText: '#111111', sheetMuted: '#8E8E93', select: '#0A84FF', table: '#C9B79C' };
let fontsRequested = false;
function palette(): Palette {
  if (!fontsRequested && typeof document !== 'undefined' && document.fonts) {
    fontsRequested = true;
    ['400 40px "Playfair Display"', '700 40px "Playfair Display"'].forEach(f => document.fonts.load(f).catch(() => undefined));
  }
  return BRAND;
}
const ease = (n: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, n)), 3);
const SANS = 'Inter, sans-serif';
const SERIF = '"Playfair Display", Georgia, serif';

// Phone screen on the 1080×1920 canvas. Inside it we draw in the app's own CSS pixels (428 wide).
const SX = 150, SY = 290, SW = 780, SH = 1340;
const U = SW / 428;
const px = (x: number) => SX + x * U, py = (y: number) => SY + y * U;

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 24) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function text(ctx: CanvasRenderingContext2D, words: string, x: number, y: number, size = 36, color = palette().text, max = 650, align: CanvasTextAlign = 'left', serif = false, weight = 500) {
  ctx.fillStyle = color; ctx.textAlign = align;
  let fontSize = size;
  const font = () => `${weight} ${fontSize}px ${serif ? SERIF : SANS}`;
  ctx.font = font();
  while (ctx.measureText(words).width > max && fontSize > 12) { fontSize--; ctx.font = font(); }
  ctx.fillText(words, x, y);
}
function lines(ctx: CanvasRenderingContext2D, words: string[], y: number, size: number, color: string, max = 900) {
  const all: string[] = [];
  ctx.font = `500 ${size}px ${SERIF}`;
  for (const paragraph of words) {
    let current = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width > max && current) { all.push(current); current = word; } else current = next;
    }
    if (current) all.push(current);
  }
  const fitted = Math.min(size, 360 / Math.max(1, all.length) / 1.22);
  all.forEach((line, i) => text(ctx, line, 540, y + i * fitted * 1.22, fitted, color, max, 'center', true));
}

// ---- Drawing in app CSS pixels ----
function R(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 0) { box(ctx, px(x), py(y), w * U, h * U, color, r * U); }
function stroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 0, lw = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = lw * U; ctx.beginPath(); ctx.roundRect(px(x), py(y), w * U, h * U, r * U); ctx.stroke();
}
function T(ctx: CanvasRenderingContext2D, words: string, x: number, y: number, size: number, color: string, o: { align?: CanvasTextAlign; serif?: boolean; weight?: number; max?: number } = {}) {
  text(ctx, words, px(x), py(y), size * U, color, (o.max ?? 396) * U, o.align ?? 'left', o.serif ?? false, o.weight ?? 400);
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px(x), py(y), r * U, 0, Math.PI * 2); ctx.fill(); }
function path(ctx: CanvasRenderingContext2D, color: string, lw: number, draw: (m: (x: number, y: number) => void, l: (x: number, y: number) => void) => void) {
  ctx.strokeStyle = color; ctx.lineWidth = lw * U; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  draw((x, y) => ctx.moveTo(px(x), py(y)), (x, y) => ctx.lineTo(px(x), py(y))); ctx.stroke();
}
// lucide-like icons
function iconCamera(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  stroke(ctx, cx - 10, cy - 7, 20, 15, color, 3, 2);
  path(ctx, color, 2, (m, l) => { m(cx - 4, cy - 7); l(cx - 2, cy - 10); l(cx + 2, cy - 10); l(cx + 4, cy - 7); });
  ctx.strokeStyle = color; ctx.lineWidth = 2 * U; ctx.beginPath(); ctx.arc(px(cx), py(cy + 0.5), 3.5 * U, 0, Math.PI * 2); ctx.stroke();
}
function iconUpload(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  path(ctx, color, 2, (m, l) => { m(cx - 10, cy + 2); l(cx - 10, cy + 9); l(cx + 10, cy + 9); l(cx + 10, cy + 2); m(cx, cy + 3); l(cx, cy - 10); m(cx - 5, cy - 5); l(cx, cy - 10); l(cx + 5, cy - 5); });
}
function iconLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.2 * U; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(px(cx - 12), py(cy + 12)); ctx.bezierCurveTo(px(cx - 14), py(cy - 6), px(cx), py(cy - 8), px(cx + 13), py(cy - 13));
  ctx.bezierCurveTo(px(cx + 16), py(cy + 4), px(cx + 4), py(cy + 14), px(cx - 9), py(cy + 9)); ctx.stroke();
  path(ctx, color, 2.2, (m, l) => { m(cx - 12, cy + 12); l(cx + 2, cy); });
}
function navbar(ctx: CanvasRenderingContext2D) {
  const c = palette();
  R(ctx, 0, 0, 428, 64, c.card); R(ctx, 0, 64, 428, 1, c.border);
  T(ctx, 'Nuacha', 16, 41, 22, c.text, { serif: true, weight: 700 });
  [24, 32, 40].forEach(y => R(ctx, 383, y - 1, 18, 2, c.text, 1));
}
function receiptPaper(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, w: number, h: number) {
  const c = palette(), data = DEMO_RECEIPTS[index] ?? DEMO_RECEIPTS[0];
  R(ctx, x, y, w, h, c.card, 2);
  const s = w / 220;
  T(ctx, data.merchant.toUpperCase(), x + w / 2, y + 26 * s, 13 * s, c.text, { align: 'center', weight: 700, max: w - 20 });
  T(ctx, 'Port of Spain · Trinidad', x + w / 2, y + 42 * s, 8 * s, c.muted, { align: 'center', max: w - 20 });
  T(ctx, data.date, x + w / 2, y + 56 * s, 8 * s, c.muted, { align: 'center', max: w - 20 });
  const gap = Math.min(18 * s, (h - 120 * s) / Math.max(1, data.items.length));
  data.items.forEach(([item, amount], i) => {
    T(ctx, item, x + 14 * s, y + 80 * s + i * gap, 9 * s, c.text, { max: w * .6 });
    T(ctx, amount, x + w - 14 * s, y + 80 * s + i * gap, 9 * s, c.text, { align: 'right', max: w * .3 });
  });
  R(ctx, x + 14 * s, y + h - 46 * s, w - 28 * s, 1, c.border);
  T(ctx, 'TOTAL', x + 14 * s, y + h - 28 * s, 11 * s, c.text, { weight: 700 });
  T(ctx, data.total, x + w - 14 * s, y + h - 28 * s, 11 * s, c.text, { align: 'right', weight: 700 });
  T(ctx, 'Thank you', x + w / 2, y + h - 10 * s, 7 * s, c.muted, { align: 'center' });
}
function finger(ctx: CanvasRenderingContext2D, x: number, y: number, p: number) {
  const c = palette(); ctx.save(); ctx.translate(x, y); ctx.scale(1 - p * .1, 1 - p * .1);
  ctx.fillStyle = c.card; ctx.strokeStyle = c.primary; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-18, 70); ctx.lineTo(-18, 10); ctx.bezierCurveTo(-18, -26, 18, -26, 18, 10);
  ctx.lineTo(18, 56); ctx.bezierCurveTo(65, 48, 90, 72, 85, 122); ctx.lineTo(75, 170); ctx.lineTo(0, 170);
  ctx.lineTo(-40, 110); ctx.bezierCurveTo(-58, 84, -42, 64, -18, 88); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/** Finger glides in and taps at `at` seconds into the scene. x/y in app CSS px. */
function tap(ctx: CanvasRenderingContext2D, ax: number, ay: number, local: number, at: number) {
  if (local < at - 1 || local > at + .65) return;
  const x = px(ax), y = py(ay), approach = ease((local - at + 1) / .85), c = palette();
  ctx.save(); ctx.strokeStyle = c.blush; ctx.lineWidth = 9;
  if (local > at) { ctx.globalAlpha = Math.max(0, 1 - (local - at) / .65); ctx.beginPath(); ctx.arc(x, y, 30 + (local - at) * 160, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore(); finger(ctx, x + (1 - approach) * 180, y + (1 - approach) * 220, local > at && local < at + .18 ? 1 : 0);
}
const tapAt = (step: ReelStep, i = 0) => step.seconds * (TAP_AT[step.scene]?.[i] ?? .72);

// ---- Screens, copied from the live app layout ----
function homeScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const c = palette();
  navbar(ctx);
  T(ctx, 'Home  ›', 16, 96, 14, c.muted);
  // Hero card: soft green → blush wash, like the home page
  const g = ctx.createLinearGradient(px(16), py(165), px(412), py(760));
  g.addColorStop(0, 'rgba(195,220,209,0.35)'); g.addColorStop(.55, 'rgba(244,232,211,0.25)'); g.addColorStop(1, 'rgba(241,203,199,0.3)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(px(16), py(165), 396 * U, 640 * U, 24 * U); ctx.fill();
  circle(ctx, 214, 257, 28, 'rgba(195,220,209,0.55)'); iconLeaf(ctx, 214, 257, c.primary);
  T(ctx, 'Begin Your Journey to', 214, 332, 30, c.text, { align: 'center', serif: true });
  T(ctx, 'Financial Peace', 214, 368, 30, c.text, { align: 'center', serif: true });
  ['Take a gentle first step. Upload your receipt', 'and watch as we transform it into organized,', 'peaceful financial clarity.'].forEach((l, i) => T(ctx, l, 214, 409 + i * 29, 16, c.muted, { align: 'center', max: 360 }));
  const pressSnap = step.via !== 'upload' && local > tapAt(step) && local < tapAt(step) + .2;
  const pressUp = step.via === 'upload' && local > tapAt(step) && local < tapAt(step) + .2;
  R(ctx, 32, 509 + (pressSnap ? 2 : 0), 364, 91, c.primary, 16);
  circle(ctx, 160, 555, 20, 'rgba(255,255,255,0.2)'); iconCamera(ctx, 160, 555, c.onPrimary);
  T(ctx, 'Snap Receipt', 192, 551, 17, c.onPrimary, { max: 200 }); T(ctx, 'Take a photo', 192, 571, 12, 'rgba(250,249,247,0.85)', { max: 200 });
  T(ctx, 'or', 214, 634, 15, c.muted, { align: 'center' });
  R(ctx, 32, 657 + (pressUp ? 2 : 0), 364, 91, pressUp ? c.mutedBg : c.bg, 16); stroke(ctx, 33, 658, 362, 89, c.primary, 16, 2);
  circle(ctx, 153, 703, 20, c.mutedBg); iconUpload(ctx, 153, 703, c.primary);
  T(ctx, 'Upload Receipt', 185, 699, 17, c.primary, { max: 200 }); T(ctx, 'From your device', 185, 719, 12, c.primary, { max: 200 });
  R(ctx, 109, 781, 210, 40, c.bg, 20); stroke(ctx, 109, 781, 210, 40, c.border, 20, 1);
  T(ctx, 'Long receipt (2+ photos)', 214, 806, 14, c.text, { align: 'center' });
  
  step.via === 'upload' ? tap(ctx, 214, 703, local, tapAt(step)) : tap(ctx, 214, 555, local, tapAt(step));
}
function cameraScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  R(ctx, 0, 0, 428, 800, DEVICE.dark);
  // live view: receipt resting on a table
  R(ctx, 0, 60, 428, 540, DEVICE.table);
  ctx.save(); ctx.translate(px(214), py(370)); ctx.rotate(-.03); ctx.translate(-px(214), -py(370));
  receiptPaper(ctx, step.receipt, 104, 100, 220, 450); ctx.restore();
  const c = palette();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3 * U;
  [[84, 84, 1, 1], [344, 84, -1, 1], [84, 572, 1, -1], [344, 572, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(px(x), py(y + 28 * dy)); ctx.lineTo(px(x), py(y)); ctx.lineTo(px(x + 28 * dx), py(y)); ctx.stroke(); });
  T(ctx, 'PHOTO', 214, 624, 13, '#F5C04A', { align: 'center', weight: 600 });
  T(ctx, 'Cancel', 30, 686, 16, '#FFFFFF');
  circle(ctx, 214, 680, 34, '#FFFFFF'); circle(ctx, 214, 680, 29, DEVICE.dark); circle(ctx, 214, 680, 26, '#FFFFFF');
  tap(ctx, 214, 680, local, tapAt(step));
  const since = local - tapAt(step);
  if (since > 0 && since < .25) { ctx.save(); ctx.globalAlpha = 1 - since / .25; ctx.fillStyle = c.card; ctx.fillRect(SX, SY, SW, SH); ctx.restore(); }
}
function photosScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const pick = tapAt(step, 0), add = tapAt(step, 1), picked = local > pick;
  // App dimmed behind the native photo picker sheet
  homeScreen(ctx, { ...step, scene: 'home', via: 'upload' }, -5);
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(SX, SY, SW, SH); ctx.restore();
  const rise = ease(local / .45) ; const top = 40 + (1 - rise) * 700;
  R(ctx, 0, top, 428, 800, DEVICE.sheet, 14);
  T(ctx, 'Cancel', 16, top + 34, 16, DEVICE.select);
  T(ctx, 'Recents', 214, top + 34, 17, DEVICE.sheetText, { align: 'center', weight: 600 });
  T(ctx, 'Add', 412, top + 34, 16, picked ? DEVICE.select : DEVICE.sheetMuted, { align: 'right', weight: 600 });
  R(ctx, 120, top + 52, 188, 28, '#EEEEF0', 8); R(ctx, 122, top + 54, 92, 24, '#FFFFFF', 7);
  T(ctx, 'Photos', 168, top + 71, 12, DEVICE.sheetText, { align: 'center', weight: 600 }); T(ctx, 'Albums', 261, top + 71, 12, DEVICE.sheetText, { align: 'center' });
  const tiles = ['#B8C9C0', '#E8D9C4', 'receipt-other', '#D9C2BE', 'target', '#A9B9C6', '#EADFCF', 'receipt-other', '#C9D3C3', '#DCCFB8', '#BFC8D2', '#E6CFC9'];
  const size = 141, gap = 2.5, gy = top + 92;
  tiles.forEach((tile, i) => {
    const x = (i % 3) * (size + gap), y = gy + Math.floor(i / 3) * (size + gap);
    if (tile === 'target' || tile === 'receipt-other') {
      R(ctx, x, y, size, size, DEVICE.table);
      if (tile === 'target') receiptPaper(ctx, step.receipt, x + 36, y + 6, 70, 150);
      else { R(ctx, x + 40, y + 8, 60, 140, '#FFFFFF', 1); [30, 44, 58, 72, 86].forEach(l => R(ctx, x + 48, y + l, 44, 3, '#CCCCCC')); }
    } else R(ctx, x, y, size, size, tile);
    if (tile === 'target' && picked) {
      stroke(ctx, x + 2, y + 2, size - 4, size - 4, DEVICE.select, 0, 4);
      circle(ctx, x + size - 16, y + size - 16, 11, DEVICE.select);
      path(ctx, '#FFFFFF', 2.2, (m, l) => { m(x + size - 21, y + size - 16); l(x + size - 17, y + size - 12); l(x + size - 11, y + size - 20); });
    }
  });
  tap(ctx, 1 * (size + gap) + 70, gy + (size + gap) + 70, local, pick);
  tap(ctx, 400, top + 30, local, add);
}
function readingScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const c = palette();
  navbar(ctx);
  R(ctx, 16, 84, 396, 600, c.card, 8); stroke(ctx, 16, 84, 396, 600, c.border, 8, 1);
  T(ctx, 'Receipt Preview', 32, 118, 18, c.text, { serif: true, weight: 600 });
  receiptPaper(ctx, step.receipt, 104, 140, 220, 470);
  // ReceiptProcessingLoader: dim overlay, white card, spinner, rotating line
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(px(16), py(84), 396 * U, 600 * U, 8 * U); ctx.fill(); ctx.restore();
  R(ctx, 74, 314, 280, 130, c.card, 8);
  ctx.strokeStyle = c.primary; ctx.lineWidth = 3 * U; ctx.lineCap = 'round'; ctx.beginPath();
  const a = local * 6; ctx.arc(px(214), py(356), 14 * U, a, a + Math.PI * 1.5); ctx.stroke();
  const msgs = ['Organised Finances', 'All Your Receipts Scanned With Ease', 'Your Receipts, Perfectly Organized'];
  T(ctx, msgs[Math.floor(local / 1.4) % msgs.length], 214, 410, 14, c.text, { align: 'center', weight: 500, max: 250 });
}
function field(ctx: CanvasRenderingContext2D, label: string, value: string, y: number, p: number, chevron = false) {
  const c = palette();
  T(ctx, label, 32, y, 14, c.text, { weight: 500 });
  R(ctx, 32, y + 8, 364, 40, c.card, 6); stroke(ctx, 32, y + 8, 364, 40, c.border, 6, 1);
  const shown = value.slice(0, Math.floor(value.length * Math.max(0, Math.min(1, p))));
  T(ctx, shown, 44, y + 33, 14, c.text, { max: 320 });
  if (chevron) path(ctx, c.muted, 1.5, (m, l) => { m(374, y + 25); l(379, y + 30); l(384, y + 25); });
}
function reviewScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const c = palette(), data = DEMO_RECEIPTS[step.receipt] ?? DEMO_RECEIPTS[0];
  navbar(ctx);
  R(ctx, 16, 84, 396, 630, c.card, 8); stroke(ctx, 16, 84, 396, 630, c.border, 8, 1);
  T(ctx, 'Add Expense', 32, 124, 24, c.text, { serif: true, weight: 600 });
  const values: [string, string, boolean][] = [['Family', 'My household', true], ['Amount ($)', data.total.replace('TT$', ''), false], ['Description', data.items.length > 1 ? 'Groceries' : data.items[0][0], false], ['Place', data.merchant, false], ['Date', 'October 20th, 2026', false], ['Category', data.category, true]];
  values.forEach(([label, value, chev], i) => field(ctx, label, value, 168 + i * 78, (local - i * .2) * 3, chev));
  const press = local > tapAt(step) && local < tapAt(step) + .2;
  R(ctx, 32, 650 + (press ? 1 : 0), 364, 40, c.primary, 6);
  T(ctx, 'Add Expense', 214, 676, 14, c.onPrimary, { align: 'center', weight: 500 });
  tap(ctx, 214, 670, local, tapAt(step));
}
function savedScreen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const c = palette(), data = DEMO_RECEIPTS[step.receipt] ?? DEMO_RECEIPTS[0];
  navbar(ctx);
  T(ctx, 'Expenses', 16, 112, 28, c.text, { serif: true, weight: 600 });
  R(ctx, 16, 136, 396, 96, c.card, 12); stroke(ctx, 16, 136, 396, 96, c.primary, 12, 2);
  T(ctx, data.merchant, 32, 168, 17, c.text, { weight: 600, max: 240 });
  R(ctx, 32, 182, 86, 22, c.green, 11); T(ctx, data.category, 75, 198, 11, c.text, { align: 'center', max: 80 });
  T(ctx, 'My household · 20 Oct 2026', 126, 198, 12, c.muted, { max: 200 });
  T(ctx, data.total, 396, 168, 17, c.primary, { align: 'right', weight: 600, max: 140 });
  [248, 336].forEach(y => { R(ctx, 16, y, 396, 76, c.card, 12); stroke(ctx, 16, y, 396, 76, c.border, 12, 1); R(ctx, 32, y + 22, 150, 10, c.mutedBg, 5); R(ctx, 32, y + 44, 90, 10, c.mutedBg, 5); });
  const show = ease(local / .4);
  ctx.save(); ctx.globalAlpha = show;
  R(ctx, 16, 640 + (1 - show) * 30, 396, 64, c.card, 8); stroke(ctx, 16, 640 + (1 - show) * 30, 396, 64, c.border, 8, 1);
  T(ctx, 'That’s saved.', 32, 666 + (1 - show) * 30, 15, c.text, { weight: 600 });
  T(ctx, 'Keep going at your own pace.', 32, 688 + (1 - show) * 30, 13, c.muted);
  ctx.restore();
}
function screen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  if (step.scene === 'home') homeScreen(ctx, step, local);
  else if (step.scene === 'camera') cameraScreen(ctx, step, local);
  else if (step.scene === 'photos') photosScreen(ctx, step, local);
  else if (step.scene === 'reading') readingScreen(ctx, step, local);
  else if (step.scene === 'review') reviewScreen(ctx, step, local);
  else savedScreen(ctx, step, local);
}
function phone(ctx: CanvasRenderingContext2D, step: ReelStep, local: number, animate: boolean) {
  const c = palette(); const zoom = animate ? 1 + .015 * Math.sin(Math.PI * local / step.seconds) : 1;
  ctx.save(); ctx.translate(540, 960); ctx.scale(zoom, zoom); ctx.translate(-540, -960);
  ctx.save(); ctx.shadowColor = 'rgba(47,47,47,0.18)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  box(ctx, SX - 16, SY - 16, SW + 32, SH + 32, '#2F2F2F', 60); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(SX, SY, SW, SH, 46); ctx.clip(); box(ctx, SX, SY, SW, SH, c.bg, 46); screen(ctx, step, local); ctx.restore(); ctx.restore();
}
export function renderReel(ctx: CanvasRenderingContext2D, t: number, spec: ReelSpec) {
  const c = palette(), tl = reelTimeline(spec), animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  ctx.globalAlpha = 1; ctx.fillStyle = c.bg; ctx.fillRect(0, 0, REEL_W, REEL_H);
  if (t < tl.hookEnd) {
    box(ctx, 0, 0, REEL_W, REEL_H, c.accent, 0);
    text(ctx, 'Nuacha', 540, 260, 82, c.primary, 900, 'center', true);
    const last = spec.steps[0]; if (last) { ctx.save(); ctx.globalAlpha = .22; phone(ctx, last, 0, false); ctx.restore(); }
    box(ctx, 0, 620, REEL_W, 570, c.accent, 0);
    lines(ctx, spec.hook, 815 + (animate ? 35 * (1 - ease(t / .5)) : 0), 88, c.text);
    text(ctx, 'A softer way to track spending.', 540, 1460, 38, c.primary, 920, 'center'); return;
  }
  if (t >= tl.ctaStart) {
    box(ctx, 0, 0, REEL_W, REEL_H, c.primary, 0);
    text(ctx, 'Nuacha', 540, 575, 130, c.onPrimary, 930, 'center', true);
    text(ctx, 'A softer way to track spending.', 540, 660, 39, c.onPrimary, 930, 'center');
    lines(ctx, spec.cta, 965, 78, c.accent);
    box(ctx, 210, 1420, 660, 125, c.accent, 32); text(ctx, 'nuacha.com  →', 540, 1503, 58, c.text, 600, 'center'); return;
  }
  const active = tl.scenes.find(s => t >= s.start && t < s.end) ?? tl.scenes[tl.scenes.length - 1];
  if (!active) return;
  const local = Math.min(active.step.seconds, t - active.start);
  text(ctx, 'Nuacha', 540, 108, 62, c.primary, 800, 'center', true);
  const overall = Math.min(1, (t - tl.stepsStart) / (tl.resultStart - tl.stepsStart));
  box(ctx, 150, 170, 780, 16, c.accent, 8); box(ctx, 150, 170, Math.max(16, 780 * overall), 16, c.primary, 8);
  text(ctx, `Scan ${active.step.count} of 3 today`, 540, 240, 32, c.muted, 860, 'center');
  phone(ctx, active.step, local, animate);
  lines(ctx, [active.step.caption], 1715, 50, c.text, 920);
  if (t >= tl.resultStart) {
    ctx.save(); ctx.globalAlpha = .8; box(ctx, 0, 0, REEL_W, REEL_H, c.bg, 0); ctx.restore();
    const elapsed = t - tl.resultStart, scale = animate ? 1 + .8 * (1 - ease(elapsed / .3)) : 1;
    ctx.save(); ctx.translate(540, 960); ctx.rotate(-.045); ctx.scale(scale, scale);
    box(ctx, -450, -112, 900, 224, c.green, 28); ctx.strokeStyle = c.primary; ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(-450, -112, 900, 224, 28); ctx.stroke();
    text(ctx, spec.stamp, 0, 28, 78, c.primary, 820, 'center', true); ctx.restore();
  }
}
export function scheduleReelSounds(ac: AudioContext, dest: AudioNode, start: number, spec: ReelSpec) {
  const tl = reelTimeline(spec);
  const tone = (at: number, f1: number, f2: number, duration: number, volume: number) => {
    const oscillator = ac.createOscillator(), gain = ac.createGain();
    oscillator.frequency.setValueAtTime(f1, start + at); oscillator.frequency.exponentialRampToValueAtTime(f2, start + at + duration);
    gain.gain.setValueAtTime(volume, start + at); gain.gain.exponentialRampToValueAtTime(.0001, start + at + duration);
    oscillator.connect(gain).connect(dest); oscillator.start(start + at); oscillator.stop(start + at + duration);
  };
  reelTapTimes(spec).forEach(at => tone(at, 1000, 250, .045, .19));
  tl.scenes.forEach(scene => {
    if (scene.step.scene === 'review') for (let i = 0; i < 18; i++) tone(scene.start + .06 + i * .055, 700, 480, .024, .025);
    if (scene.step.scene === 'reading') { tone(scene.end - .6, 440, 880, .12, .12); tone(scene.start + .12, 580, 740, .09, .08); }
  });
  tone(tl.resultStart + .12, 140, 45, .35, .48);
  tone(tl.ctaStart + .15, 660, 660, .4, .16); tone(tl.ctaStart + .4, 990, 990, .6, .14);
  // A quiet, locally synthesised chord bed. No external music or user data.
  for (let at = 0; at < tl.duration; at += 4) {
    [220, 277.18, 329.63].forEach(frequency => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = frequency;
      const end = Math.min(tl.duration, at + 4);
      g.gain.setValueAtTime(.0001, start + at); g.gain.linearRampToValueAtTime(.016, start + at + .4); g.gain.linearRampToValueAtTime(.0001, start + end);
      o.connect(g).connect(dest); o.start(start + at); o.stop(start + end);
    });
  }
}
