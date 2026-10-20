import { DEMO_RECEIPTS, REEL_H, REEL_W, ReelSpec, ReelStep, reelTimeline, reelTapTimes } from './tutorialReelSpecs';
export * from './tutorialReelSpecs';

type Palette = { bg: string; text: string; muted: string; primary: string; onPrimary: string; card: string; accent: string; green: string; blush: string; border: string };
let colors: Palette | undefined;
function palette(): Palette {
  if (colors) return colors;
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => `hsl(${css.getPropertyValue(`--${name}`).trim()})`;
  colors = { bg: token('background'), text: token('foreground'), muted: token('muted-foreground'), primary: token('primary'), onPrimary: token('primary-foreground'), card: token('card'), accent: token('accent'), green: token('soft-green'), blush: token('blush'), border: token('border') };
  return colors;
}
const ease = (n: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, n)), 3);
const SX = 174, SY = 290, SW = 732, SH = 1300;
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 24) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function text(ctx: CanvasRenderingContext2D, words: string, x: number, y: number, size = 36, color = palette().text, max = 650, align: CanvasTextAlign = 'left', serif = false) {
  ctx.fillStyle = color; ctx.textAlign = align;
  let fontSize = size;
  ctx.font = `500 ${fontSize}px ${serif ? '"Playfair Display", Georgia, serif' : '"Inter", sans-serif'}`;
  while (ctx.measureText(words).width > max && fontSize > 16) { fontSize--; ctx.font = `500 ${fontSize}px ${serif ? '"Playfair Display", Georgia, serif' : '"Inter", sans-serif'}`; }
  ctx.fillText(words, x, y);
}
function lines(ctx: CanvasRenderingContext2D, words: string[], y: number, size: number, color: string, max = 900) {
  const all: string[] = [];
  ctx.font = `500 ${size}px "Playfair Display", Georgia, serif`;
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
function button(ctx: CanvasRenderingContext2D, label: string, y: number, secondary = false) {
  const c = palette(); box(ctx, SX + 40, y, SW - 80, 90, secondary ? c.accent : c.primary, 24);
  text(ctx, label, 540, y + 58, 36, secondary ? c.text : c.onPrimary, SW - 120, 'center');
}
function header(ctx: CanvasRenderingContext2D, count: number, heading: string) {
  const c = palette();
  text(ctx, 'Nuacha', SX + 40, SY + 82, 58, c.primary, 430, 'left', true);
  text(ctx, 'A softer way to track spending.', SX + 40, SY + 133, 25, c.muted);
  box(ctx, SX + 40, SY + 169, SW - 80, 65, c.green, 20);
  text(ctx, count === 3 ? 'No free scans left today' : `${3 - count} of 3 free scans left`, 540, SY + 212, 28, c.text, 630, 'center');
  text(ctx, heading, SX + 40, SY + 307, 46, c.text, 652, 'left', true);
}
function receipt(ctx: CanvasRenderingContext2D, index: number, y: number, h = 680) {
  const c = palette(), data = DEMO_RECEIPTS[index] ?? DEMO_RECEIPTS[0];
  box(ctx, SX + 100, y, SW - 200, h, c.card, 6);
  text(ctx, data.merchant, 540, y + 74, 34, c.text, SW - 260, 'center');
  text(ctx, 'SAMPLE RECEIPT · T&T', 540, y + 120, 22, c.muted, 480, 'center');
  text(ctx, data.date, 540, y + 168, 25, c.muted, 400, 'center');
  const itemGap = Math.min(68, (h - 360) / Math.max(1, data.items.length));
  data.items.forEach(([item, amount], i) => {
    text(ctx, item, SX + 126, y + 222 + i * itemGap, 25, c.text, 300);
    text(ctx, amount, SX + SW - 126, y + 222 + i * itemGap, 25, c.text, 150, 'right');
  });
  text(ctx, 'TOTAL', SX + 126, y + h - 118, 30, c.text, 200);
  text(ctx, data.total, SX + SW - 126, y + h - 118, 30, c.text, 265, 'right');
  text(ctx, 'Thank you', 540, y + h - 58, 25, c.muted, 400, 'center');
}
function finger(ctx: CanvasRenderingContext2D, x: number, y: number, p: number) {
  const c = palette(); ctx.save(); ctx.translate(x, y); ctx.scale(1 - p * .1, 1 - p * .1);
  ctx.fillStyle = c.card; ctx.strokeStyle = c.primary; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-18, 70); ctx.lineTo(-18, 10); ctx.bezierCurveTo(-18, -26, 18, -26, 18, 10);
  ctx.lineTo(18, 56); ctx.bezierCurveTo(65, 48, 90, 72, 85, 122); ctx.lineTo(75, 170); ctx.lineTo(0, 170);
  ctx.lineTo(-40, 110); ctx.bezierCurveTo(-58, 84, -42, 64, -18, 88); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function tap(ctx: CanvasRenderingContext2D, x: number, y: number, local: number, seconds: number) {
  const at = seconds * .72, approach = ease((local - at + 1) / .85);
  if (local < at - 1 || local > at + .65) return;
  const c = palette();
  ctx.save(); ctx.strokeStyle = c.blush; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2); ctx.stroke();
  if (local > at) { ctx.globalAlpha = Math.max(0, 1 - (local - at) / .65); ctx.beginPath(); ctx.arc(x, y, 35 + (local - at) * 160, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore(); finger(ctx, x + (1 - approach) * 180, y + (1 - approach) * 220, local > at && local < at + .18 ? 1 : 0);
}
function field(ctx: CanvasRenderingContext2D, label: string, value: string, y: number, p = 1) {
  const c = palette(); text(ctx, label, SX + 40, y, 25, c.muted);
  box(ctx, SX + 40, y + 16, SW - 80, 76, c.card, 16);
  ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.strokeRect(SX + 41, y + 17, SW - 82, 74);
  text(ctx, value.slice(0, Math.floor(value.length * Math.max(0, Math.min(1, p)))), SX + 60, y + 66, 31, c.text, 610);
}
function screen(ctx: CanvasRenderingContext2D, step: ReelStep, local: number) {
  const c = palette(), data = DEMO_RECEIPTS[step.receipt] ?? DEMO_RECEIPTS[0];
  if (step.scene === 'home') {
    header(ctx, step.count, 'Begin your journey');
    text(ctx, 'Financial clarity, at your own pace.', SX + 40, SY + 368, 29, c.muted);
    receipt(ctx, step.receipt, SY + 423, 510);
    button(ctx, 'Snap Receipt', SY + 980); button(ctx, 'Upload Receipt', SY + 1095, true);
    tap(ctx, 540, SY + 1025, local, step.seconds);
  } else if (step.scene === 'camera') {
    header(ctx, step.count, 'Snap Receipt');
    box(ctx, SX + 30, SY + 350, SW - 60, 780, c.accent, 20);
    receipt(ctx, step.receipt, SY + 410, 640);
    ctx.strokeStyle = c.primary; ctx.lineWidth = 7;
    [[SX + 70, SY + 390, 1, 1], [SX + SW - 70, SY + 390, -1, 1], [SX + 70, SY + 1090, 1, -1], [SX + SW - 70, SY + 1090, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y + 65 * dy); ctx.lineTo(x, y); ctx.lineTo(x + 65 * dx, y); ctx.stroke(); });
    box(ctx, 490, SY + 1160, 100, 100, c.primary, 50); box(ctx, 508, SY + 1178, 64, 64, c.card, 32);
    tap(ctx, 540, SY + 1210, local, step.seconds);
    const since = local - step.seconds * .72;
    if (since > 0 && since < .23) { ctx.save(); ctx.globalAlpha = 1 - since / .23; ctx.fillStyle = c.card; ctx.fillRect(SX, SY, SW, SH); ctx.restore(); }
  } else if (step.scene === 'reading') {
    header(ctx, step.count, 'Processing your receipt…');
    receipt(ctx, step.receipt, SY + 370, 575);
    const progress = ease(local / (step.seconds - .3));
    ctx.save(); ctx.strokeStyle = c.primary; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(SX + 95, SY + 385 + progress * 550); ctx.lineTo(SX + SW - 95, SY + 385 + progress * 550); ctx.stroke(); ctx.restore();
    box(ctx, SX + 40, SY + 1000, SW - 80, 18, c.accent, 9); box(ctx, SX + 40, SY + 1000, Math.max(18, (SW - 80) * progress), 18, c.primary, 9);
    text(ctx, `${Math.round(progress * 100)}%`, 540, SY + 1060, 34, c.primary, 630, 'center');
    text(ctx, data.merchant.slice(0, Math.floor(data.merchant.length * progress)), 540, SY + 1130, 33, c.text, 630, 'center');
    if (progress > .65) text(ctx, data.total, 540, SY + 1210, 52, c.primary, 630, 'center');
  } else if (step.scene === 'review') {
    header(ctx, step.count, 'Add Expense');
    const values = [['Family', 'My household'], ['Item / description', data.merchant], ['Amount', data.total], ['Place', data.merchant], ['Date', data.date], ['Category', data.category]];
    values.forEach(([label, value], i) => field(ctx, label, value, SY + 365 + i * 126, (local - i * .16) * 3));
    button(ctx, 'Add Expense', SY + 1150); tap(ctx, 540, SY + 1195, local, step.seconds);
  } else {
    header(ctx, step.count, 'Expenses');
    box(ctx, SX + 40, SY + 370, SW - 80, 210, c.card, 20);
    text(ctx, data.merchant, SX + 65, SY + 440, 36, c.text, 585);
    text(ctx, data.category + ' · My household', SX + 65, SY + 495, 25, c.muted, 585);
    text(ctx, data.total, SX + 65, SY + 550, 38, c.primary, 585);
    box(ctx, SX + 40, SY + 650, SW - 80, 140, c.green, 24);
    text(ctx, 'That’s saved.', 540, SY + 707, 42, c.text, 610, 'center', true);
    text(ctx, 'Keep going at your own pace.', 540, SY + 758, 27, c.muted, 610, 'center');
  }
}
function phone(ctx: CanvasRenderingContext2D, step: ReelStep, local: number, animate: boolean) {
  const c = palette(); const zoom = animate ? 1 + .018 * Math.sin(Math.PI * local / step.seconds) : 1;
  ctx.save(); ctx.translate(540, 940); ctx.scale(zoom, zoom); ctx.translate(-540, -940);
  box(ctx, SX - 18, SY - 18, SW + 36, SH + 36, c.primary, 54);
  ctx.save(); ctx.beginPath(); ctx.roundRect(SX, SY, SW, SH, 38); ctx.clip(); box(ctx, SX, SY, SW, SH, c.bg, 38); screen(ctx, step, local); ctx.restore(); ctx.restore();
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
  box(ctx, 174, 170, 732, 16, c.accent, 8); box(ctx, 174, 170, Math.max(16, 732 * overall), 16, c.primary, 8);
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
