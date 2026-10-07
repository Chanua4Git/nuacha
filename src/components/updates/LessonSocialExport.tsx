import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Film, Image } from 'lucide-react';
import type { LearningModule } from '@/constants/learningCenterData';
import { trackEvent } from '@/lib/analytics';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const ctx = c.getContext('2d');
  if (!ctx) return null;
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

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_FPS = 30;
const INTRO_SECONDS = 2.6;
const STEP_SECONDS = 3.4;
const OUTRO_SECONDS = 2.4;

const ease = (value: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3);

function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  module: LearningModule,
  elapsed: number,
) {
  const w = VIDEO_WIDTH;
  const h = VIDEO_HEIGHT;
  const total = INTRO_SECONDS + module.steps.length * STEP_SECONDS + OUTRO_SECONDS;
  const fadeIn = ease(Math.min(1, elapsed / 0.45));
  const fadeOut = ease(Math.min(1, (total - elapsed) / 0.45));
  const opacity = Math.min(fadeIn, fadeOut);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const drift = Math.sin(elapsed * 0.7) * 24;
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(w - 50 + drift, 115, 310, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(25 - drift, h - 40, 350, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = opacity;
  ctx.textAlign = 'left';
  ctx.fillStyle = PRIMARY;
  ctx.font = '600 48px "Playfair Display", serif';
  ctx.fillText('Nuacha', 82, 118);
  ctx.fillStyle = SOFT;
  ctx.font = '400 30px Inter, sans-serif';
  ctx.fillText(`${module.track} · ${module.estimatedTime || 'Quick lesson'}`, 82, 170);

  if (elapsed < INTRO_SECONDS) {
    const local = elapsed / INTRO_SECONDS;
    const rise = (1 - ease(Math.min(1, local * 1.8))) * 55;
    ctx.fillStyle = TEXT;
    ctx.font = '600 88px "Playfair Display", serif';
    const titleLines = wrap(ctx, module.title, w - 164);
    let y = 690 + rise - (titleLines.length - 1) * 54;
    titleLines.forEach((line) => {
      ctx.fillText(line, 82, y);
      y += 108;
    });
    ctx.fillStyle = SOFT;
    ctx.font = '400 38px Inter, sans-serif';
    const descriptionLines = wrap(ctx, module.description, w - 164).slice(0, 4);
    y += 42;
    descriptionLines.forEach((line) => {
      ctx.fillText(line, 82, y);
      y += 54;
    });
  } else if (elapsed < total - OUTRO_SECONDS) {
    const stepTime = elapsed - INTRO_SECONDS;
    const index = Math.min(module.steps.length - 1, Math.floor(stepTime / STEP_SECONDS));
    const step = module.steps[index];
    const local = (stepTime % STEP_SECONDS) / STEP_SECONDS;
    const rise = (1 - ease(Math.min(1, local * 2.2))) * 44;

    ctx.fillStyle = PRIMARY;
    ctx.beginPath();
    ctx.arc(116, 585 + rise, 43, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BG;
    ctx.font = '600 38px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1), 116, 599 + rise);
    ctx.textAlign = 'left';

    ctx.fillStyle = TEXT;
    ctx.font = '600 78px "Playfair Display", serif';
    const titleLines = wrap(ctx, step.title, w - 164);
    let y = 720 + rise;
    titleLines.forEach((line) => {
      ctx.fillText(line, 82, y);
      y += 94;
    });

    ctx.fillStyle = SOFT;
    ctx.font = '400 40px Inter, sans-serif';
    const descriptionLines = wrap(ctx, step.description, w - 164).slice(0, 5);
    y += 48;
    descriptionLines.forEach((line) => {
      ctx.fillText(line, 82, y);
      y += 58;
    });

    const progressWidth = w - 164;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(82, 1560, progressWidth, 10);
    ctx.fillStyle = PRIMARY;
    ctx.fillRect(82, 1560, progressWidth * ((index + local) / module.steps.length), 10);
    ctx.fillStyle = SOFT;
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillText(`Step ${index + 1} of ${module.steps.length}`, 82, 1625);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = TEXT;
    ctx.font = '600 86px "Playfair Display", serif';
    ctx.fillText('Ready when you are.', w / 2, 790);
    ctx.fillStyle = SOFT;
    ctx.font = '400 42px Inter, sans-serif';
    ctx.fillText('Try the lesson for yourself.', w / 2, 875);
    ctx.fillStyle = PRIMARY;
    ctx.beginPath();
    ctx.roundRect(82, 1110, w - 164, 132, 66);
    ctx.fill();
    ctx.fillStyle = BG;
    ctx.font = '600 40px Inter, sans-serif';
    ctx.fillText('Try it free at nuacha.com', w / 2, 1192);
    ctx.textAlign = 'left';
  }

  ctx.globalAlpha = 1;
}

async function renderVideo(module: LearningModule): Promise<{ blob: Blob; extension: string } | null> {
  if (typeof MediaRecorder === 'undefined') return null;
  await Promise.all([
    document.fonts.load('600 88px "Playfair Display"'),
    document.fonts.load('400 42px Inter'),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) return null;

  const supportedTypes = ['video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const mimeType = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) return null;

  const stream = canvas.captureStream(VIDEO_FPS);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const completed = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error('The video could not be recorded.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const totalSeconds = INTRO_SECONDS + module.steps.length * STEP_SECONDS + OUTRO_SECONDS;
  const startedAt = performance.now();
  recorder.start(250);

  await new Promise<void>((resolve) => {
    const paint = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      drawVideoFrame(ctx, module, Math.min(elapsed, totalSeconds));
      if (elapsed < totalSeconds) requestAnimationFrame(paint);
      else resolve();
    };
    requestAnimationFrame(paint);
  });

  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  const blob = await completed;
  return { blob, extension: mimeType.includes('mp4') ? 'mp4' : 'webm' };
}

/** Download a branded, social-sized image of a lesson. Generic lesson content only — no personal data. */
export function LessonSocialExport({ module }: { module: LearningModule }) {
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const download = async (s: typeof SIZES[number]) => {
    const blob = await render(module, s.w, s.h);
    if (!blob) return;
    downloadBlob(blob, `nuacha-${module.id}-${s.key}.png`);
    trackEvent('lesson_social_download', { module_id: module.id, size: s.key });
  };

  const downloadVideo = async () => {
    setIsCreatingVideo(true);
    try {
      const result = await renderVideo(module);
      if (!result) {
        toast.error('Video creation is not available in this browser. You can still download an image.');
        return;
      }
      downloadBlob(result.blob, `nuacha-${module.id}-story-video.${result.extension}`);
      trackEvent('lesson_social_video_download', { module_id: module.id, format: result.extension });
      toast.success('Your lesson video is ready to share.');
    } catch (error) {
      console.error('Lesson video creation failed:', error);
      toast.error('The video could not be created. Please try again.');
    } finally {
      setIsCreatingVideo(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={isCreatingVideo}>
          {isCreatingVideo ? <Film className="w-4 h-4 animate-pulse" /> : <Download className="w-4 h-4" />}
          {isCreatingVideo ? 'Creating video…' : 'For socials'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={downloadVideo} className="gap-2">
          <Film className="h-4 w-4" /> Story video (1080×1920)
        </DropdownMenuItem>
        {SIZES.map((s) => (
          <DropdownMenuItem key={s.key} onClick={() => download(s)} className="gap-2">
            <Image className="h-4 w-4" /> {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
