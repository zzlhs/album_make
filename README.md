# 相册书导出 Web 应用 MVP

基于《相册书导出 Web 应用第一版开发文档》实现的纯前端 MVP。项目不包含后端，不上传用户照片，照片使用 `URL.createObjectURL(file)` 在浏览器本地预览、排版和导出。

## 已实现能力

- 相册尺寸选择：A4 竖版、A5 竖版、方形、16:9 横版、3:4 竖版、自定义 px。
- 模板风格选择：水彩手账风、旅行相册风、亲子成长风、纪念册风、极简留白风。
- 多图上传：支持 JPG / PNG / WEBP，支持拖拽上传、缩略图预览、删除和顺序调整。
- 自动分页：按 1 / 2 / 4 / 6 图容量自动分页，包含封面、目录、正文页、结束页。
- 手动分配照片：可在照片列表中把任意照片分配到指定正文页，也可在当前页设置里快速加入/移除照片，每页最多 6 张。
- 自动匹配模板：每页按照片数量选择 1 / 2 / 4 / 6 图模板，3 张会使用 4 图模板，5 张会使用 6 图模板并保留空框。
- 页面编辑：整本标题、副标题、作者、日期、描述；单页标题、日期、备注。
- 本地文案：旅行、成长、纪念、家庭等本地规则文案，不接 AI，不暴露 API Key。
- 照片手动调整：在预览页拖动照片调整位置；按住 Ctrl/⌘ 或 Alt 并滚轮缩放，也可使用照片上的 +/-/重置控件。
- 操作体验优化：自定义滚动条、滚动区域阻尼优化、避免普通滚动误触照片缩放。
- Dark / Light 模式：工具栏按钮切换，带从按钮位置扩散到全屏的动态效果。
- 中英切换：工具栏支持中文 / English UI 切换。
- PDF 导出：逐页 Canvas 渲染后用 jsPDF 生成 PDF。
- 固定版式 EPUB 导出：逐页渲染成整页 JPEG，JSZip 打包为 EPUB3 固定版式。

## 技术栈

- React 18 + Vite 5 + TypeScript
- Zustand
- jsPDF
- JSZip
- Canvas API
- nanoid / clsx

当前依赖锁定为 Node 18 兼容版本，避免 Vite latest 版本要求 Node 20+ 的问题。

## 启动方式

```bash
npm install
npm run dev
```

如需启用 ImageKit / CDN 模板，复制 `.env.example` 为 `.env`，把 `VITE_TEMPLATE_CDN_URLS` 改成一个或多个 `template.json` 地址：

```bash
VITE_TEMPLATE_CDN_URLS=https://ik.imagekit.io/YOUR_IMAGEKIT_ID/album-templates/watercolor/v1/template.json
```

多个模板包可用英文逗号、分号或换行分隔。未配置时应用继续使用内置程序化模板。

生产构建：

```bash
npm run build
npm run preview
```

## 项目结构

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
│   └── templateRegistry.ts
├── utils/
│   ├── image.ts
│   ├── pagination.ts
│   ├── canvasRenderer.ts
│   ├── pdfExporter.ts
│   ├── epubExporter.ts
│   └── copywriting.ts
└── styles/
    └── globals.css

docs/
└── CDN_TEMPLATE_GUIDE.md

public/templates/watercolor/
└── template.example.json
```

## CDN 模板文档

CDN 图库、背景图、overlay、模板 JSON 字段说明见：

```text
docs/CDN_TEMPLATE_GUIDE.md
```

其中包含：

- 推荐 CDN 目录结构。
- CDN CORS 配置。
- background / photos / overlay / texts 渲染层级。
- `template.json` 顶层字段。
- `frames` 照片框字段。
- `textAreas` 文本区域字段。
- 完整示例 JSON。
- 前端加载 CDN 模板的建议代码。

## 关键说明

1. 第一版模板为内置程序化模板，无需 CDN，因此不存在 Canvas 跨域污染问题。后续接入 CDN 模板时，CDN 必须配置 `Access-Control-Allow-Origin: *`，前端加载图片需设置 `img.crossOrigin = "anonymous"`。
2. A4 / A5 等毫米尺寸导出时按 DPI 转换为像素。默认 150DPI，避免多页高清图导出时占用过多浏览器内存。
3. EPUB 为固定版式 EPUB，兼容性依赖阅读器。第一版主推 PDF，EPUB 作为附加导出能力。
4. 项目默认不做本地自动保存，刷新页面后当前上传照片和编辑状态会丢失。
5. 点击“重新生成排版”会重新按照片顺序自动分页，手动分配结果会被自动排版覆盖。

## 后续可扩展方向

- IndexedDB 本地项目保存。
- 将模板改为 `/public/templates` 或 CDN JSON + PNG/SVG 资源。
- 增加页面排序和章节管理。
- 增加移动端深度适配。
- 通过后端代理接入 AI 文案、封面或背景生成，避免前端暴露 API Key。
