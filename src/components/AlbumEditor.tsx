import { PageThumbnailList } from './PageThumbnailList';
import { AlbumPagePreview } from './AlbumPagePreview';
import { TextAreaEditor } from './TextAreaEditor';
import { ExportPanel } from './ExportPanel';
import { useAlbumStore } from '../store/albumStore';
import { getRenderSize, getTemplateById } from '../templates/templateRegistry';
import { useTranslation } from '../i18n';

export function AlbumEditor() {
  const { pages, currentPageId, meta, size } = useAlbumStore();
  const { t } = useTranslation();
  const page = pages.find((item) => item.id === currentPageId) ?? pages[0];
  const renderSize = getRenderSize(size);

  if (!page) {
    return (
      <main className="empty-editor glass-panel">
        <div>
          <h2>{t('emptyTitle')}</h2>
          <p>{t('emptyDescription')}</p>
        </div>
      </main>
    );
  }

  const template = getTemplateById(page.templateId, renderSize.width, renderSize.height);

  return (
    <main className="editor-layout">
      <PageThumbnailList />
      <section className="preview-area smooth-scroll glass-panel">
        <div className="preview-toolbar">
          <div>
            <strong>{page.title || template.name}</strong>
            <span>{template.name}</span>
          </div>
          <span className="preview-tip">{t('previewTip')}</span>
        </div>
        <div className="preview-stage">
          <AlbumPagePreview page={page} template={template} meta={meta} pages={pages} />
        </div>
        <div className="preview-actions">
          <ExportPanel />
        </div>
      </section>
      <TextAreaEditor />
    </main>
  );
}
