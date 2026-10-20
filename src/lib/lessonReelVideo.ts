import { REEL_W, REEL_H, REEL_FPS, renderReel, reelTimeline, scheduleReelSounds, type ReelSpec } from './tutorialReel';

/** Shared public demo export. Never reads saved admin words or account data. */
export async function recordLessonReel(spec: ReelSpec): Promise<{ blob: Blob; extension: string }> {
  await document.fonts.ready;
  if (typeof MediaRecorder === 'undefined') throw new Error('Video recording is not available in this browser.');
  const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error('Video recording is not available in this browser.');
  const canvas = document.createElement('canvas'); canvas.width = REEL_W; canvas.height = REEL_H;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) throw new Error('Video recording is not available in this browser.');
  const audio = new AudioContext();
  let stream: MediaStream | undefined;
  let frame = 0;
  try {
    await audio.resume();
    const dest = audio.createMediaStreamDestination();
    const gain = audio.createGain(); gain.gain.value = .8; gain.connect(dest);
    stream = new MediaStream([...canvas.captureStream(REEL_FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      recorder.onerror = () => { cancelAnimationFrame(frame); reject(new Error('The recording stopped. Please try again.')); };
    });
    const duration = reelTimeline(spec).duration;
    renderReel(ctx, 0, spec); recorder.start(250);
    const start = audio.currentTime + .08; scheduleReelSounds(audio, gain, start, spec);
    const paint = () => {
      const time = Math.max(0, audio.currentTime - start);
      renderReel(ctx, Math.min(time, duration), spec);
      if (time < duration) frame = requestAnimationFrame(paint);
      else if (recorder.state === 'recording') recorder.stop();
    };
    paint();
    return { blob: await result, extension: mime.includes('mp4') ? 'mp4' : 'webm' };
  } finally {
    cancelAnimationFrame(frame); stream?.getTracks().forEach(track => track.stop()); await audio.close();
  }
}