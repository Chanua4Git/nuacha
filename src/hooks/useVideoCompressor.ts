import { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from 'sonner';

interface CompressionOptions {
  targetSizeMB?: number;
  quality?: 'light' | 'medium' | 'aggressive';
}

export function useVideoCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'analyzing' | 'compressing' | 'finalizing'>('analyzing');
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

  function determineCompressionLevel(fileSizeMB: number): 'light' | 'medium' | 'aggressive' {
    if (fileSizeMB < 15) return 'light';
    if (fileSizeMB < 30) return 'medium';
    return 'aggressive';
  }

  function getCompressionParams(level: 'light' | 'medium' | 'aggressive') {
    const params = {
      light: { crf: '28', videoBitrate: '500k', audioBitrate: '64k' },
      medium: { crf: '32', videoBitrate: '300k', audioBitrate: '48k' },
      aggressive: { crf: '38', videoBitrate: '150k', audioBitrate: '32k' }
    };
    return params[level];
  }

  async function compressVideo(
    inputBlob: Blob,
    options: CompressionOptions = {}
  ): Promise<Blob> {
    setIsCompressing(true);
    setProgress(0);
    setStage('analyzing');

    try {
      const ffmpegInstance = await loadFFmpeg();
      
      // Determine input format from MIME type
      const inputExt = inputBlob.type.includes('quicktime') ? 'mov'
        : inputBlob.type.includes('mp4') ? 'mp4'
        : inputBlob.type.includes('webm') ? 'webm'
        : 'mp4';

      const inputFileName = `input.${inputExt}`;

      // Write input file
      await ffmpegInstance.writeFile(inputFileName, await fetchFile(inputBlob));

      setStage('compressing');

      // Determine compression level
      const fileSizeMB = inputBlob.size / (1024 * 1024);
      const level = options.quality || determineCompressionLevel(fileSizeMB);
      const params = getCompressionParams(level);

      console.log(`Compressing ${fileSizeMB.toFixed(2)}MB file with ${level} compression`);

      // Run FFmpeg compression command with H.264/AAC (widely supported)
      await ffmpegInstance.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',     // H.264 codec (available in standard FFmpeg WASM)
        '-preset', 'fast',     // Balance speed vs compression
        '-crf', params.crf,
        '-b:v', params.videoBitrate,
        '-c:a', 'aac',         // AAC audio codec (available in standard FFmpeg WASM)
        '-b:a', params.audioBitrate,
        '-movflags', '+faststart', // Optimize for streaming
        'output.mp4'
      ]);

      setStage('finalizing');

      // Read output file
      const data = await ffmpegInstance.readFile('output.mp4');
      
      // Clean up
      await ffmpegInstance.deleteFile(inputFileName);
      await ffmpegInstance.deleteFile('output.mp4');

      // Convert to Blob
      const outputBlob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
      
      const outputSizeMB = outputBlob.size / (1024 * 1024);
      console.log(`Compression complete: ${fileSizeMB.toFixed(2)}MB → ${outputSizeMB.toFixed(2)}MB`);
      
      // Check if still too large
      if (outputSizeMB >= 5) {
        toast.warning(`Video still ${outputSizeMB.toFixed(1)}MB after compression. Consider trimming or using a shorter video.`);
      } else {
        toast.success(`Video compressed: ${fileSizeMB.toFixed(1)}MB → ${outputSizeMB.toFixed(1)}MB`);
      }

      return outputBlob;
    } catch (error) {
      console.error('Error compressing video:', error);
      toast.error('Failed to compress video. Please try a different file.');
      throw error;
    } finally {
      setIsCompressing(false);
      setProgress(0);
    }
  }

  function estimateCompressedSize(originalSizeMB: number): number {
    // Rough estimation based on compression levels
    if (originalSizeMB < 15) return originalSizeMB * 0.3;  // Light: ~70% reduction
    if (originalSizeMB < 30) return originalSizeMB * 0.2;  // Medium: ~80% reduction
    return originalSizeMB * 0.15;  // Aggressive: ~85% reduction
  }

  return {
    compressVideo,
    isCompressing,
    progress,
    stage,
    estimateCompressedSize,
  };
}
