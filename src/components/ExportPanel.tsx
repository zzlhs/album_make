import { useState } from 'react';
import { useAlbumStore } from '../store/albumStore';
import { getRenderSize, getTemplateById } from '../templates/templateRegistry';
import { exportAlbumToPdf } from '../utils/pdfExporter';
import { exportAlbumToEpub } from '../utils/epubExporter';
import { useTranslation } from '../i18n';

export function ExportPanel() {
  const { pages, meta, size } = useAlbumStore();
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const renderSize = getRenderSize(size);
  const getTemplate = (page: typeof pages[number]) => getTemplateById(page.templateId, renderSize.width, renderSize.height);

  async function runExport(kind: 'pdf' | 'epub') {
    try {
      setStatus(kind === 'pdf' ? t('exportingPdf') : t('exportingEpub'));
      if (kind === 'pdf') await exportAlbumToPdf(pages, meta, getTemplate);
      else await exportAlbumToEpub(pages, meta, getTemplate);
      setStatus(t('exportDone'));
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : t('exportFail'));
    }
  }

  return (
    <section className="export-bar">
      <div>
        <strong>{t('export')}</strong>
        <span>{t('renderInfo', { pages: pages.length || 0, width: renderSize.width, height: renderSize.height, dpi: size.dpi })}</span>
      </div>
      <button className="primary-button" disabled={!pages.length || status.includes(t('exportingPdf')) || status.includes(t('exportingEpub'))} onClick={() => runExport('pdf')}>{t('exportPdf')}</button>
      <button className="secondary-button" disabled={!pages.length || status.includes(t('exportingPdf')) || status.includes(t('exportingEpub'))} onClick={() => runExport('epub')}>{t('exportEpub')}</button>
      {status && <em>{status}</em>}
    </section>
  );
}
