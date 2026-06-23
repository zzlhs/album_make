import type { AlbumSizePreset, PageTemplate, TemplateBackground, TemplatePackage } from './templateTypes';
import { mmToPx } from '../utils/image';

export type TemplateThemeOption = {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  source: 'built-in' | 'cdn';
};

export const albumSizePresets: AlbumSizePreset[] = [
  { id: 'a4-portrait', name: 'A4 竖版', width: 210, height: 297, unit: 'mm', ratioLabel: '210 × 297mm' },
  { id: 'a5-portrait', name: 'A5 竖版', width: 148, height: 210, unit: 'mm', ratioLabel: '148 × 210mm' },
  { id: 'square', name: '方形相册', width: 1600, height: 1600, unit: 'px', ratioLabel: '1:1' },
  { id: 'landscape-16-9', name: '横版相册', width: 1920, height: 1080, unit: 'px', ratioLabel: '16:9' },
  { id: 'portrait-3-4', name: '竖版相册', width: 1200, height: 1600, unit: 'px', ratioLabel: '3:4' },
];

export const themeOptions: TemplateThemeOption[] = [
  { id: 'watercolor', name: '水彩手账风', description: '柔和色块、胶带和手写感留白', accent: '#d56a86', accentSoft: '#f8c9d4', source: 'built-in' },
  { id: 'travel', name: '旅行相册风', description: '明信片、路线和印章元素', accent: '#2f7f8f', accentSoft: '#bddfe4', source: 'built-in' },
  { id: 'kids', name: '亲子成长风', description: '暖色纸张、贴纸和圆角照片框', accent: '#f08c42', accentSoft: '#ffd7a8', source: 'built-in' },
  { id: 'memory', name: '纪念册风', description: '沉稳纸感、边框和典藏式排版', accent: '#8d6b4f', accentSoft: '#ded0bf', source: 'built-in' },
  { id: 'minimal', name: '极简留白风', description: '大留白、细线和简洁字体', accent: '#111827', accentSoft: '#e5e7eb', source: 'built-in' },
];

const backgrounds: Record<string, TemplateBackground> = {
  watercolor: {
    base: '#fff7f5',
    paper: '#fffaf4',
    accent: '#d56a86',
    accentSoft: '#f8c9d4',
    ink: '#5f5147',
    pattern: 'watercolor',
  },
  travel: {
    base: '#f5f0e8',
    paper: '#fff8ea',
    accent: '#2f7f8f',
    accentSoft: '#bddfe4',
    ink: '#3e4a4f',
    pattern: 'travel',
  },
  kids: {
    base: '#fff5d6',
    paper: '#fffaf0',
    accent: '#f08c42',
    accentSoft: '#ffd7a8',
    ink: '#69462d',
    pattern: 'kids',
  },
  memory: {
    base: '#f1ede6',
    paper: '#fbf8f1',
    accent: '#8d6b4f',
    accentSoft: '#ded0bf',
    ink: '#45382f',
    pattern: 'memory',
  },
  minimal: {
    base: '#f8f8f5',
    paper: '#ffffff',
    accent: '#111827',
    accentSoft: '#e5e7eb',
    ink: '#111827',
    pattern: 'minimal',
  },
};

const cdnTemplatePackages = new Map<string, TemplatePackage>();

function backgroundForStyle(style: string) {
  return backgrounds[style] ?? backgrounds.minimal;
}

function isBackgroundPattern(value: string): value is TemplateBackground['pattern'] {
  return ['watercolor', 'travel', 'kids', 'memory', 'minimal'].includes(value);
}

export function createTemplateBackground(style: string, image?: string, colors?: Partial<Omit<TemplateBackground, 'pattern' | 'image'>>) {
  const fallback = backgroundForStyle(style);
  return {
    ...fallback,
    ...colors,
    pattern: isBackgroundPattern(style) ? style : fallback.pattern,
    image,
  };
}

function templateList(pkg: TemplatePackage) {
  return [...pkg.coverTemplates, ...pkg.tocTemplates, ...pkg.contentTemplates, ...pkg.endingTemplates];
}

