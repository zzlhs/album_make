import { useMemo } from 'react';
import { useAlbumStore } from '../store/albumStore';
import { generateNoteText, themeToCopywritingType } from '../utils/copywriting';
import { useTranslation } from '../i18n';

export function TextAreaEditor() {
  const {
    meta,
    setMeta,
    pages,
    photos,
    currentPageId,
    updatePage,
    resetFrameState,
    selectedThemeId,
    assignPhotoToPage,
    removePhotoFromPage,
    addContentPage,
  } = useAlbumStore();
  const { t } = useTranslation();
  const page = pages.find((item) => item.id === currentPageId);

  const photoPageMap = useMemo(() => {
    const map = new Map<string, string>();
    pages.filter((item) => item.type === 'content').forEach((contentPage) => {
      contentPage.photos.forEach((photo) => map.set(photo.id, contentPage.id));
    });
    return map;
  }, [pages]);

  return (
    <aside className="editor-panel smooth-scroll glass-panel">
      <section className="panel-section compact">
        <h2>{t('albumInfo')}</h2>
        <label>{t('bookTitle')}<input value={meta.title} onChange={(event) => setMeta({ title: event.target.value })} /></label>
        <label>{t('subtitle')}<input value={meta.subtitle || ''} onChange={(event) => setMeta({ subtitle: event.target.value })} /></label>
        <label>{t('author')}<input value={meta.author || ''} onChange={(event) => setMeta({ author: event.target.value })} /></label>
        <label>{t('date')}<input type="date" value={meta.date || ''} onChange={(event) => setMeta({ date: event.target.value })} /></label>
        <label>{t('description')}<textarea value={meta.description || ''} onChange={(event) => setMeta({ description: event.target.value })} /></label>
      </section>

      {page && (
        <section className="panel-section compact">
          <h2>{t('pageSettings')}</h2>
          <div className="muted-line">{t('pageType', { page: page.pageNumber, type: t(page.type) })}</div>
          <label>{t('pageTitle')}<input value={page.title || ''} onChange={(event) => updatePage(page.id, { title: event.target.value })} /></label>
          <label>{t('date')}<input type="date" value={page.date || ''} onChange={(event) => updatePage(page.id, { date: event.target.value })} /></label>
          <label>{t('notes')}<textarea value={page.notes || ''} onChange={(event) => updatePage(page.id, { notes: event.target.value })} /></label>
          <button className="secondary-button" onClick={() => updatePage(page.id, { notes: generateNoteText(themeToCopywritingType(selectedThemeId)) })}>{t('generateLocalText')}</button>
          {!!Object.keys(page.frameStates).length && (
            <div className="frame-reset-list">
              <strong>{t('photoFrameAdjust')}</strong>
              {Object.keys(page.frameStates).map((frameId) => (
                <button key={frameId} className="ghost-button" onClick={() => resetFrameState(page.id, frameId)}>{frameId} {t('reset')}</button>
              ))}
              <small>{t('frameHelp')}</small>
            </div>
          )}
        </section>
      )}

      {page?.type === 'content' && (
        <section className="panel-section compact manual-assignment-panel">
          <div className="section-heading small">
            <div>
              <h2>{t('manualAssign')}</h2>
              <p>{t('manualAssignDesc')}</p>
            </div>
            <button className="ghost-button" onClick={() => addContentPage()}>{t('addEmptyPage')}</button>
          </div>
          <div className="assignment-photo-grid smooth-scroll">
            {photos.map((photo) => {
              const isOnPage = page.photos.some((item) => item.id === photo.id);
              const assignedPageId = photoPageMap.get(photo.id);
              return (
                <div className={isOnPage ? 'assignment-photo active' : 'assignment-photo'} key={photo.id}>
                  <img src={photo.url} alt={photo.name} />
                  <div>
                    <strong>{photo.name}</strong>
                    <span>{assignedPageId ? t('pageNo', { page: pages.find((item) => item.id === assignedPageId)?.pageNumber ?? '-' }) : t('unassigned')}</span>
                  </div>
                  {isOnPage ? (
                    <button className="ghost-button" onClick={() => removePhotoFromPage(photo.id, page.id)}>{t('removeFromCurrentPage')}</button>
                  ) : (
                    <button className="secondary-button" disabled={page.photos.length >= 6} onClick={() => assignPhotoToPage(photo.id, page.id)}>{t('addToCurrentPage')}</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
