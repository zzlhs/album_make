# Album Book Web

Album Book Web is a browser-only editor for turning local photos into a printable album book. It generates a cover, table of contents, photo pages, and an ending page, then exports the result as PDF or fixed-layout EPUB.

The app has no backend requirement. Photos stay in the browser and are previewed with local object URLs, so the editing and export flow can run entirely on the user's machine.

## What It Does

- Builds album pages automatically from uploaded JPG, PNG, or WEBP photos.
- Supports A4 portrait, A5 portrait, square, 16:9 landscape, 3:4 portrait, and custom pixel sizes.
- Includes built-in visual styles such as watercolor journal, travel album, kids growth, memory book, and minimal layouts.
- Creates cover, table of contents, content pages, and ending pages with 1 / 2 / 4 / 6 photo layouts.
- Lets users manually assign photos to content pages and remove them from the current page.
- Lets users edit album metadata, page titles, dates, notes, cover title, and ending title.
- Lets users move, resize, rotate, and reset photo frames directly on the preview canvas.
- Provides local rule-based copywriting for travel, growth, memory, and family notes without calling an AI service.
- Supports light and dark themes, plus Chinese and English UI text.
- Exports each page through Canvas into PDF with jsPDF.
- Exports fixed-layout EPUB by rendering pages as full-page images and packaging them with JSZip.

## Local-First By Design

Album Book Web is designed for private photo workflows:

- Uploaded photos are not sent to a server by the app.
- Photo previews use `URL.createObjectURL(file)`.
- PDF and EPUB generation happens in the browser.
- Refreshing the page clears the current in-memory editing session unless project persistence is added later.

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Zustand
- Canvas API
- jsPDF
- JSZip
- nanoid
- clsx

The dependency set is pinned for Node.js 18 compatibility. The recommended runtime is Node.js `>=18.18.0`.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## CDN Templates

The app works without external templates by using built-in programmatic layouts. It can also load template packages from a CDN.

To enable CDN templates, copy `.env.example` to `.env` and set `VITE_TEMPLATE_CDN_URLS` to one or more `template.json` URLs:

```bash
VITE_TEMPLATE_CDN_URLS=https://ik.imagekit.io/YOUR_IMAGEKIT_ID/album-templates/watercolor/v1/template.json
```

Multiple template URLs may be separated by commas, semicolons, or new lines.

CDN-hosted assets used in Canvas export must be served with CORS enabled:

```http
Access-Control-Allow-Origin: *
```

Template package details are documented in:

```text
docs/CDN_TEMPLATE_GUIDE.md
```

## Project Layout

```text
src/
├── App.tsx
├── main.tsx
├── i18n.ts
├── components/
│   ├── SizeSelector.tsx
│   ├── TemplateSelector.tsx
│   ├── PhotoUploader.tsx
│   ├── PhotoList.tsx
│   ├── AlbumEditor.tsx
│   ├── PageThumbnailList.tsx
│   ├── AlbumPagePreview.tsx
│   ├── PhotoFrame.tsx
│   ├── TextAreaEditor.tsx
│   ├── ExportPanel.tsx
│   └── Toolbar.tsx
├── store/
│   ├── albumStore.ts
│   └── uiStore.ts
├── templates/
│   ├── templateTypes.ts
│   ├── templateRegistry.ts
│   └── cdnTemplateLoader.ts
├── utils/
│   ├── image.ts
│   ├── pagination.ts
│   ├── canvasRenderer.ts
│   ├── pdfExporter.ts
│   ├── epubExporter.ts
│   ├── frameState.ts
│   └── copywriting.ts
└── styles/
    └── globals.css

public/templates/watercolor/
└── template.example.json
```

## Notes For Contributors

- The template JSON defines default frame positions, sizes, rotations, and text areas.
- User edits to frames are stored as page-level runtime state and override the template defaults in preview, thumbnails, PDF export, and EPUB export.
- Background images, overlays, fonts, and template assets loaded from a CDN need correct CORS headers, otherwise Canvas export can fail.
- Regenerating the layout currently rebuilds pages from the photo list and may replace manual page or frame adjustments.
- Fixed-layout EPUB output is reader-dependent. PDF is the primary export target.

## License

This project is licensed under the GNU Affero General Public License v3.0 or later.

SPDX-License-Identifier: `AGPL-3.0-or-later`

See [LICENSE](LICENSE) for the full license text.
