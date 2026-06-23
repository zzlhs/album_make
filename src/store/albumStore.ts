import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AlbumMeta, AlbumPage, AlbumSize, PageTemplate, PhotoFrameState, UserPhoto } from '../templates/templateTypes';
import {
  albumSizePresets,
  createTemplatePackage,
  getAvailableThemeOptions,
  getRenderSize,
  registerCdnTemplatePackages,
  type TemplateThemeOption,
} from '../templates/templateRegistry';
import { loadTemplatePackageFromCdn } from '../templates/cdnTemplateLoader';
import { generateNoteText, themeToCopywritingType } from '../utils/copywriting';
import { paginatePhotos } from '../utils/pagination';

export type AlbumState = {
  meta: AlbumMeta;
  size: AlbumSize;
  selectedThemeId: string;
  templateOptions: TemplateThemeOption[];
  cdnTemplateStatus: 'idle' | 'loading' | 'ready' | 'error';
  cdnTemplateError?: string;
  photos: UserPhoto[];
  pages: AlbumPage[];
  currentPageId?: string;
  loadCdnTemplates: (urls: string[]) => Promise<void>;
  setMeta: (meta: Partial<AlbumMeta>) => void;
  setSize: (size: Partial<AlbumSize>, presetId?: string) => void;
  setTheme: (themeId: string) => void;
  addPhotos: (photos: UserPhoto[]) => void;
  removePhoto: (photoId: string) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  generatePages: () => void;
  updatePage: (pageId: string, patch: Partial<AlbumPage>) => void;
  setCurrentPage: (pageId: string) => void;
  updateFrameState: (pageId: string, frameId: string, patch: Partial<PhotoFrameState>) => void;
  resetFrameState: (pageId: string, frameId: string) => void;
  assignPhotoToPage: (photoId: string, targetPageId: string) => void;
  removePhotoFromPage: (photoId: string, pageId: string) => void;
  addContentPage: (photoId?: string) => void;
};

const supportedPhotoCounts = [1, 2, 4, 6] as const;

type SupportedPhotoCount = typeof supportedPhotoCounts[number];

function templateCountForPhotoCount(photoCount: number): SupportedPhotoCount {
  if (photoCount <= 1) return 1;
  if (photoCount <= 2) return 2;
  if (photoCount <= 4) return 4;
  return 6;
}

function findTemplateForPage(page: AlbumPage, width: number, height: number, themeId: string): PageTemplate | undefined {
  const currentPackage = createTemplatePackage(themeId, width, height);
  const currentTemplate = [
    ...currentPackage.coverTemplates,
    ...currentPackage.tocTemplates,
    ...currentPackage.contentTemplates,
    ...currentPackage.endingTemplates,
  ].find((item) => item.id === page.templateId);
  if (currentTemplate) return currentTemplate;

  const style = page.templateId.split('-')[0] || themeId;
  const fallbackPackage = createTemplatePackage(style, width, height);
  return [
    ...fallbackPackage.coverTemplates,
    ...fallbackPackage.tocTemplates,
    ...fallbackPackage.contentTemplates,
    ...fallbackPackage.endingTemplates,
  ].find((item) => item.id === page.templateId);
}

function updateContentTemplate(page: AlbumPage, width: number, height: number, themeId: string): AlbumPage {
  if (page.type !== 'content') return page;
  const pkg = createTemplatePackage(themeId, width, height);
  const count = templateCountForPhotoCount(page.photos.length);
  const template = pkg.contentTemplates.find((item) => item.photoCount === count) ?? pkg.contentTemplates[0];
  return { ...page, templateId: template.id };
}

function createFrameStates(page: AlbumPage, width: number, height: number, themeId: string) {
  const template = findTemplateForPage(page, width, height, themeId);
  const previousStates = page.frameStates ?? {};
  const result: Record<string, PhotoFrameState> = {};

  template?.frames.forEach((frame, index) => {
    const photo = page.photos[index];
    if (!photo) return;
    const previous = previousStates[frame.id];
    result[frame.id] = {
      photoId: photo.id,
      frameId: frame.id,
      scale: previous?.photoId === photo.id ? previous.scale : 1,
      offsetX: previous?.photoId === photo.id ? previous.offsetX : 0,
      offsetY: previous?.photoId === photo.id ? previous.offsetY : 0,
      rotation: frame.rotation,
      objectPositionX: previous?.photoId === photo.id ? previous.objectPositionX : 50,
      objectPositionY: previous?.photoId === photo.id ? previous.objectPositionY : 50,
    };
  });
  return result;
}

