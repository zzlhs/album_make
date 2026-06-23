import jsPDF from 'jspdf';
import type { AlbumMeta, AlbumPage, PageTemplate } from '../templates/templateTypes';
import { renderPageToCanvas } from './canvasRenderer';
import { safeFileName } from './image';

export async function exportAlbumToPdf(
  pages: AlbumPage[],
  meta: AlbumMeta,
  getTemplate: (page: AlbumPage) => PageTemplate,
) {
  if (!pages.length) throw new Error('没有可导出的页面');
  await document.fonts.ready;
  const first = getTemplate(pages[0]);
  const orientation = first.pageWidth > first.pageHeight ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [first.pageWidth, first.pageHeight],
    compress: true,
  });

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    const template = getTemplate(page);
    const canvas = await renderPageToCanvas(page, template, meta, pages);
    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) {
      pdf.addPage([template.pageWidth, template.pageHeight], template.pageWidth > template.pageHeight ? 'landscape' : 'portrait');
    }
    pdf.addImage(imageData, 'JPEG', 0, 0, template.pageWidth, template.pageHeight);
  }

  pdf.save(`${safeFileName(meta.title || 'album-book')}.pdf`);
}
