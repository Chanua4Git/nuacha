import { format, parseISO } from 'date-fns';
import { getSignedReceiptUrl } from '@/utils/receipt/signedUrls';

export type StoryKind = 'receipt-card' | 'receipt-blur' | 'monthly' | 'family' | 'annual';

export interface StoryMetric {
  value: string;
  label: string;
}

export interface StoryImageData {
  kind: StoryKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  category?: string;
  receiptPath?: string;
  metrics?: StoryMetric[];
  highlights?: string[];
}

const WIDTH = 1080;
const HEIGHT = 1920;

const token = (name: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return `hsl(${value})`;
};

const tokenAlpha = (name: string, alpha: number) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return `hsl(${value} / ${alpha})`;
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((textLine, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    context.fillText(isLastVisibleLine ? `${textLine}…` : textLine, x, y + index * lineHeight);
  });

  return Math.min(lines.length, maxLines) * lineHeight;
};

const loadPrivateReceipt = async (path: string) => {
  const signedUrl = await getSignedReceiptUrl(path);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error('The receipt image could not be opened.');
  const objectUrl = URL.createObjectURL(await response.blob());

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    // The image is decoded before the object URL is released.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
};

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
};

const drawBotanicalMarks = (context: CanvasRenderingContext2D) => {
  context.save();
  context.strokeStyle = tokenAlpha('--primary', 0.28);
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(72, 1570);
  context.bezierCurveTo(160, 1380, 310, 1325, 390, 1120);
  context.stroke();

  context.fillStyle = tokenAlpha('--soft-green', 0.72);
  [[105, 1470, -0.65], [175, 1375, 0.55], [240, 1280, -0.5], [310, 1190, 0.48]].forEach(([x, y, rotation]) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.beginPath();
    context.ellipse(0, 0, 42, 94, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
  context.restore();
};

export const createStoryImage = async (data: StoryImageData): Promise<Blob> => {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Story image rendering is unavailable.');

  context.fillStyle = token('--background');
  context.fillRect(0, 0, WIDTH, HEIGHT);

  if (data.kind === 'receipt-blur' && data.receiptPath) {
    const image = await loadPrivateReceipt(data.receiptPath);
    context.save();
    context.filter = 'blur(36px)';
    context.globalAlpha = 0.34;
    drawCoverImage(context, image, -60, -60, WIDTH + 120, HEIGHT + 120);
    context.restore();
    context.fillStyle = tokenAlpha('--background', 0.72);
    context.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    drawBotanicalMarks(context);
    context.fillStyle = tokenAlpha('--blush', 0.54);
    context.beginPath();
    context.arc(1010, 445, 340, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = tokenAlpha('--accent', 0.7);
    context.beginPath();
    context.arc(970, 1640, 260, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = token('--primary');
  context.font = '500 96px "Playfair Display", Georgia, serif';
  context.fillText('Nuacha', 84, 150);
  context.font = '500 28px "Work Sans", Arial, sans-serif';
  context.fillText('A softer way to track spending.', 88, 205);

  context.fillStyle = token('--foreground');
  context.font = '600 25px "Work Sans", Arial, sans-serif';
  context.fillText(data.eyebrow.toUpperCase(), 88, 385);

  context.font = '500 88px "Playfair Display", Georgia, serif';
  const titleHeight = drawWrappedText(context, data.title, 88, 505, 900, 102, 3);

  context.fillStyle = token('--muted-foreground');
  context.font = '400 34px "Work Sans", Arial, sans-serif';
  const subtitleY = 530 + titleHeight;
  drawWrappedText(context, data.subtitle, 88, subtitleY, 850, 50, 3);

  if (data.category) {
    context.fillStyle = token('--accent');
    roundedRect(context, 88, subtitleY + 150, 420, 76, 38);
    context.fill();
    context.fillStyle = token('--accent-foreground');
    context.font = '600 28px "Work Sans", Arial, sans-serif';
    context.fillText(data.category, 122, subtitleY + 199);
  }

  if (data.metrics?.length) {
    const top = Math.max(930, subtitleY + 190);
    const gap = 26;
    const cardWidth = (904 - gap) / 2;
    data.metrics.slice(0, 4).forEach((metric, index) => {
      const x = 88 + (index % 2) * (cardWidth + gap);
      const y = top + Math.floor(index / 2) * 210;
      context.fillStyle = tokenAlpha('--card', 0.92);
      roundedRect(context, x, y, cardWidth, 178, 26);
      context.fill();
      context.strokeStyle = token('--border');
      context.lineWidth = 3;
      context.stroke();
      context.fillStyle = token('--primary');
      context.font = '600 58px "Playfair Display", Georgia, serif';
      context.fillText(metric.value, x + 32, y + 76);
      context.fillStyle = token('--muted-foreground');
      context.font = '500 25px "Work Sans", Arial, sans-serif';
      drawWrappedText(context, metric.label, x + 32, y + 124, cardWidth - 64, 32, 2);
    });
  }

  if (data.highlights?.length) {
    const startY = data.metrics?.length ? 1390 : Math.max(960, subtitleY + 230);
    context.fillStyle = token('--foreground');
    context.font = '500 28px "Work Sans", Arial, sans-serif';
    data.highlights.slice(0, 4).forEach((highlight, index) => {
      context.fillStyle = index % 2 === 0 ? token('--soft-green') : token('--blush');
      context.beginPath();
      context.arc(106, startY + index * 64 - 9, 10, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = token('--foreground');
      context.fillText(highlight, 138, startY + index * 64);
    });
  }

  context.fillStyle = token('--primary');
  roundedRect(context, 200, 1698, 680, 104, 52);
  context.fill();
  context.fillStyle = token('--primary-foreground');
  context.textAlign = 'center';
  context.font = '500 40px "Playfair Display", Georgia, serif';
  context.fillText('See what Nuacha can organize', 540, 1764);
  context.fillStyle = token('--primary');
  context.font = '600 27px "Work Sans", Arial, sans-serif';
  context.fillText('nuacha.com  •  Trinidad & Tobago', 540, 1856);
  context.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The story image could not be created.')), 'image/png', 1);
  });
};

export const storyFilename = (data: StoryImageData) => {
  const safeTitle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42);
  return `nuacha-${safeTitle || data.kind}-${format(new Date(), 'yyyyMMdd')}.png`;
};

export const receiptStorySubtitle = (date: string) => `Captured ${format(parseISO(date), 'MMMM d, yyyy')} • Details kept private`;