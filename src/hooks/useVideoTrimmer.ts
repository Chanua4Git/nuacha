import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from 'sonner';

export function useVideoTrimmer() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);

  async function loadFFmpeg() {
    if (ffmpeg) return ffmpeg;

    const ffmpegInstance = new FFmpeg();
    
    ffmpegInstance.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpegInstance.on('progress', ({ progress: p }) => {
      setProgress(Math.round(p * 100));
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpegInstance.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setFFmpeg(ffmpegInstance);
      return ffmpegInstance;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Failed to load video processor');
      throw error;
    }
  }

  async function trimVideo(
    inputBlob: Blob,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    setIsLoading(true);
    setProgress(0);

    try {
      const ffmpegInstance = await loadFFmpeg();

      // Write input file to FFmpeg virtual filesystem
      await ffmpegInstance.writeFile('input.webm', await fetchFile(inputBlob));

      // Calculate duration
      const duration = endTime - startTime;

      // Run FFmpeg trim command
      await ffmpegInstance.exec([
        '-i', 'input.webm',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy', // Copy codec for fast processing
        'output.webm'
      ]);

      // Read output file
      const data = await ffmpegInstance.readFile('output.webm');
      
      // Clean up
      await ffmpegInstance.deleteFile('input.webm');
      await ffmpegInstance.deleteFile('output.webm');

      // Convert FileData to Blob
      // Create a new Uint8Array to ensure compatible buffer type
      const outputBlob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/webm' });
      
      toast.success('Video trimmed successfully');
      return outputBlob;
    } catch (error) {
      console.error('Error trimming video:', error);
      toast.error('Failed to trim video');
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }

  return {
    trimVideo,
    isLoading,
    progress,
  };
}