function rebuildPage(page: AlbumPage, width: number, height: number, themeId: string): AlbumPage {
  const withTemplate = updateContentTemplate(page, width, height, themeId);
  return {
    ...withTemplate,
    frameStates: createFrameStates(withTemplate, width, height, themeId),
  };
}

function renumberPages(pages: AlbumPage[]) {
  return pages.map((page, index) => ({ ...page, pageNumber: index + 1 }));
}

function rebuildPagesForCurrentSize(pages: AlbumPage[], state: Pick<AlbumState, 'size' | 'selectedThemeId'>) {
  const { width, height } = getRenderSize(state.size);
  return renumberPages(pages).map((page) => rebuildPage(page, width, height, state.selectedThemeId));
}

function buildPages(state: Pick<AlbumState, 'meta' | 'selectedThemeId' | 'photos' | 'size'>) {
  const { width, height } = getRenderSize(state.size);
  const pkg = createTemplatePackage(state.selectedThemeId, width, height);
  const contentGroups = paginatePhotos(state.photos);
  const pages: AlbumPage[] = [];

  const cover: AlbumPage = {
    id: nanoid(),
    type: 'cover',
    templateId: pkg.coverTemplates[0].id,
    photos: state.photos[0] ? [state.photos[0]] : [],
    title: state.meta.title,
    date: state.meta.date,
    notes: state.meta.description,
    pageNumber: 1,
    frameStates: {},
  };
  pages.push(rebuildPage(cover, width, height, state.selectedThemeId));

  const toc: AlbumPage = {
    id: nanoid(),
    type: 'toc',
    templateId: pkg.tocTemplates[0].id,
    photos: [],
    title: '目录',
    pageNumber: 2,
    frameStates: {},
  };
  pages.push(toc);

  contentGroups.forEach((group, index) => {
    const count = templateCountForPhotoCount(group.length);
    const template = pkg.contentTemplates.find((item) => item.photoCount === count) ?? pkg.contentTemplates[0];
    const page: AlbumPage = {
      id: nanoid(),
      type: 'content',
      templateId: template.id,
      photos: group,
      title: `回忆 ${index + 1}`,
      date: state.meta.date,
      notes: generateNoteText(themeToCopywritingType(state.selectedThemeId)),
      pageNumber: index + 3,
      frameStates: {},
    };
    pages.push(rebuildPage(page, width, height, state.selectedThemeId));
  });

  const ending: AlbumPage = {
    id: nanoid(),
    type: 'ending',
    templateId: pkg.endingTemplates[0].id,
    photos: [],
    title: 'THE END',
    notes: '感谢这些画面，陪我们记住每一个发光的瞬间。',
    pageNumber: pages.length + 1,
    frameStates: {},
  };
  pages.push(ending);

  return renumberPages(pages);
}

const defaultPreset = albumSizePresets[1];