function scaleTemplate(template: PageTemplate, width: number, height: number): PageTemplate {
  if (template.pageWidth === width && template.pageHeight === height) return template;
  const scaleX = width / template.pageWidth;
  const scaleY = height / template.pageHeight;
  const fontScale = Math.min(scaleX, scaleY);
  return {
    ...template,
    pageWidth: width,
    pageHeight: height,
    frames: template.frames.map((frame) => ({
      ...frame,
      x: Math.round(frame.x * scaleX),
      y: Math.round(frame.y * scaleY),
      width: Math.round(frame.width * scaleX),
      height: Math.round(frame.height * scaleY),
      radius: frame.radius === undefined ? undefined : Math.round(frame.radius * fontScale),
    })),
    textAreas: template.textAreas.map((area) => ({
      ...area,
      x: Math.round(area.x * scaleX),
      y: Math.round(area.y * scaleY),
      width: Math.round(area.width * scaleX),
      height: Math.round(area.height * scaleY),
      fontSize: Math.round(area.fontSize * fontScale),
    })),
  };
}

function scaleTemplatePackage(pkg: TemplatePackage, width: number, height: number): TemplatePackage {
  return {
    ...pkg,
    coverTemplates: pkg.coverTemplates.map((template) => scaleTemplate(template, width, height)),
    tocTemplates: pkg.tocTemplates.map((template) => scaleTemplate(template, width, height)),
    contentTemplates: pkg.contentTemplates.map((template) => scaleTemplate(template, width, height)),
    endingTemplates: pkg.endingTemplates.map((template) => scaleTemplate(template, width, height)),
  };
}

function findCdnPackageByTemplateId(templateId: string) {
  for (const pkg of cdnTemplatePackages.values()) {
    if (templateList(pkg).some((template) => template.id === templateId)) return pkg;
  }
  return undefined;
}

export function registerCdnTemplatePackages(packages: TemplatePackage[]) {
  packages.forEach((pkg) => {
    cdnTemplatePackages.set(pkg.id, pkg);
  });
}

export function getAvailableThemeOptions(): TemplateThemeOption[] {
  const optionsById = new Map<string, TemplateThemeOption>();
  themeOptions.forEach((option) => {
    optionsById.set(option.id, option);
  });
  cdnTemplatePackages.forEach((pkg) => {
    const background = pkg.coverTemplates[0]?.background ?? backgroundForStyle(pkg.style);
    optionsById.set(pkg.id, {
      id: pkg.id,
      name: pkg.name,
      description: pkg.version ? `CDN template · ${pkg.version}` : 'CDN template',
      accent: background.accent,
      accentSoft: background.accentSoft,
      source: 'cdn',
    });
  });
  return [...optionsById.values()];
}

type Box = [number, number, number, number, number?];

function px(width: number, height: number, box: Box) {
  const [x, y, w, h, r = 0] = box;
  return {
    x: Math.round(width * x),
    y: Math.round(height * y),
    width: Math.round(width * w),
    height: Math.round(height * h),
    rotation: r,
    radius: Math.round(Math.min(width, height) * 0.018),
    fit: 'cover' as const,
    objectPositionX: 50,
    objectPositionY: 50,
  };
}

function text(width: number, height: number, id: string, type: PageTemplate['textAreas'][number]['type'], x: number, y: number, w: number, h: number, fontSize: number, color?: string, align: 'left' | 'center' | 'right' = 'left', fontWeight?: string | number) {
  return {
    id,
    type,
    x: Math.round(width * x),
    y: Math.round(height * y),
    width: Math.round(width * w),
    height: Math.round(height * h),
    fontSize: Math.round(Math.min(width, height) * fontSize),
    fontFamily: type === 'notes' || type === 'date' ? 'handwriting' : 'serif',
    color,
    align,
    fontWeight,
    lineHeight: 1.35,
  };
}

