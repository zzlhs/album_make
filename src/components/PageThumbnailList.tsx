import { getRenderSize, getTemplateById } from '../templates/templateRegistry';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation } from '../i18n';

export function PageThumbnailList() {
  const { pages, currentPageId, setCurrentPage, size } = useAlbumStore();
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
        return (
          <button
            key={page.id}
            className={page.id === currentPageId ? 'thumbnail-card active' : 'thumbnail-card'}
            onClick={() => setCurrentPage(page.id)}
          >
            <div className="mini-page" style={{ aspectRatio: `${template.pageWidth}/${template.pageHeight}`, background: miniPageBackground }}>
              {template.frames.map((frame) => (
                <span
                  key={frame.id}
                  style={{
                    left: `${(frame.x / template.pageWidth) * 100}%`,
                    top: `${(frame.y / template.pageHeight) * 100}%`,
                    width: `${(frame.width / template.pageWidth) * 100}%`,
                    height: `${(frame.height / template.pageHeight) * 100}%`,
                  }}
                />
              ))}
            </div>
            <strong>{String(page.pageNumber).padStart(2, '0')} {typeLabel[page.type]}</strong>
            <small>{page.title || template.name}</small>
          </button>
        );
      })}
    </aside>
  );
}