export const useAlbumStore = create<AlbumState>((set, get) => ({
  meta: {
    title: '我的相册书',
    subtitle: '把闪闪发光的日子装进一本书',
    author: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    theme: 'watercolor',
    sizePresetId: defaultPreset.id,
  },
  size: {
    width: defaultPreset.width,
    height: defaultPreset.height,
    unit: defaultPreset.unit,
    dpi: 150,
  },
  selectedThemeId: 'watercolor',
  templateOptions: getAvailableThemeOptions(),
  cdnTemplateStatus: 'idle',
  cdnTemplateError: undefined,
  photos: [],
  pages: [],
  currentPageId: undefined,
  loadCdnTemplates: async (urls) => {
    if (!urls.length) return;
    set({ cdnTemplateStatus: 'loading', cdnTemplateError: undefined });
    try {
      const packages = await Promise.all(urls.map((url) => loadTemplatePackageFromCdn(url)));
      registerCdnTemplatePackages(packages);
      set({
        templateOptions: getAvailableThemeOptions(),
        cdnTemplateStatus: 'ready',
        cdnTemplateError: undefined,
      });
      if (get().photos.length) get().generatePages();
    } catch (error) {
      set({
        cdnTemplateStatus: 'error',
        cdnTemplateError: error instanceof Error ? error.message : 'CDN 模板加载失败',
      });
    }
  },
  setMeta: (patch) => set((state) => ({ meta: { ...state.meta, ...patch } })),
  setSize: (patch, presetId) => {
    set((state) => ({
      size: { ...state.size, ...patch },
      meta: presetId ? { ...state.meta, sizePresetId: presetId } : state.meta,
    }));
    if (get().photos.length) get().generatePages();
  },
  setTheme: (themeId) => {
    set((state) => ({
      selectedThemeId: themeId,
      meta: { ...state.meta, theme: themeId },
    }));
    if (get().photos.length) get().generatePages();
  },
  addPhotos: (newPhotos) => {
    set((state) => ({ photos: [...state.photos, ...newPhotos] }));
    get().generatePages();
  },
  removePhoto: (photoId) => {
    const photo = get().photos.find((item) => item.id === photoId);
    if (photo) URL.revokeObjectURL(photo.url);
    set((state) => ({ photos: state.photos.filter((item) => item.id !== photoId) }));
    get().generatePages();
  },
  reorderPhotos: (fromIndex, toIndex) => {
    set((state) => {
      const photos = [...state.photos];
      const [item] = photos.splice(fromIndex, 1);
      photos.splice(toIndex, 0, item);
      return { photos };
    });
    get().generatePages();
  },
  generatePages: () => {
    const pages = buildPages(get());
    set({ pages, currentPageId: pages[0]?.id });
  },
  updatePage: (pageId, patch) => set((state) => ({
    pages: state.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)),
  })),
  setCurrentPage: (pageId) => set({ currentPageId: pageId }),
  updateFrameState: (pageId, frameId, patch) => set((state) => ({
    pages: state.pages.map((page) => {
      if (page.id !== pageId) return page;
      const current = page.frameStates[frameId];
      if (!current) return page;
      return {
        ...page,
        frameStates: {
          ...page.frameStates,
          [frameId]: { ...current, ...patch },
        },
      };
    }),
  })),
  resetFrameState: (pageId, frameId) => set((state) => ({
    pages: state.pages.map((page) => {
      if (page.id !== pageId) return page;
      const current = page.frameStates[frameId];
      if (!current) return page;
      return {
        ...page,
        frameStates: {
          ...page.frameStates,
          [frameId]: { ...current, scale: 1, offsetX: 0, offsetY: 0 },
        },
      };
    }),
  })),
  assignPhotoToPage: (photoId, targetPageId) => set((state) => {
    const photo = state.photos.find((item) => item.id === photoId);
    const target = state.pages.find((page) => page.id === targetPageId && page.type === 'content');
    if (!photo || !target) return state;
    const targetAlreadyHasPhoto = target.photos.some((item) => item.id === photoId);
    if (!targetAlreadyHasPhoto && target.photos.length >= 6) return state;

    const pages = state.pages.map((page) => {
      if (page.type !== 'content') return page;
      const withoutPhoto = page.photos.filter((item) => item.id !== photoId);
      if (page.id !== targetPageId) return { ...page, photos: withoutPhoto };
      return {
        ...page,
        photos: targetAlreadyHasPhoto ? withoutPhoto : [...withoutPhoto, photo],
      };
    });

    return {
      pages: rebuildPagesForCurrentSize(pages, state),
      currentPageId: targetPageId,
    };
  }),
  removePhotoFromPage: (photoId, pageId) => set((state) => {
    const pages = state.pages.map((page) => {
      if (page.id !== pageId || page.type !== 'content') return page;
      return { ...page, photos: page.photos.filter((photo) => photo.id !== photoId) };
    });
    return { pages: rebuildPagesForCurrentSize(pages, state) };
  }),
  addContentPage: (photoId) => set((state) => {
    const { width, height } = getRenderSize(state.size);
    const pkg = createTemplatePackage(state.selectedThemeId, width, height);
    const photo = photoId ? state.photos.find((item) => item.id === photoId) : undefined;
    const contentCount = state.pages.filter((page) => page.type === 'content').length;
    let pages = state.pages;

    if (photo) {
      pages = pages.map((page) => (
        page.type === 'content'
          ? { ...page, photos: page.photos.filter((item) => item.id !== photo.id) }
          : page
      ));
    }

    const page: AlbumPage = {
      id: nanoid(),
      type: 'content',
      templateId: pkg.contentTemplates[0].id,
      photos: photo ? [photo] : [],
      title: `回忆 ${contentCount + 1}`,
      date: state.meta.date,
      notes: generateNoteText(themeToCopywritingType(state.selectedThemeId)),
      pageNumber: 1,
      frameStates: {},
    };

    const endingIndex = pages.findIndex((item) => item.type === 'ending');
    const insertIndex = endingIndex >= 0 ? endingIndex : pages.length;
    const nextPages = [...pages.slice(0, insertIndex), page, ...pages.slice(insertIndex)];
    return {
      pages: rebuildPagesForCurrentSize(nextPages, state),
      currentPageId: page.id,
    };
  }),
}));
