import { useState, useRef, useCallback } from 'react';
import RecordRTC, { GifRecorder } from 'recordrtc';

export function useGifRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recorderRef = useRef<RecordRTC | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async (canvasElement: HTMLCanvasElement) => {
    try {
      setError(null);
      
      // Get canvas stream
      const stream = canvasElement.captureStream(10); // 10 fps
      
      // Initialize RecordRTC with GIF recorder
      recorderRef.current = new RecordRTC(stream, {
        type: 'gif',
        frameRate: 10,
        quality: 10,
        width: canvasElement.width,
        height: canvasElement.height,
        recorderType: GifRecorder
      });
      
      recorderRef.current.startRecording();
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

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!recorderRef.current) {
        resolve(null);
        return;
      }
      
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current?.getBlob();
        
        // Cleanup
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        resolve(blob || null);
      });
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.pauseRecording();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && isPaused) {
      recorderRef.current.resumeRecording();
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
    pauseRecording,
    resumeRecording,
    formatDuration
  };
}
