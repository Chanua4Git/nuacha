import { useState, useRef, useCallback } from 'react';
import GIF from 'gif.js';

export function useGifRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const gifRef = useRef<GIF | null>(null);
  const framesRef = useRef<ImageData[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  const startRecording = useCallback(async (canvasElement: HTMLCanvasElement) => {
    try {
      setError(null);
      
      // Store canvas dimensions
      canvasDimensionsRef.current = {
        width: canvasElement.width,
        height: canvasElement.height
      };
      
      // Clear previous frames
      framesRef.current = [];
      
      // Initialize GIF encoder
      gifRef.current = new GIF({
        workers: 2,
        quality: 10,
        width: canvasElement.width,
        height: canvasElement.height,
        workerScript: '/gif.worker.js'
      });
      
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      throw err;
    }
  }, []);

  const addFrame = useCallback((canvas: HTMLCanvasElement) => {
    if (!isRecording || isPaused) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx && canvasDimensionsRef.current) {
      const imageData = ctx.getImageData(
        0, 
        0, 
        canvasDimensionsRef.current.width, 
        canvasDimensionsRef.current.height
      );
      framesRef.current.push(imageData);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!gifRef.current || framesRef.current.length === 0) {
        console.warn('No frames captured for GIF');
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        resolve(null);
        return;
      }
      
      console.log(`Encoding ${framesRef.current.length} frames into GIF...`);
      
      // Create a temporary canvas for adding frames
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx || !canvasDimensionsRef.current) {
        resolve(null);
        return;
      }
      
      // Add all collected frames to the GIF encoder
      framesRef.current.forEach((imageData, index) => {
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        gifRef.current!.addFrame(tempCanvas, { delay: 100, copy: true }); // 100ms = 10fps
      });
      
      // Listen for completion
      gifRef.current.on('finished', (blob: Blob) => {
        console.log('GIF encoding complete!', blob);
        
        // Cleanup
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        resolve(blob);
      });
      
      gifRef.current.on('progress', (progress: number) => {
        console.log(`GIF encoding progress: ${Math.round(progress * 100)}%`);
      });
      
      // Start rendering the GIF
      gifRef.current.render();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (isRecording) {
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const resumeRecording = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  }, [isPaused]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    addFrame,
    pauseRecording,
    resumeRecording,
    formatDuration
  };
}
