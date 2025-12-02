import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export interface UseGifRecorderResult {
  isRecording: boolean;
  hasRecording: boolean;
  error: string | null;
  videoBlob: Blob | null;
  videoUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  uploadVideo: (file: File) => void;
  isMobile: boolean;
  supportsScreenCapture: boolean;
}

/**
 * useGifRecorder
 * 
 * Uses Screen Capture API + MediaRecorder to record actual screen pixels
 * (hover states, animations, cursor movements) as a WebM video.
 * On mobile devices where Screen Capture isn't supported, provides
 * an upload method for native screen recordings.
 */
export function useGifRecorder(): UseGifRecorderResult {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Device detection
  const isMobile = useMemo(() => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  const supportsScreenCapture = useMemo(() => {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getDisplayMedia' in navigator.mediaDevices;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [videoUrl]);

  const startRecording = useCallback(async () => {
    setError(null);

    // Prevent double start
    if (isRecording || mediaRecorderRef.current) {
      return;
    }

    // Check if screen capture is supported
    if (!supportsScreenCapture) {
      setError('Screen capture is not supported on this device. Please use the upload option.');
      return;
    }

    try {
      // Request screen/window/tab capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 10 }, // 10 FPS for GIF-friendly capture
        audio: false,
      });

      streamRef.current = stream;

      // Set up MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error', event);
        setError('Recording error. Please try again.');
      };

      recorder.onstop = () => {
        // Assemble chunks into a Blob
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);

        // Create preview URL
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        // Stop screen sharing tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        setIsRecording(false);
      };

      recorder.start(100); // Request data every 100ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      console.error('startRecording error', err);

      // User cancelling the picker is expected behavior
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Screen capture was cancelled. Please try again and select a window or tab.');
      } else {
        setError('Could not start screen capture. Please check browser permissions.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording, supportsScreenCapture]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // isRecording will be set to false in onstop
    }
  }, []);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoBlob(null);
    setVideoUrl(null);
    setIsRecording(false);
    setError(null);
  }, [videoUrl]);

  // Upload video file directly (for mobile users who record with native tools)
  const uploadVideo = useCallback((file: File) => {
    setError(null);
    
    // Validate it's a video file
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file.');
      return;
    }

    // Clear any previous recording
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const blob = new Blob([file], { type: file.type });
    setVideoBlob(blob);
    setVideoUrl(URL.createObjectURL(blob));
  }, [videoUrl]);

  return {
    isRecording,
    hasRecording: !!videoBlob,
    error,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    reset,
    uploadVideo,
    isMobile,
    supportsScreenCapture,
  };
}