function contentFrames(width: number, height: number, count: number, style: string) {
  const isLandscape = width > height;
  const safeTop = isLandscape ? 0.18 : 0.22;
  const accentRotation = style === 'minimal' ? 0 : undefined;
  const frameBoxes: Record<number, Box[]> = isLandscape
    ? {
        1: [[0.12, 0.22, 0.76, 0.58, accentRotation ?? -1]],
        2: [[0.09, 0.24, 0.39, 0.54, accentRotation ?? -2], [0.52, 0.24, 0.39, 0.54, accentRotation ?? 2]],
        4: [[0.08, 0.22, 0.4, 0.25, accentRotation ?? -2], [0.52, 0.22, 0.4, 0.25, accentRotation ?? 2], [0.08, 0.54, 0.4, 0.25, accentRotation ?? 1], [0.52, 0.54, 0.4, 0.25, accentRotation ?? -1]],
        6: [[0.06, 0.2, 0.28, 0.24, accentRotation ?? -2], [0.36, 0.2, 0.28, 0.24, accentRotation ?? 1], [0.66, 0.2, 0.28, 0.24, accentRotation ?? 2], [0.06, 0.53, 0.28, 0.24, accentRotation ?? 1], [0.36, 0.53, 0.28, 0.24, accentRotation ?? -1], [0.66, 0.53, 0.28, 0.24, accentRotation ?? -2]],
      }
    : {
        1: [[0.12, safeTop, 0.76, 0.55, accentRotation ?? -2]],
        2: [[0.11, 0.23, 0.78, 0.28, accentRotation ?? -2], [0.11, 0.56, 0.78, 0.28, accentRotation ?? 2]],
        4: [[0.08, 0.23, 0.4, 0.25, accentRotation ?? -3], [0.53, 0.25, 0.38, 0.25, accentRotation ?? 2], [0.1, 0.55, 0.38, 0.25, accentRotation ?? 2], [0.53, 0.57, 0.39, 0.25, accentRotation ?? -2]],
        6: [[0.08, 0.22, 0.39, 0.2, accentRotation ?? -2], [0.53, 0.22, 0.39, 0.2, accentRotation ?? 2], [0.08, 0.46, 0.39, 0.2, accentRotation ?? 1], [0.53, 0.46, 0.39, 0.2, accentRotation ?? -1], [0.08, 0.7, 0.39, 0.18, accentRotation ?? 2], [0.53, 0.7, 0.39, 0.18, accentRotation ?? -2]],
      };
  return frameBoxes[count].map((box, index) => ({ id: `photo-${index + 1}`, ...px(width, height, box) }));
}

function createContentTemplate(style: string, width: number, height: number, count: number): PageTemplate {
  const bg = backgroundForStyle(style);
  return {
    id: `${style}-page-${count}-01`,
    name: `${themeName(style)} ${count} 图模板`,
    style,
    type: 'content',
    photoCount: count,
    pageWidth: width,
    pageHeight: height,
    background: bg,
    overlay: true,
    frames: contentFrames(width, height, count, style),
    textAreas: [
      text(width, height, 'title', 'title', 0.08, 0.06, 0.65, 0.08, 0.046, bg.accent, 'left', 700),
      text(width, height, 'date', 'date', 0.72, 0.08, 0.2, 0.04, 0.022, bg.ink, 'right'),
      text(width, height, 'notes', 'notes', 0.1, 0.9, 0.8, 0.07, 0.022, bg.ink, 'center'),
      text(width, height, 'pageNumber', 'pageNumber', 0.45, 0.965, 0.1, 0.02, 0.014, bg.ink, 'center'),
    ],
  };
}

function themeName(style: string) {
  const cdnPackage = cdnTemplatePackages.get(style);
  if (cdnPackage) return cdnPackage.name;
  return themeOptions.find((item) => item.id === style)?.name ?? style;
}

function createCoverTemplate(style: string, width: number, height: number): PageTemplate {
  const bg = backgroundForStyle(style);
  const isLandscape = width > height;
  const coverFrame = isLandscape
    ? px(width, height, [0.55, 0.18, 0.34, 0.55, style === 'minimal' ? 0 : 2])
    : px(width, height, [0.18, 0.32, 0.64, 0.36, style === 'minimal' ? 0 : -2]);
  return {
    id: `${style}-cover-01`,
    name: `${themeName(style)}封面`,
    style,
    type: 'cover',
    photoCount: 1,
    pageWidth: width,
    pageHeight: height,
    background: bg,
    overlay: true,
    frames: [{ id: 'cover-photo', ...coverFrame }],
    textAreas: isLandscape
      ? [
          text(width, height, 'title', 'title', 0.09, 0.22, 0.38, 0.16, 0.066, bg.accent, 'left', 800),
          text(width, height, 'subtitle', 'subtitle', 0.1, 0.42, 0.36, 0.08, 0.028, bg.ink),
          text(width, height, 'date', 'date', 0.1, 0.55, 0.28, 0.05, 0.021, bg.ink),
          text(width, height, 'author', 'author', 0.1, 0.65, 0.28, 0.05, 0.018, bg.ink),
        ]
      : [
          text(width, height, 'title', 'title', 0.1, 0.11, 0.8, 0.12, 0.064, bg.accent, 'center', 800),
          text(width, height, 'subtitle', 'subtitle', 0.15, 0.23, 0.7, 0.06, 0.028, bg.ink, 'center'),
          text(width, height, 'date', 'date', 0.18, 0.72, 0.64, 0.04, 0.021, bg.ink, 'center'),
          text(width, height, 'author', 'author', 0.18, 0.78, 0.64, 0.04, 0.018, bg.ink, 'center'),
        ],
  };
}

