import JSZip from 'jszip';
import type { AlbumMeta, AlbumPage, PageTemplate } from '../templates/templateTypes';
import { renderPageToCanvas } from './canvasRenderer';
import { safeFileName } from './image';
import { generateTocItems } from './pagination';

function dataUrlToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char] || char));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pageXhtml(imageName: string, title: string, width: number, height: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head>
  <title>${escapeXml(title)}</title>
  <meta name="viewport" content="width=${width}, height=${height}" />
  <link rel="stylesheet" type="text/css" href="styles/style.css" />
</head>
<body>
  <div class="page"><img src="images/${imageName}" alt="${escapeXml(title)}" /></div>
</body>
</html>`;
}

export async function exportAlbumToEpub(
  pages: AlbumPage[],
  meta: AlbumMeta,
  getTemplate: (page: AlbumPage) => PageTemplate,
) {
  if (!pages.length) throw new Error('没有可导出的页面');
  await document.fonts.ready;

  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`);

  const manifestItems: string[] = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="style" href="styles/style.css" media-type="text/css"/>',
  ];
  const spineItems: string[] = [];

  zip.file('OEBPS/styles/style.css', `html, body { margin: 0; padding: 0; background: #fff; }
.page { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
.page img { max-width: 100%; max-height: 100%; width: 100%; height: 100%; object-fit: contain; display: block; }`);

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    const template = getTemplate(page);
    const canvas = await renderPageToCanvas(page, template, meta, pages);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const imageName = i === 0 ? 'cover.jpg' : `page-${String(i).padStart(3, '0')}.jpg`;
    const xhtmlName = i === 0 ? 'cover.xhtml' : `page-${String(i).padStart(3, '0')}.xhtml`;
    const id = i === 0 ? 'cover' : `page-${String(i).padStart(3, '0')}`;
    const imageId = i === 0 ? 'img-cover' : `img-${String(i).padStart(3, '0')}`;
    zip.file(`OEBPS/images/${imageName}`, dataUrlToUint8Array(dataUrl));
    zip.file(`OEBPS/${xhtmlName}`, pageXhtml(imageName, page.title || `${meta.title} ${i + 1}`, template.pageWidth, template.pageHeight));
    manifestItems.push(`<item id="${imageId}" href="images/${imageName}" media-type="image/jpeg"/>`);
    manifestItems.push(`<item id="${id}" href="${xhtmlName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${id}"/>`);
  }

  const toc = generateTocItems(pages);
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head><title>目录</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>目录</h1><ol>
${toc.map((item) => `<li><a href="page-${String(item.pageNumber - 1).padStart(3, '0')}.xhtml">${escapeXml(item.title)}</a></li>`).join('\n')}
</ol></nav>
</body>
</html>`);

  zip.file('OEBPS/package.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <dc:title>${escapeXml(meta.title || '相册书')}</dc:title>
    <dc:language>zh-CN</dc:language>
    <dc:creator>${escapeXml(meta.author || 'Album Book Web')}</dc:creator>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">none</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine page-progression-direction="ltr">
    ${spineItems.join('\n    ')}
  </spine>
</package>`);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  downloadBlob(blob, `${safeFileName(meta.title || 'album-book')}.epub`);
}
