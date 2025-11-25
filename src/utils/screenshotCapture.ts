import html2canvas from 'html2canvas';

/**
 * Capture the current page/document body as a PNG blob
 */
export const captureCurrentPage = async (): Promise<Blob | null> => {
  try {
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: false,
      scale: 2, // Higher quality
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  } catch (error) {
    console.error('Error capturing page:', error);
    return null;
  }
};

/**
 * Capture a specific DOM element by selector as a PNG blob
 */
export const captureElement = async (selector: string): Promise<Blob | null> => {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`Element not found: ${selector}`);
      return null;
    }
    
    const canvas = await html2canvas(element as HTMLElement, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  } catch (error) {
    console.error('Error capturing element:', error);
    return null;
  }
};

/**
 * Capture an iframe's content as a PNG blob
 */
export const captureIframe = async (iframeElement: HTMLIFrameElement): Promise<Blob | null> => {
  try {
    const iframeDocument = iframeElement.contentDocument || iframeElement.contentWindow?.document;
    
    if (!iframeDocument) {
      console.error('Cannot access iframe document');
      return null;
    }
    
    const canvas = await html2canvas(iframeDocument.body, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  } catch (error) {
    console.error('Error capturing iframe:', error);
    return null;
  }
};