function createTocTemplate(style: string, width: number, height: number): PageTemplate {
  const bg = backgroundForStyle(style);
  return {
    id: `${style}-toc-01`,
    name: `${themeName(style)}目录`,
    style,
    type: 'toc',
    photoCount: 0,
    pageWidth: width,
    pageHeight: height,
    background: bg,
    overlay: true,
    frames: [],
    textAreas: [
      text(width, height, 'title', 'title', 0.1, 0.08, 0.8, 0.09, 0.056, bg.accent, 'center', 800),
      text(width, height, 'toc', 'toc', 0.16, 0.22, 0.68, 0.66, 0.025, bg.ink, 'left'),
      text(width, height, 'pageNumber', 'pageNumber', 0.45, 0.965, 0.1, 0.02, 0.014, bg.ink, 'center'),
    ],
  };
}

function createEndingTemplate(style: string, width: number, height: number): PageTemplate {
  const bg = backgroundForStyle(style);
  return {
    id: `${style}-ending-01`,
    name: `${themeName(style)}结束页`,
    style,
    type: 'ending',
    photoCount: 0,
    pageWidth: width,
    pageHeight: height,
    background: bg,
    overlay: true,
    frames: [],
    textAreas: [
      text(width, height, 'title', 'title', 0.12, 0.36, 0.76, 0.1, 0.054, bg.accent, 'center', 800),
      text(width, height, 'notes', 'notes', 0.18, 0.5, 0.64, 0.15, 0.025, bg.ink, 'center'),
    ],
  };
}

export function createTemplatePackage(style: string, width: number, height: number): TemplatePackage {
  const cdnPackage = cdnTemplatePackages.get(style);
  if (cdnPackage) return scaleTemplatePackage(cdnPackage, width, height);

  return {
    id: style,
    name: themeName(style),
    style,
    coverTemplates: [createCoverTemplate(style, width, height)],
    tocTemplates: [createTocTemplate(style, width, height)],
    contentTemplates: [1, 2, 4, 6].map((count) => createContentTemplate(style, width, height, count)),
    endingTemplates: [createEndingTemplate(style, width, height)],
  };
}

export function createAllTemplatePackages(width: number, height: number): TemplatePackage[] {
  return themeOptions.map((theme) => createTemplatePackage(theme.id, width, height));
}

export function selectTemplateByPhotoCount(templates: PageTemplate[], photoCount: number) {
  return templates.find((template) => template.photoCount === photoCount) ?? templates[0];
}

export function getTemplateById(templateId: string, width: number, height: number): PageTemplate {
  const style = findCdnPackageByTemplateId(templateId)?.id ?? templateId.split('-')[0];
  const pkg = createTemplatePackage(style, width, height);
  const all = [...pkg.coverTemplates, ...pkg.tocTemplates, ...pkg.contentTemplates, ...pkg.endingTemplates];
  return all.find((template) => template.id === templateId) ?? all[0];
}

export function getPresetSize(presetId: string) {
  return albumSizePresets.find((preset) => preset.id === presetId) ?? albumSizePresets[1];
}

export function getRenderSize(size: { width: number; height: number; unit: 'px' | 'mm'; dpi: number }) {
  if (size.unit === 'mm') {
    return {
      width: mmToPx(size.width, size.dpi),
      height: mmToPx(size.height, size.dpi),
    };
  }
  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
  };
}
