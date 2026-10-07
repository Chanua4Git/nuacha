import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import type { LearningModule } from '@/constants/learningCenterData';
import { trackEvent } from '@/lib/analytics';

const SIZES = [
  { key: 'story', label: 'Story / TikTok (1080×1920)', w: 1080, h: 1920 },
  { key: 'feed', label: 'Instagram feed (1080×1350)', w: 1080, h: 1350 },
  { key: 'square', label: 'Square (1080×1080)', w: 1080, h: 1080 },
];

// Canvas needs literal colours; these mirror the brand palette.
const BG = '#FAF9F7', PRIMARY = '#5A7684', ACCENT = '#F4E8D3', GREEN = '#C3DCD1', TEXT = '#2F2F2F', SOFT = '#5C5C5C';

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
  const words = text.split(' '); const lines: string[] = []; let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
};

async function render(module: LearningModule, w: number, h: number) {
  await Promise.all([
    document.fonts.load('600 64px "Playfair Display"'),
    document.fonts.load('400 32px Inter'),
  ]).catch(() => {});
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(w - 80, 120, 260, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(60, h - 80, 300, 0, Math.PI * 2); ctx.fill();

  const pad = 90, maxW = w - pad * 2;
  const scale = h >= 1900 ? 1 : h >= 1300 ? 0.85 : 0.72;
  ctx.fillStyle = PRIMARY; ctx.font = `600 ${44 * scale}px "Playfair Display", serif`;
  ctx.fillText('Nuacha', pad, pad + 40);
  ctx.fillStyle = SOFT; ctx.font = `400 ${28 * scale}px Inter, sans-serif`;
  ctx.fillText(`${module.track} · ${module.estimatedTime || ''}`.replace(/ · $/, ''), pad, pad + 40 + 50 * scale);

  // Measure the title + steps block so it sits in the middle of the free space.
  const top = pad + 40 + 110 * scale, bottom = h - pad - 160 * scale;
  ctx.font = `600 ${76 * scale}px "Playfair Display", serif`;
  const titleLines = wrap(ctx, module.title, maxW);
  ctx.font = `500 ${38 * scale}px Inter, sans-serif`;
  const stepLines = module.steps.slice(0, 5).map((st) => wrap(ctx, st.title, maxW - 90 * scale));
  const blockH = titleLines.length * 90 * scale + 60 * scale + stepLines.reduce((a, l) => a + l.length * 48 * scale + 50 * scale, 0);
  let y = Math.max(top + 70 * scale, top + (bottom - top - blockH) / 2 + 70 * scale);

  ctx.fillStyle = TEXT; ctx.font = `600 ${76 * scale}px "Playfair Display", serif`;
  for (const l of titleLines) { ctx.fillText(l, pad, y); y += 90 * scale; }
  y += 30 * scale;

  const steps = module.steps.slice(0, 5);
  steps.forEach((s, i) => {
    ctx.fillStyle = PRIMARY; ctx.beginPath(); ctx.arc(pad + 30 * scale, y - 12 * scale, 30 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BG; ctx.font = `600 ${30 * scale}px Inter, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), pad + 30 * scale, y - 1 * scale); ctx.textAlign = 'left';
    ctx.fillStyle = TEXT; ctx.font = `500 ${38 * scale}px Inter, sans-serif`;
    const lines = wrap(ctx, s.title, maxW - 90 * scale);
    lines.forEach((l, j) => ctx.fillText(l, pad + 85 * scale, y + j * 48 * scale));
    y += Math.max(1, lines.length) * 48 * scale + 50 * scale;
  });

  ctx.fillStyle = PRIMARY;
  const by = h - pad - 110 * scale;
  ctx.beginPath(); (ctx as any).roundRect?.(pad, by, maxW, 110 * scale, 55 * scale); ctx.fill();
  ctx.fillStyle = BG; ctx.font = `600 ${38 * scale}px Inter, sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('Try it free at nuacha.com', w / 2, by + 68 * scale); ctx.textAlign = 'left';

  return new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
}

/** Download a branded, social-sized image of a lesson. Generic lesson content only — no personal data. */
export function LessonSocialExport({ module }: { module: LearningModule }) {
  const download = async (s: typeof SIZES[number]) => {
    const blob = await render(module, s.w, s.h);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nuacha-${module.id}-${s.key}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    trackEvent('lesson_social_download', { module_id: module.id, size: s.key });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2"><Download className="w-4 h-4" />For socials</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {SIZES.map((s) => <DropdownMenuItem key={s.key} onClick={() => download(s)}>{s.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
