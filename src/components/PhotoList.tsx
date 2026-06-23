import { useMemo } from 'react';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation } from '../i18n';

const NEW_PAGE_VALUE = '__new_page__';
const UNASSIGNED_VALUE = '__unassigned__';

export function PhotoList() {
  const {
    photos,
    pages,
    removePhoto,
    reorderPhotos,
    generatePages,
    assignPhotoToPage,
    addContentPage,
    removePhotoFromPage,
  } = useAlbumStore();
  const { t } = useTranslation();
  const contentPages = pages.filter((page) => page.type === 'content');

  const photoPageMap = useMemo(() => {
    const map = new Map<string, string>();
    contentPages.forEach((page) => {
      page.photos.forEach((photo) => map.set(photo.id, page.id));
    });
    return map;
  }, [contentPages]);

  if (!photos.length) return null;

  function handleAssign(photoId: string, value: string) {
    if (value === NEW_PAGE_VALUE) {
      addContentPage(photoId);
      return;
    }
    const currentPageId = photoPageMap.get(photoId);
    if (value === UNASSIGNED_VALUE) {
      if (currentPageId) removePhotoFromPage(photoId, currentPageId);
      return;
    }
    assignPhotoToPage(photoId, value);
  }

  return (
    <section className="panel-section compact">
      <div className="section-heading small">
        <div>
          <h2>{t('photoOrder')}</h2>
          <p>{t('photoOrderDesc')}</p>
        </div>
        <button className="secondary-button" onClick={generatePages}>{t('regenerate')}</button>
      </div>
      <div className="photo-list smooth-scroll">
        {photos.map((photo, index) => {
          const assignedPageId = photoPageMap.get(photo.id) ?? UNASSIGNED_VALUE;
          return (
            <div className="photo-list-item" key={photo.id}>
              <img src={photo.url} alt={photo.name} />
              <div className="photo-list-main">
                <strong>{photo.name}</strong>
                <span>{photo.width} × {photo.height}</span>
                <label className="assignment-field">
                  {t('assignToPage')}
                  <select value={assignedPageId} onChange={(event) => handleAssign(photo.id, event.target.value)}>
                    <option value={UNASSIGNED_VALUE}>{t('unassigned')}</option>
                    {contentPages.map((page) => (
                      <option key={page.id} value={page.id} disabled={page.photos.length >= 6 && assignedPageId !== page.id}>
                        {t('contentPageLabel', {
                          page: page.pageNumber,
                          title: page.title || `${t('memory')} ${page.pageNumber}`,
                          count: page.photos.length,
                        })}
                      </option>
                    ))}
                    <option value={NEW_PAGE_VALUE}>+ {t('createPage')}</option>
                  </select>
                </label>
              </div>
              <div className="photo-actions">
                <button disabled={index === 0} onClick={() => reorderPhotos(index, index - 1)} aria-label="Move up">↑</button>
                <button disabled={index === photos.length - 1} onClick={() => reorderPhotos(index, index + 1)} aria-label="Move down">↓</button>
                <button onClick={() => removePhoto(photo.id)}>{t('delete')}</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
