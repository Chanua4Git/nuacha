import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Image, Play, RotateCcw, Save, Square } from 'lucide-react';
import { REEL_H, REEL_W, REEL_FPS, ReelSpec, REEL_DEFAULTS, UPCOMING_REELS, applyReelWords, reelWords, renderReel, reelTimeline, scheduleReelSounds } from '@/lib/tutorialReel';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function png(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create image')), 'image/png'));
}
export default function AdminReels() {
  const { isAdmin, isLoading } = useAdminRole();
  const [reels, setReels] = useState<ReelSpec[]>(REEL_DEFAULTS.map(spec => applyReelWords(spec, null)));
  const [selected, setSelected] = useState(REEL_DEFAULTS[0].slug);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stillTime, setStillTime] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const current = reels.find(spec => spec.slug === selected);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('tutorial_reels').select('slug,spec,status');
      await document.fonts.ready;
      if (!active) return;
      if (error) toast.error('Saved words could not be loaded. You can still preview the sample reels.');
      setReels(REEL_DEFAULTS.map(base => applyReelWords(base, data?.find(row => row.slug === base.slug)?.spec)));
      setStatuses(Object.fromEntries((data ?? []).map(row => [row.slug, row.status])));
      setReady(true);
    })();
    return () => { active = false; };
  }, [isAdmin]);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && current && ready && !busy) renderReel(ctx, stillTime, current);
  }, [current, ready, busy, stillTime]);
  useEffect(() => () => stopRef.current(), []);
  const update = (patch: Partial<ReelSpec>) => {
    if (current) {
      const timeline = reelTimeline(current);
      if (patch.hook) setStillTime(1);
      else if (patch.stamp !== undefined) setStillTime(timeline.resultStart + 1);
      else if (patch.cta) setStillTime(timeline.ctaStart + 1);
      else if (patch.steps) {
        const index = patch.steps.findIndex((step, i) => step.caption !== current.steps[i]?.caption);
        const scene = timeline.scenes[index];
        if (scene) setStillTime(scene.start + scene.step.seconds * .6);
      }
    }
    setReels(all => all.map(spec => spec.slug === selected ? { ...spec, ...patch } : spec));
  };

  async function save(status = statuses[selected] ?? 'draft') {
    if (!current) return;
    setBusy('Saving…');
    try {
      const { error } = await supabase.from('tutorial_reels').upsert({ slug: current.slug, sort_order: current.order, status, spec: reelWords(current) }, { onConflict: 'slug' });
      if (error) throw error;
      setStatuses(all => ({ ...all, [selected]: status })); toast.success('Your reel words are saved.');
    } catch { toast.error('Your words could not be saved. Please try again.'); }
    finally { setBusy(null); }
  }
  async function play(record: boolean) {
    const canvas = canvasRef.current, spec = current;
    if (!canvas || !spec || busy) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    setBusy(record ? 'Recording…' : 'Playing…'); setElapsed(0);
    let ac: AudioContext | undefined, recorder: MediaRecorder | undefined, stream: MediaStream | undefined;
    let frame = 0, finished = false;
    const chunks: Blob[] = [];
    const cleanup = () => { cancelAnimationFrame(frame); stream?.getTracks().forEach(track => track.stop()); void ac?.close(); setBusy(null); stopRef.current = () => {}; };
    try {
      await document.fonts.ready;
      ac = new AudioContext(); await ac.resume();
      const audio = ac, dest = audio.createMediaStreamDestination(), gain = audio.createGain();
      gain.gain.value = .8; gain.connect(audio.destination); gain.connect(dest);
      const { duration } = reelTimeline(spec);
      renderReel(ctx, 0, spec);
      if (record) {
        if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) throw new Error('This browser cannot record video. Try Chrome or Safari.');
        const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
        if (!mime) throw new Error('This browser cannot record video. Try Chrome or Safari.');
        stream = new MediaStream([...canvas.captureStream(REEL_FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onstop = () => { if (chunks.length) download(new Blob(chunks, { type: mime }), `${spec.slug}.${mime.includes('mp4') ? 'mp4' : 'webm'}`); cleanup(); };
        recorder.onerror = () => { toast.error('The recording stopped. Please try again.'); cleanup(); };
        recorder.start(1000);
      }
      const start = audio.currentTime + .08; scheduleReelSounds(audio, gain, start, spec);
      const finish = () => {
        if (finished) return; finished = true; cancelAnimationFrame(frame);
        if (recorder?.state === 'recording') recorder.stop(); else cleanup();
      };
      stopRef.current = finish;
      const tick = () => {
        const time = Math.max(0, audio.currentTime - start);
        renderReel(ctx, Math.min(time, duration), spec); setElapsed(Math.min(time, duration));
        if (time >= duration) finish(); else frame = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) { cleanup(); toast.error(error instanceof Error ? error.message : 'The preview could not start. Please try again.'); }
  }
  async function stills() {
    if (!current) return;
    setBusy('Creating PNGs…');
    try {
      const tl = reelTimeline(current), canvas = document.createElement('canvas');
      canvas.width = REEL_W; canvas.height = REEL_H; const ctx = canvas.getContext('2d'); if (!ctx) return;
      const moments = [{ name: 'hook', time: 1 }, { name: 'key-step', time: (tl.scenes.find(s => s.step.scene === 'review')?.start ?? tl.stepsStart) + 2 }, { name: 'stamp', time: tl.resultStart + 1 }, { name: 'ending', time: tl.ctaStart + 1 }];
      const zip = new JSZip();
      for (const moment of moments) { renderReel(ctx, moment.time, current); zip.file(`${current.slug}-${moment.name}.png`, await png(canvas)); }
      download(await zip.generateAsync({ type: 'blob' }), `${current.slug}-pngs.zip`);
    } catch { toast.error('The PNGs could not be created. Please try again.'); }
    finally { setBusy(null); }
  }
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <main className="min-h-screen bg-background p-4 md:p-8">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6"><h1 className="font-heading text-3xl">Tutorial Reel Studio</h1><Badge variant="secondary">Sample scenes</Badge></div>
      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
        <nav aria-label="Tutorial reels" className="space-y-2 min-w-0">
          {reels.map(spec => <Button key={spec.slug} variant={selected === spec.slug ? 'secondary' : 'outline'} className="w-full h-auto min-h-16 whitespace-normal text-left justify-start" disabled={!!busy || !ready} onClick={() => { setSelected(spec.slug); setStillTime(1); }}>{spec.order}. {spec.title}</Button>)}
          <h2 className="text-sm font-medium pt-6">Later in the series</h2>
          {UPCOMING_REELS.map(title => <div key={title} className="py-2 border-b border-border text-sm text-muted-foreground">{title}<Badge variant="outline" className="ml-2 text-xs">Upcoming</Badge></div>)}
        </nav>
        {current && <section aria-label="Reel words" className="space-y-4 min-w-0">
          <h2 className="font-heading text-2xl">{current.title}</h2>
          <fieldset disabled={!!busy || !ready} className="space-y-4">
            <label className="block text-sm font-medium">Opening line<Textarea rows={2} value={current.hook.join('\n')} onChange={e => update({ hook: e.target.value.split('\n') })} /></label>
            {current.steps.map((step, i) => <label key={i} className="block text-sm font-medium">Step {i + 1} caption<Input value={step.caption} maxLength={240} onChange={e => update({ steps: current.steps.map((s, j) => i === j ? { ...s, caption: e.target.value } : s) })} /></label>)}
            <label className="block text-sm font-medium">Stamp words<Input value={current.stamp} maxLength={120} onChange={e => update({ stamp: e.target.value })} /></label>
            <label className="block text-sm font-medium">Ending line<Textarea rows={2} value={current.cta.join('\n')} onChange={e => update({ cta: e.target.value.split('\n') })} /></label>
            {(['instagram', 'whatsapp', 'tiktok'] as const).map(channel => { const key = `caption_${channel}` as const; return <label key={channel} className="block text-sm font-medium">{channel === 'instagram' ? 'Instagram' : channel === 'whatsapp' ? 'WhatsApp Status' : 'TikTok'} caption<Textarea rows={3} value={current[key]} onChange={e => update({ [key]: e.target.value })} /></label>; })}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => save()}><Save className="w-4 h-4 mr-2" />Save words</Button>
              <Button variant="outline" onClick={() => save(statuses[selected] === 'ready' ? 'draft' : 'ready')}>{statuses[selected] === 'ready' ? 'Back to draft' : 'Mark ready'}</Button>
              <Button variant="ghost" onClick={() => { const base = REEL_DEFAULTS.find(s => s.slug === selected); if (base) setReels(all => all.map(s => s.slug === selected ? applyReelWords(base, null) : s)); }}><RotateCcw className="w-4 h-4 mr-2" />Reset words</Button>
            </div>
          </fieldset>
        </section>}
        <section aria-label="Reel preview" className="space-y-3 min-w-0 lg:sticky lg:top-6 self-start">
          <canvas aria-label="Animated tutorial reel" ref={canvasRef} width={REEL_W} height={REEL_H} className="w-full aspect-[9/16] rounded-lg border border-border" />
          <div className="text-sm text-muted-foreground flex justify-between"><span>1080 × 1920</span><span>{busy === 'Playing…' || busy === 'Recording…' ? `${Math.floor(elapsed)} / ` : ''}{current ? Math.ceil(reelTimeline(current).duration) : 0}s</span></div>
          {(busy === 'Playing…' || busy === 'Recording…') ? <Button variant="outline" className="w-full" onClick={() => stopRef.current()}><Square className="w-4 h-4 mr-2" />{busy} Stop</Button> : <div className="grid gap-2">
            <Button disabled={!!busy || !ready} onClick={() => play(false)}><Play className="w-4 h-4 mr-2" />Preview with sound</Button>
            <Button disabled={!!busy || !ready} variant="outline" onClick={() => play(true)}><Download className="w-4 h-4 mr-2" />Download video</Button>
            <Button disabled={!!busy || !ready} variant="outline" onClick={stills}><Image className="w-4 h-4 mr-2" />Download PNGs</Button>
          </div>}
        </section>
      </div>
    </div>
  </main>;
}
