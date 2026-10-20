import { useEffect, useRef, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Image as ImageIcon, Play, Plus, Trash2 } from "lucide-react";
import {
  REEL_H, REEL_W, REEL_FPS, ReelSpec, ReelStep, ReelAssets, SCAN_FIRST_RECEIPT,
  renderReel, reelTimeline, scheduleReelSounds,
} from "@/lib/tutorialReel";

interface ReelRow { id: string; slug: string; sort_order: number; status: string; spec: ReelSpec }
const db = supabase as any;
const BUCKET = "tutorial-reels";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

export default function AdminReels() {
  const { isAdmin, isLoading } = useAdminRole();
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [current, setCurrent] = useState<ReelRow | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<ReelAssets>({ steps: [] });
  const [busy, setBusy] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<() => void>(() => {});

  const load = useCallback(async () => {
    let { data } = await db.from("tutorial_reels").select("*").order("sort_order");
    if (data && data.length === 0) {
      await db.from("tutorial_reels").insert({ slug: SCAN_FIRST_RECEIPT.slug, sort_order: SCAN_FIRST_RECEIPT.order, spec: SCAN_FIRST_RECEIPT });
      ({ data } = await db.from("tutorial_reels").select("*").order("sort_order"));
    }
    setReels(data ?? []);
    setCurrent((c) => (data ?? []).find((r: ReelRow) => r.id === c?.id) ?? (data ?? [])[0] ?? null);
  }, []);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  // Sign screenshot paths and load images
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    (async () => {
      const paths = current.spec.steps.map((s) => s.screenshot).filter(Boolean) as string[];
      const missing = paths.filter((p) => !urls[p]);
      let map = urls;
      if (missing.length) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 3600);
        map = { ...urls }; data?.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
        if (!cancelled) setUrls(map);
      }
      const imgs = await Promise.all(current.spec.steps.map((s) => (s.screenshot && map[s.screenshot] ? loadImage(map[s.screenshot]).catch(() => null) : Promise.resolve(null))));
      if (!cancelled) setAssets({ steps: imgs });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, JSON.stringify(current?.spec.steps.map((s) => s.screenshot))]);

  // Draw a still frame when idle
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx || !current || busy) return;
    renderReel(ctx, reelTimeline(current.spec).stepsStart + 1.3, current.spec, assets);
  }, [current, assets, busy]);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const spec = current?.spec;
  const update = (patch: Partial<ReelSpec>) => current && setCurrent({ ...current, spec: { ...current.spec, ...patch } });
  const updateStep = (i: number, patch: Partial<ReelStep>) => spec && update({ steps: spec.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  async function save(status?: string) {
    if (!current) return;
    const { error } = await db.from("tutorial_reels").update({ spec: current.spec, status: status ?? current.status, sort_order: current.spec.order }).eq("id", current.id);
    if (error) return toast.error("Couldn't save", { description: error.message });
    toast.success("Reel saved"); load();
  }

  async function upload(i: number, file: File) {
    if (!current) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (ext === "heic" || ext === "heif") return toast.error("Please share iPhone photos as JPEG or PNG for now");
    const path = `${current.slug}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) return toast.error("Upload failed", { description: error.message });
    updateStep(i, { screenshot: path });
  }

  async function play(record: boolean) {
    if (!current || !canvasRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d")!;
    const { duration } = reelTimeline(current.spec);
    const ac = new AudioContext(); const dest = ac.createMediaStreamDestination();
    const out = ac.createGain(); out.connect(ac.destination); out.connect(dest);
    let recorder: MediaRecorder | null = null; const chunks: Blob[] = [];
    let mime = "video/webm";
    if (record) {
      const stream = new MediaStream([...canvas.captureStream(REEL_FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
      mime = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime }); const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = `${current.slug}.${mime.includes("mp4") ? "mp4" : "webm"}`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      };
      recorder.start();
    }
    setBusy(record ? "Recording…" : "Playing…");
    const t0 = ac.currentTime + 0.05; scheduleReelSounds(ac, out, t0, current.spec);
    let raf = 0; let stopped = false;
    const finish = () => { if (stopped) return; stopped = true; cancelAnimationFrame(raf); recorder?.state === "recording" && recorder.stop(); setTimeout(() => ac.close(), 300); setBusy(null); };
    stopRef.current = finish;
    const tick = () => { const t = ac.currentTime - t0; renderReel(ctx, Math.max(0, t), current.spec, assets); if (t >= duration) finish(); else raf = requestAnimationFrame(tick); };
    tick();
  }

  function stills() {
    if (!current) return;
    const tl = reelTimeline(current.spec);
    const times = [1.2, tl.stepsStart + 1.3, tl.resultStart + 1, tl.ctaStart + 1.5];
    const c = document.createElement("canvas"); c.width = REEL_W; c.height = REEL_H; const ctx = c.getContext("2d")!;
    times.forEach((t, k) => {
      renderReel(ctx, t, current.spec, assets);
      c.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${current.slug}-${k + 1}.png`; a.click(); });
    });
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-3xl mb-1">Tutorial Reel Studio</h1>
        <p className="text-muted-foreground mb-6">Short vertical lessons that walk a new person to three scans in a day. Use a demo account only — no real names, numbers or bank details.</p>

        <div className="grid lg:grid-cols-[220px_1fr_360px] gap-6">
          <div className="space-y-2">
            {reels.map((r) => (
              <button key={r.id} onClick={() => setCurrent(r)} className={`w-full text-left rounded-2xl border p-3 ${current?.id === r.id ? "border-primary bg-accent/40" : "border-border"}`}>
                <div className="text-sm font-medium">{r.spec.order}. {r.spec.hook.join(" ")}</div>
                <Badge variant={r.status === "ready" ? "default" : "secondary"} className="mt-1">{r.status}</Badge>
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">The rest of the series comes once this first reel looks right.</p>
          </div>

          {spec && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Hook (one line per row)
                <Textarea value={spec.hook.join("\n")} onChange={(e) => update({ hook: e.target.value.split("\n") })} rows={2} />
              </label>
              <div className="space-y-3">
                {spec.steps.map((s, i) => (
                  <div key={i} className="rounded-2xl border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Step {i + 1}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => { const st = [...spec.steps]; [st[i - 1], st[i]] = [st[i], st[i - 1]]; update({ steps: st }); }}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={i === spec.steps.length - 1} onClick={() => { const st = [...spec.steps]; [st[i + 1], st[i]] = [st[i], st[i + 1]]; update({ steps: st }); }}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => update({ steps: spec.steps.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Input value={s.caption} onChange={(e) => updateStep(i, { caption: e.target.value })} placeholder="Caption, e.g. Tap Scan" />
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload(i, e.target.files[0])} />
                    {s.screenshot && urls[s.screenshot] && (
                      <div className="relative w-40 cursor-crosshair" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); updateStep(i, { tap: { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } }); }}>
                        <img src={urls[s.screenshot]} alt={`Step ${i + 1}`} className="w-full rounded-lg border" />
                        {s.tap && <span className="absolute h-4 w-4 -ml-2 -mt-2 rounded-full bg-primary ring-4 ring-primary/30" style={{ left: `${s.tap.x * 100}%`, top: `${s.tap.y * 100}%` }} />}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {s.screenshot ? "Click the screenshot to place the tap." : "Upload a screenshot to place the tap."}
                      {s.tap && <Button size="sm" variant="ghost" onClick={() => updateStep(i, { tap: null })}>No tap</Button>}
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => update({ steps: [...spec.steps, { screenshot: null, tap: null, caption: "" }] })}><Plus className="h-4 w-4 mr-1" />Add step</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">Stamp<Input value={spec.stamp} onChange={(e) => update({ stamp: e.target.value })} /></label>
                <label className="text-sm font-medium">Next step (one line per row)<Textarea rows={2} value={spec.cta.join("\n")} onChange={(e) => update({ cta: e.target.value.split("\n") })} /></label>
                <label className="text-sm font-medium">Progress step<Input type="number" value={spec.progress.current} onChange={(e) => update({ progress: { ...spec.progress, current: Number(e.target.value) } })} /></label>
                <label className="text-sm font-medium">Of<Input type="number" value={spec.progress.total} onChange={(e) => update({ progress: { ...spec.progress, total: Number(e.target.value) } })} /></label>
              </div>
              <label className="block text-sm font-medium">Instagram caption<Textarea rows={4} value={spec.caption_instagram} onChange={(e) => update({ caption_instagram: e.target.value })} /></label>
              <label className="block text-sm font-medium">WhatsApp Status caption<Textarea rows={2} value={spec.caption_whatsapp} onChange={(e) => update({ caption_whatsapp: e.target.value })} /></label>
              <div className="flex gap-2">
                <Button onClick={() => save()}>Save</Button>
                <Button variant="outline" onClick={() => save(current!.status === "ready" ? "draft" : "ready")}>{current!.status === "ready" ? "Back to draft" : "Mark ready"}</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <canvas ref={canvasRef} width={REEL_W} height={REEL_H} className="w-full rounded-2xl border shadow-sm" />
            <div className="flex flex-wrap gap-2">
              {busy ? <Button variant="outline" onClick={() => stopRef.current()}>{busy} Stop</Button> : <>
                <Button onClick={() => play(false)}><Play className="h-4 w-4 mr-1" />Preview with sound</Button>
                <Button variant="outline" onClick={() => play(true)}><Download className="h-4 w-4 mr-1" />Download video</Button>
                <Button variant="outline" onClick={stills}><ImageIcon className="h-4 w-4 mr-1" />PNG stills</Button>
              </>}
            </div>
            <p className="text-xs text-muted-foreground">Recording plays in real time, so keep this tab open until it downloads.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
