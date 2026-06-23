import type { PageTemplate, PhotoFrameTemplate, TemplateFont, TemplatePackage, TextAreaTemplate } from './templateTypes';
import { createTemplateBackground } from './templateRegistry';

type CdnTemplateFont = {
  id?: unknown;
  family?: unknown;
  src?: unknown;
  weight?: unknown;
};

type CdnPageTemplate = {
  id?: unknown;
  name?: unknown;
  style?: unknown;
  type?: unknown;
  photoCount?: unknown;
  pageWidth?: unknown;
  pageHeight?: unknown;
  background?: unknown;
  overlay?: unknown;
  frames?: unknown;
  textAreas?: unknown;
};

type CdnTemplatePackage = {
  id?: unknown;
  name?: unknown;
  style?: unknown;
  version?: unknown;
  baseUrl?: unknown;
  fonts?: unknown;
  coverTemplates?: CdnPageTemplate[];
  tocTemplates?: CdnPageTemplate[];
  contentTemplates?: CdnPageTemplate[];
  endingTemplates?: CdnPageTemplate[];
};

export function parseTemplateCdnUrls(value?: string) {
  return (value ?? '')
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`模板字段 ${field} 不能为空`);
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requiredNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`模板字段 ${field} 必须是数字`);
  return value;
}

function normalizeFrames(value: unknown, field: string) {
  if (!Array.isArray(value)) throw new Error(`模板字段 ${field} 必须是数组`);
  return value as PhotoFrameTemplate[];
}

function normalizeTextAreaInput(value: unknown, field: string) {
  if (!Array.isArray(value)) throw new Error(`模板字段 ${field} 必须是数组`);
  return value as TextAreaTemplate[];
}

function normalizePageType(value: unknown, field: string) {
  const type = requiredString(value, field);
  if (!['cover', 'toc', 'content', 'ending'].includes(type)) throw new Error(`模板字段 ${field} 类型不支持`);
  return type as PageTemplate['type'];
}

function resolveAsset(baseUrl: string, pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, baseUrl).toString();
}

function normalizeFonts(fonts: unknown, baseUrl: string): TemplateFont[] {
  if (fonts === undefined) return [];
  if (!Array.isArray(fonts)) throw new Error('模板字段 fonts 必须是数组');
  return fonts.map((font: CdnTemplateFont, index) => {
    const id = requiredString(font.id, `fonts[${index}].id`);
    const family = requiredString(font.family, `fonts[${index}].family`);
    const src = requiredString(font.src, `fonts[${index}].src`);
    return {
      id,
      family,
      src: resolveAsset(baseUrl, src),
      weight: typeof font.weight === 'number' || typeof font.weight === 'string' ? font.weight : undefined,
    };
  });
}

function normalizeTextAreas(textAreas: TextAreaTemplate[], fontMap: Map<string, string>) {
  return textAreas.map((area) => {
    const fontFamily = area.fontFamily && fontMap.has(area.fontFamily) ? fontMap.get(area.fontFamily) : area.fontFamily;
    return { ...area, fontFamily };
  });
}

function normalizePageTemplate(template: CdnPageTemplate, packageStyle: string, baseUrl: string, fontMap: Map<string, string>) {
  const id = requiredString(template.id, 'template.id');
  const type = normalizePageType(template.type, `${id}.type`);
  const style = optionalString(template.style) ?? packageStyle;
  const background = requiredString(template.background, `${id}.background`);
  const overlay = optionalString(template.overlay);
  return {
    id,
    name: requiredString(template.name, `${id}.name`),
    style,
    type,
    photoCount: requiredNumber(template.photoCount, `${id}.photoCount`),
    pageWidth: requiredNumber(template.pageWidth, `${id}.pageWidth`),
    pageHeight: requiredNumber(template.pageHeight, `${id}.pageHeight`),
    background: createTemplateBackground(style, resolveAsset(baseUrl, background)),
    overlay: overlay ? resolveAsset(baseUrl, overlay) : null,
    frames: normalizeFrames(template.frames, `${id}.frames`),
    textAreas: normalizeTextAreas(normalizeTextAreaInput(template.textAreas, `${id}.textAreas`), fontMap),
  } satisfies PageTemplate;
}

function normalizePageList(
  list: CdnPageTemplate[] | undefined,
  field: string,
  packageStyle: string,
  baseUrl: string,
  fontMap: Map<string, string>,
) {
  if (!Array.isArray(list)) throw new Error(`模板字段 ${field} 必须是数组`);
  return list.map((template) => normalizePageTemplate(template, packageStyle, baseUrl, fontMap));
}

function validateTemplatePackage(pkg: TemplatePackage) {
  if (!pkg.coverTemplates.length) throw new Error(`${pkg.id} 缺少 coverTemplates`);
  if (!pkg.tocTemplates.length) throw new Error(`${pkg.id} 缺少 tocTemplates`);
  if (!pkg.endingTemplates.length) throw new Error(`${pkg.id} 缺少 endingTemplates`);
  const counts = new Set(pkg.contentTemplates.map((template) => template.photoCount));
  [1, 2, 4, 6].forEach((count) => {
    if (!counts.has(count)) throw new Error(`${pkg.id} 缺少 ${count} 图正文模板`);
  });
}

async function loadTemplateFont(font: TemplateFont) {
  if (!('FontFace' in window)) return;
  const face = new FontFace(font.family, `url(${font.src})`, {
    weight: font.weight === undefined ? undefined : String(font.weight),
  });
  await face.load();
  document.fonts.add(face);
}

async function loadTemplateFonts(fonts: TemplateFont[]) {
  await Promise.all(fonts.map((font) => loadTemplateFont(font)));
}

export async function loadTemplatePackageFromCdn(url: string) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`模板加载失败：${response.status} ${response.statusText}`);

  const json = (await response.json()) as CdnTemplatePackage;
  const id = requiredString(json.id, 'id');
  const style = requiredString(json.style ?? json.id, 'style');
  const baseUrl = optionalString(json.baseUrl) ?? new URL('.', response.url || url).toString();
  const fonts = normalizeFonts(json.fonts, baseUrl);
  const fontMap = new Map(fonts.map((font) => [font.id, font.family]));
  const pkg: TemplatePackage = {
    id,
    name: requiredString(json.name, 'name'),
    style,
    version: optionalString(json.version),
    baseUrl,
    fonts,
    coverTemplates: normalizePageList(json.coverTemplates, 'coverTemplates', style, baseUrl, fontMap),
    tocTemplates: normalizePageList(json.tocTemplates, 'tocTemplates', style, baseUrl, fontMap),
    contentTemplates: normalizePageList(json.contentTemplates, 'contentTemplates', style, baseUrl, fontMap),
    endingTemplates: normalizePageList(json.endingTemplates, 'endingTemplates', style, baseUrl, fontMap),
  };

  validateTemplatePackage(pkg);
  await loadTemplateFonts(fonts);
  await document.fonts.ready;
  return pkg;
}
