import { nanoid } from 'nanoid';
import type { UserPhoto } from '../templates/templateTypes';

export function mmToPx(mm: number, dpi = 150) {
  return Math.round((mm / 25.4) * dpi);
}

export function createLocalImageUrl(file: File) {
  return URL.createObjectURL(file);
}

export function getImageMeta(url: string): Promise<{ width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function createUserPhotos(files: FileList | File[]) {
  const source = Array.from(files).filter((file) => /image\/(jpeg|png|webp)/i.test(file.type));
  const photos: UserPhoto[] = [];
  for (const file of source) {
    const url = createLocalImageUrl(file);
    try {
      const meta = await getImageMeta(url);
      photos.push({
        id: nanoid(),
        file,
        url,
        name: file.name,
        ...meta,
      });
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  return photos;
}

export function safeFileName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'album-book';
}
