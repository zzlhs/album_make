import { useRef, useState, useEffect } from 'react';
import type { AlbumMeta, AlbumPage, PageTemplate, TextAreaTemplate } from '../templates/templateTypes';
import { generateTocItems } from '../utils/pagination';
import { PhotoFrame } from './PhotoFrame';
import { translate, useTranslation, type TranslationKey } from '../i18n';
import type { Language } from '../store/uiStore';

function usePreviewStageSize() {
  const [size, setSize] = useState({ width: 760, height: 600 });
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const parent = sentinel.parentElement;
    if (!parent) return;

    const measure = () => {
      const rect = parent.getBoundingClientRect();
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return { size, sentinelRef };
}

export function AlbumPagePreview({ page, template, meta, pages }: { page: AlbumPage; template: PageTemplate; meta: AlbumMeta; pages: AlbumPage[] }) {
  const { size: stageSize, sentinelRef } = usePreviewStageSize();
  const { language } = useTranslation();
  const hasImageBackground = Boolean(template.background.image);

  const padding = 40;
  const availableWidth = stageSize.width - padding;
  const availableHeight = stageSize.height - padding;
  const widthScale = availableWidth / template.pageWidth;
  const heightScale = availableHeight / template.pageHeight;
  const previewScale = Math.min(1, widthScale, heightScale);

  return (
    <div ref={sentinelRef} className="preview-shell" style={{ width: template.pageWidth * previewScale, height: template.pageHeight * previewScale }}>
      <div
        className={`album-page-surface ${template.background.pattern}${hasImageBackground ? ' asset-template' : ''}`}
        style={{
          width: template.pageWidth,
          height: template.pageHeight,
          transform: `scale(${previewScale})`,
          background: hasImageBackground
            ? `${template.background.paper} url("${template.background.image}") center / 100% 100% no-repeat`
            : `linear-gradient(135deg, ${template.background.base}, ${template.background.paper})`,
          color: template.background.ink,
        }}
      >
        {!hasImageBackground && <div className="surface-blob one" style={{ backgroundColor: template.background.accentSoft }} />}
        {!hasImageBackground && <div className="surface-blob two" style={{ backgroundColor: template.background.accent }} />}
        {template.frames.map((frame, index) => (
          <PhotoFrame key={frame.id} page={page} frame={frame} photo={page.photos[index]} previewScale={previewScale} pageWidth={template.pageWidth} pageHeight={template.pageHeight} />
        ))}
        {typeof template.overlay === 'string' && <img className="template-overlay-image" src={template.overlay} crossOrigin="anonymous" alt="" aria-hidden />}
        {template.overlay === true && <DecorativeOverlay template={template} />}
        {template.textAreas.map((area) => (
          <PreviewText key={area.id} area={area} page={page} template={template} meta={meta} pages={pages} language={language} />
        ))}
      </div>
    </div>
  );
}

function t(language: Language, key: TranslationKey, params?: Record<string, string | number>) {
  return translate(language, key, params);
}

function resolveText(area: TextAreaTemplate, page: AlbumPage, meta: AlbumMeta, pages: AlbumPage[], language: Language) {
  if (area.type === 'title') {
    if (page.type === 'cover') return meta.title || t(language, 'coverFallbackTitle');
    if (page.type === 'toc') return page.title || t(language, 'tocTitle');
    if (page.type === 'ending') return page.title || t(language, 'endingTitle');
    return page.title || `${t(language, 'memory')} ${page.pageNumber}`;
  }
  if (area.type === 'subtitle') return meta.subtitle || meta.description || '';
  if (area.type === 'author') return meta.author ? (language === 'zh' ? `制作：${meta.author}` : `By ${meta.author}`) : '';
  if (area.type === 'date') return page.date || meta.date || '';
  if (area.type === 'notes') return page.notes || (page.type === 'ending' ? t(language, 'endingNote') : '');
  if (area.type === 'pageNumber') return String(page.pageNumber).padStart(2, '0');
  if (area.type === 'toc') {
    return generateTocItems(pages)
      .map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item.title}  ·  ${item.pageNumber}`)
      .join('\n');
  }
  return '';
}

function textFontFamily(area: TextAreaTemplate) {
  if (!area.fontFamily || area.fontFamily === 'serif') return 'Georgia, "Noto Serif SC", serif';
  if (area.fontFamily === 'handwriting') return '"Comic Sans MS", "KaiTi", cursive';
  return `"${area.fontFamily}", "Noto Serif SC", serif`;
}

function PreviewText({ area, page, template, meta, pages, language }: { area: TextAreaTemplate; page: AlbumPage; template: PageTemplate; meta: AlbumMeta; pages: AlbumPage[]; language: Language }) {
  const content = resolveText(area, page, meta, pages, language);
  if (!content) return null;
  return (
    <div
      className={`preview-text ${area.type}`}
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
        fontSize: area.fontSize,
        color: area.color || template.background.ink,
        textAlign: area.align || 'left',
        fontWeight: area.fontWeight,
        fontFamily: textFontFamily(area),
        lineHeight: area.lineHeight,
      }}
    >
      {content.split('\n').map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
    </div>
  );
}

function DecorativeOverlay({ template }: { template: PageTemplate }) {
  return (
    <div className="decorative-overlay" aria-hidden>
      {template.background.pattern === 'travel' ? <span className="postmark">POSTCARD</span> : <span className="star top">✦</span>}
      {template.background.pattern !== 'minimal' && <span className="star bottom">✦</span>}
    </div>
  );
}
