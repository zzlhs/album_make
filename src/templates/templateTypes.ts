export type AlbumSizePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'px' | 'mm';
  ratioLabel: string;
};

export type UserPhoto = {
  id: string;
  file: File;
  url: string;
  name: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
};

export type PhotoFrameState = {
  photoId: string;
  frameId: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
  objectPositionX: number;
  objectPositionY: number;
};

export type TextAreaType = 'title' | 'subtitle' | 'date' | 'notes' | 'author' | 'pageNumber' | 'toc';

export type PhotoFrameTemplate = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  radius?: number;
  fit: 'cover';
  objectPositionX: number;
  objectPositionY: number;
};

export type TextAreaTemplate = {
  id: string;
  type: TextAreaType;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  align?: CanvasTextAlign | 'left' | 'center' | 'right';
  lineHeight?: number;
};

export type TemplateBackground = {
  base: string;
  paper: string;
  accent: string;
  accentSoft: string;
  ink: string;
  pattern: 'watercolor' | 'travel' | 'kids' | 'memory' | 'minimal';
  image?: string;
};

export type TemplateFont = {
  id: string;
  family: string;
  src: string;
  weight?: number | string;
};

export type PageTemplate = {
  id: string;
  name: string;
  style: string;
  type: 'cover' | 'toc' | 'content' | 'ending';
  photoCount: number;
  pageWidth: number;
  pageHeight: number;
  background: TemplateBackground;
  overlay?: boolean | string | null;
  frames: PhotoFrameTemplate[];
  textAreas: TextAreaTemplate[];
};

export type TemplatePackage = {
  id: string;
  name: string;
  style: string;
  version?: string;
  baseUrl?: string;
  fonts?: TemplateFont[];
  coverTemplates: PageTemplate[];
  tocTemplates: PageTemplate[];
  contentTemplates: PageTemplate[];
  endingTemplates: PageTemplate[];
};

export type AlbumMeta = {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  description?: string;
  theme: string;
  sizePresetId: string;
};

export type AlbumPage = {
  id: string;
  type: 'cover' | 'toc' | 'content' | 'ending';
  templateId: string;
  photos: UserPhoto[];
  title?: string;
  date?: string;
  notes?: string;
  pageNumber: number;
  frameStates: Record<string, PhotoFrameState>;
};

export type TocItem = {
  title: string;
  pageNumber: number;
};

export type AlbumSize = {
  width: number;
  height: number;
  unit: 'px' | 'mm';
  dpi: number;
};
