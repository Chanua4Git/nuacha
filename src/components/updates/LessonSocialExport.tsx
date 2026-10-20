import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Download, Film, Image, Play, Square, Eye } from 'lucide-react';
import type { LearningModule } from '@/constants/learningCenterData';
import { trackEvent } from '@/lib/analytics';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { reelsForLesson, type ReelSpec } from '@/lib/tutorialReelSpecs';
import { recordLessonReel } from '@/lib/lessonReelVideo';
import { renderReel, reelTimeline } from '@/lib/tutorialReel';

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
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('video-0');
  const [playing, setPlaying] = useState(false);
  const [file, setFile] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const lessonReels = reelsForLesson(module.id);
  const isVideo = choice.startsWith('video-');
  const reel: ReelSpec | undefined = lessonReels[Number(choice.split('-')[1])];
  const size = SIZES.find(s => s.key === choice);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setFile(null); setPlaying(false);
    cancelAnimationFrame(frame.current);
    void document.fonts.ready.then(async () => {
      if (!active) return;
      if (isVideo) {
        const ctx = canvas.current?.getContext('2d');
        if (ctx) { if (reel) renderReel(ctx, 1, reel); else drawVideoFrame(ctx, module, 1); }
      } else if (size) {
        const blob = await render(module, size.w, size.h);
        if (active && blob) setFile({ blob, url: URL.createObjectURL(blob), name: `nuacha-${module.id}-${size.key}.png` });
      }
    });
    return () => { active = false; cancelAnimationFrame(frame.current); };
  }, [open, choice, module]);
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  const play = () => {
    if (playing) { cancelAnimationFrame(frame.current); setPlaying(false); return; }
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const duration = reel ? reelTimeline(reel).duration : INTRO_SECONDS + module.steps.length * STEP_SECONDS + OUTRO_SECONDS;
    const start = performance.now(); setPlaying(true);
    const paint = (now: number) => {
      const elapsed = Math.min((now - start) / 1000, duration);
      if (reel) renderReel(ctx, elapsed, reel); else drawVideoFrame(ctx, module, elapsed);
      if (elapsed < duration) frame.current = requestAnimationFrame(paint); else setPlaying(false);
    };
    frame.current = requestAnimationFrame(paint);
  };
  const createVideo = async () => {
    cancelAnimationFrame(frame.current); setPlaying(false); setIsCreatingVideo(true);
    try {
      const result = reel ? await recordLessonReel(reel) : await renderVideo(module);
      if (!result) { toast.error('Video creation is not available in this browser.'); return; }
      setFile({ blob: result.blob, url: URL.createObjectURL(result.blob), name: `nuacha-${reel?.slug ?? module.id}-story-video.${result.extension}` });
    } catch { toast.error('The video could not be created. Please try again.'); }
    finally { setIsCreatingVideo(false); }
  };
  const download = async () => {
    if (!file) return;
    const shareFile = new File([file.blob], file.name, { type: file.blob.type });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [shareFile] })) {
      try { await navigator.share({ files: [shareFile], title: module.title }); return; }
      catch (error) { if ((error as DOMException).name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement('a'); a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    trackEvent(isVideo ? 'lesson_social_video_download' : 'lesson_social_download', { module_id: module.id, size: choice });
  };
  return <Dialog open={open} onOpenChange={value => { if (!isCreatingVideo) setOpen(value); }}>
    <DialogTrigger asChild><Button variant="ghost" size="sm" className="gap-2"><Eye className="h-4 w-4 shrink-0" />Preview for socials</Button></DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader className="pr-6"><DialogTitle className="leading-snug">Preview for socials</DialogTitle><DialogDescription>{module.title}</DialogDescription></DialogHeader>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-1">
          {(lessonReels.length ? lessonReels : [undefined]).map((item, i) => <Button key={item?.slug ?? 'video'} variant={choice === `video-${i}` ? 'secondary' : 'outline'} disabled={isCreatingVideo} onClick={() => setChoice(`video-${i}`)} className="h-auto min-h-12 justify-start gap-2 whitespace-normal text-left py-2"><Film className="h-4 w-4 shrink-0" /><span className="min-w-0">{item?.title ?? 'Story video'}<span className="block text-xs text-muted-foreground">1080 × 1920</span></span></Button>)}
          {SIZES.map(s => <Button key={s.key} variant={choice === s.key ? 'secondary' : 'outline'} disabled={isCreatingVideo} onClick={() => setChoice(s.key)} className="h-auto min-h-12 justify-start gap-2 whitespace-normal text-left py-2"><Image className="h-4 w-4 shrink-0" /><span>{s.key === 'story' ? 'Story image' : s.key === 'feed' ? 'Feed image' : 'Square image'}<span className="block text-xs text-muted-foreground">{s.w} × {s.h}</span></span></Button>)}
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex min-h-32 items-center justify-center bg-muted p-2 rounded-lg">
            {isVideo ? file ? <video src={file.url} controls playsInline className="max-h-[43dvh] max-w-full" aria-label="Social video preview" /> : <canvas ref={canvas} width={1080} height={1920} aria-label="Social video preview" className="max-h-[43dvh] max-w-full w-auto aspect-[9/16]" /> : file ? <img src={file.url} alt={`${module.title} social image preview`} className="max-h-[43dvh] max-w-full object-contain" /> : <p className="text-sm text-muted-foreground">Preparing preview…</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {isVideo && !file && <><Button variant="outline" onClick={play} disabled={isCreatingVideo} className="gap-2">{playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? 'Stop preview' : 'Play preview'}</Button><Button onClick={createVideo} disabled={isCreatingVideo} className="gap-2"><Film className="h-4 w-4" />{isCreatingVideo ? 'Preparing video…' : 'Prepare video'}</Button></>}
            {file && <Button onClick={download} className="gap-2"><Download className="h-4 w-4" />{isVideo ? 'Download video' : 'Download image'}</Button>}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
