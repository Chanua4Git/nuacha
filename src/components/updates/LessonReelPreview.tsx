import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { REEL_W, REEL_H, reelsForLesson, renderReel, reelTimeline, scheduleReelSounds } from '@/lib/tutorialReel';

export function LessonReelPreview({ moduleId }: { moduleId: string }) {
  const reels = reelsForLesson(moduleId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stop = useRef<() => void>(() => {});
  const spec = reels[selected];
  useEffect(() => {
    if (!open || !spec) return;
    let active = true;
    void document.fonts.ready.then(() => {
      const ctx = canvas.current?.getContext('2d');
      if (active && ctx) renderReel(ctx, 1, spec);
    });
    return () => { active = false; stop.current(); };
  }, [open, spec]);
  async function play() {
    const ctx = canvas.current?.getContext('2d'); if (!ctx || !spec) return;
    stop.current();
    const audio = new AudioContext(); let frame = 0;
    stop.current = () => { cancelAnimationFrame(frame); void audio.close(); setPlaying(false); };
    try {
      await audio.resume(); setPlaying(true);
      const gain = audio.createGain(); gain.gain.value = .8; gain.connect(audio.destination);
      const start = audio.currentTime + .08;
      scheduleReelSounds(audio, gain, start, spec);
      const duration = reelTimeline(spec).duration;
      const paint = () => {
        const time = Math.max(0, audio.currentTime - start);
        renderReel(ctx, Math.min(time, duration), spec);
        if (time < duration) frame = requestAnimationFrame(paint); else stop.current();
      };
      paint();
    } catch { stop.current(); }
  }
  if (!spec) return null;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm" className="gap-2"><Play className="h-4 w-4" />Watch walkthrough</Button></DialogTrigger>
    <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{spec.title}</DialogTitle></DialogHeader>
      <div className="flex flex-wrap gap-2">{reels.map((reel, i) => <Button key={reel.slug} variant={selected === i ? 'secondary' : 'outline'} size="sm" className="h-auto whitespace-normal" onClick={() => { stop.current(); setSelected(i); }}>{reel.title}</Button>)}</div>
      <canvas ref={canvas} width={REEL_W} height={REEL_H} aria-label="Lesson walkthrough" className="mx-auto w-full max-w-[260px] aspect-[9/16] border border-border rounded-lg" />
      <Button onClick={playing ? () => stop.current() : play} className="gap-2">{playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? 'Stop' : 'Play with sound'}</Button>
    </DialogContent>
  </Dialog>;
}