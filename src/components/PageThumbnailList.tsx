import { getRenderSize, getTemplateById } from '../templates/templateRegistry';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation } from '../i18n';
import { resolveFrame } from '../utils/frameState';

export function PageThumbnailList() {
  const { pages, currentPageId, setCurrentPage, size, meta } = useAlbumStore();
  const { t } = useTranslation();
  const renderSize = getRenderSize(size);
  if (!pages.length) return null;

  const typeLabel = {
    cover: t('cover'),
    toc: t('toc'),
    content: t('content'),
    ending: t('ending'),
  } as const;

  return (
    <aside className="thumbnail-list smooth-scroll glass-panel">
      <div className="thumbnail-title">{t('pages')}</div>
      {pages.map((page) => {
        const template = getTemplateById(page.templateId, renderSize.width, renderSize.height);
        const miniPageBackground = template.background.image
          ? `${template.background.base} url("${template.background.image}") center / cover no-repeat`
          : template.background.base;
        const pageTitle = page.type === 'cover'
          ? meta.title || t('coverFallbackTitle')
          : page.title || (page.type === 'toc' ? t('tocTitle') : page.type === 'ending' ? t('endingTitle') : template.name);
        return (
          <button
            key={page.id}
            className={page.id === currentPageId ? 'thumbnail-card active' : 'thumbnail-card'}
            onClick={() => setCurrentPage(page.id)}
          >
            <div className="mini-page" style={{ aspectRatio: `${template.pageWidth}/${template.pageHeight}`, background: miniPageBackground }}>
              {template.frames.map((frame) => {
                const resolved = resolveFrame(frame, page.frameStates[frame.id]);
                return (
                  <span
                    key={frame.id}
                    style={{
                      left: `${(resolved.x / template.pageWidth) * 100}%`,
                      top: `${(resolved.y / template.pageHeight) * 100}%`,
                      width: `${(resolved.width / template.pageWidth) * 100}%`,
                      height: `${(resolved.height / template.pageHeight) * 100}%`,
                      transform: `rotate(${resolved.rotation || 0}deg)`,
                      transformOrigin: 'center',
                    }}
                  />
                );
              })}
            </div>
            <strong>{String(page.pageNumber).padStart(2, '0')} {typeLabel[page.type]}</strong>
            <small>{pageTitle}</small>
          </button>
        );
      })}
    </aside>
  );
}
