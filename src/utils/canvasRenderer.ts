import type { AlbumMeta, AlbumPage, PageTemplate, PhotoFrameState, PhotoFrameTemplate, TextAreaTemplate } from '../templates/templateTypes';
import { loadImage } from './image';
import { generateTocItems } from './pagination';
import { resolveFrame } from './frameState';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((item) => item + item).join('') : clean;
  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawGeneratedTemplateBackground(ctx: CanvasRenderingContext2D, template: PageTemplate) {
  const { pageWidth: w, pageHeight: h, background } = template;
  ctx.fillStyle = background.paper;
  ctx.fillRect(0, 0, w, h);

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, background.base);
  gradient.addColorStop(1, background.paper);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (background.pattern === 'minimal') {
    ctx.strokeStyle = hexToRgba(background.ink, 0.2);
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.002);
    ctx.strokeRect(w * 0.055, h * 0.045, w * 0.89, h * 0.91);
  } else {
    ctx.fillStyle = hexToRgba(background.accentSoft, 0.55);
    ctx.beginPath();
    ctx.ellipse(w * 0.18, h * 0.16, w * 0.22, h * 0.08, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(background.accent, 0.13);
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.9, w * 0.24, h * 0.1, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (background.pattern === 'travel') {
    ctx.strokeStyle = hexToRgba(background.accent, 0.25);
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.003);
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.86);
    ctx.bezierCurveTo(w * 0.28, h * 0.76, w * 0.45, h * 0.94, w * 0.7, h * 0.82);
    ctx.bezierCurveTo(w * 0.82, h * 0.76, w * 0.89, h * 0.65, w * 0.95, h * 0.58);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (background.pattern === 'kids') {
    for (let i = 0; i < 24; i += 1) {
      ctx.fillStyle = i % 2 ? hexToRgba(background.accent, 0.12) : hexToRgba(background.accentSoft, 0.38);
      ctx.beginPath();
      ctx.arc((w * ((i * 37) % 100)) / 100, (h * ((i * 23) % 100)) / 100, Math.max(5, Math.min(w, h) * 0.008), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (background.pattern === 'memory') {
    ctx.strokeStyle = hexToRgba(background.accent, 0.18);
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0012);
    for (let y = h * 0.18; y < h * 0.88; y += h * 0.06) {
      ctx.beginPath();
      ctx.moveTo(w * 0.08, y);
      ctx.lineTo(w * 0.92, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export async function drawTemplateBackground(ctx: CanvasRenderingContext2D, template: PageTemplate) {
  if (template.background.image) {
    const img = await loadImage(template.background.image);
    ctx.drawImage(img, 0, 0, template.pageWidth, template.pageHeight);
    return;
  }
  drawGeneratedTemplateBackground(ctx, template);
}

function drawGeneratedTemplateOverlay(ctx: CanvasRenderingContext2D, template: PageTemplate) {
  const { pageWidth: w, pageHeight: h, background } = template;
  ctx.save();
  ctx.fillStyle = hexToRgba(background.accent, background.pattern === 'minimal' ? 0.9 : 0.25);
  ctx.font = `${Math.round(Math.min(w, h) * 0.024)}px serif`;
  ctx.textAlign = 'right';
  if (background.pattern === 'travel') {
    ctx.strokeStyle = hexToRgba(background.accent, 0.45);
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.003);
    ctx.strokeRect(w * 0.76, h * 0.06, w * 0.12, w * 0.08);
    ctx.fillText('POSTCARD', w * 0.9, h * 0.05);
  } else if (background.pattern !== 'minimal') {
    ctx.fillText('✦', w * 0.92, h * 0.08);
    ctx.fillText('✦', w * 0.16, h * 0.93);
  }
  ctx.restore();
}

export async function drawTemplateOverlay(ctx: CanvasRenderingContext2D, template: PageTemplate) {
  if (typeof template.overlay === 'string') {
    const img = await loadImage(template.overlay);
    ctx.drawImage(img, 0, 0, template.pageWidth, template.pageHeight);
    return;
  }
  if (template.overlay === true) drawGeneratedTemplateOverlay(ctx, template);
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  positionX = 0.5,
  positionY = 0.5,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight;
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) * positionX;
  } else {
    sw = img.naturalWidth;
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) * positionY;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawPhotoWithFrameState(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: PhotoFrameTemplate,
  state?: PhotoFrameState,
) {
  const f = resolveFrame(frame, state);
  const cx = f.x + f.width / 2;
  const cy = f.y + f.height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((f.rotation || 0) * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.shadowColor = 'rgba(42, 34, 28, 0.2)';
  ctx.shadowBlur = Math.max(8, f.width * 0.025);
  ctx.shadowOffsetY = Math.max(4, f.height * 0.018);
  ctx.fillStyle = '#fff';
  roundedRect(ctx, f.x - 8, f.y - 8, f.width + 16, f.height + 16, (f.radius ?? 14) + 4);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  roundedRect(ctx, f.x, f.y, f.width, f.height, f.radius ?? 14);
  ctx.clip();

  drawImageCover(ctx, img, f.x, f.y, f.width, f.height, 0.5, 0.5);
  ctx.restore();
}

function resolveText(area: TextAreaTemplate, page: AlbumPage, meta: AlbumMeta, pages: AlbumPage[]) {
  if (area.type === 'title') {
    if (page.type === 'cover') return meta.title || '我的相册书';
    if (page.type === 'toc') return page.title || '目录';
    if (page.type === 'ending') return page.title || 'THE END';
    return page.title || `回忆 ${page.pageNumber}`;
  }
  if (area.type === 'subtitle') return meta.subtitle || meta.description || '';
  if (area.type === 'author') return meta.author ? `制作：${meta.author}` : '';
  if (area.type === 'date') return page.date || meta.date || '';
  if (area.type === 'notes') return page.notes || (page.type === 'ending' ? '感谢这些画面，陪我们记住每一个发光的瞬间。' : '');
  if (area.type === 'pageNumber') return String(page.pageNumber).padStart(2, '0');
  if (area.type === 'toc') return generateTocItems(pages).map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item.title}  ·  ${item.pageNumber}`).join('\n');
  return '';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  const paragraphs = text.split(/\n+/);
  for (const paragraph of paragraphs) {
    let line = '';
    for (const char of paragraph) {
      const next = line + char;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function resolveFontFamily(area: TextAreaTemplate) {
  if (!area.fontFamily || area.fontFamily === 'serif') return 'Georgia, "Noto Serif SC", serif';
  if (area.fontFamily === 'handwriting') return '"Comic Sans MS", "KaiTi", cursive';
  return `"${area.fontFamily}", "Noto Serif SC", serif`;
}

export function drawPageTexts(ctx: CanvasRenderingContext2D, page: AlbumPage, template: PageTemplate, meta: AlbumMeta, pages: AlbumPage[]) {
  for (const area of template.textAreas) {
    const content = resolveText(area, page, meta, pages);
    if (!content) continue;
    const family = resolveFontFamily(area);
    ctx.save();
    ctx.fillStyle = area.color || template.background.ink;
    ctx.font = `${area.fontWeight ?? 400} ${area.fontSize}px ${family}`;
    ctx.textAlign = area.align ?? 'left';
    ctx.textBaseline = 'top';
    const lineHeight = area.fontSize * (area.lineHeight ?? 1.35);
    const lines = wrapText(ctx, content, area.width);
    let x = area.x;
    if (area.align === 'center') x = area.x + area.width / 2;
    if (area.align === 'right') x = area.x + area.width;
    lines.slice(0, Math.floor(area.height / lineHeight) || 1).forEach((line, index) => {
      ctx.fillText(line, x, area.y + index * lineHeight);
    });
    ctx.restore();
  }
}

export async function renderPageToCanvas(page: AlbumPage, template: PageTemplate, meta: AlbumMeta, pages: AlbumPage[]) {
  const canvas = document.createElement('canvas');
  canvas.width = template.pageWidth;
  canvas.height = template.pageHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  await drawTemplateBackground(ctx, template);

  for (let i = 0; i < template.frames.length; i += 1) {
    const frame = template.frames[i];
    const photo = page.photos[i];
    if (!photo) continue;
    const img = await loadImage(photo.url);
    drawPhotoWithFrameState(ctx, img, frame, page.frameStates[frame.id]);
  }

  await drawTemplateOverlay(ctx, template);
  drawPageTexts(ctx, page, template, meta, pages);
  return canvas;
}
