import { useCallback } from 'react';

/**
 * Opens a fresh file picker per click so camera/gallery modes never leak
 * between buttons and picking the same photo twice still fires.
 */
export function openReceiptPicker(mode: 'camera' | 'upload', onFile: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.heic,.heif';
  if (mode === 'camera') input.setAttribute('capture', 'environment');
  input.style.display = 'none';
  input.onchange = () => {
    const file = input.files?.[0];
    input.remove();
    if (file) onFile(file);
  };
  document.body.appendChild(input);
  input.click();
}

export function useReceiptPicker(onFile: (file: File) => void) {
  const openCamera = useCallback(() => openReceiptPicker('camera', onFile), [onFile]);
  const openUpload = useCallback(() => openReceiptPicker('upload', onFile), [onFile]);
  return { openCamera, openUpload };
}
