import type { AlbumPage, TocItem, UserPhoto } from '../templates/templateTypes';

export function paginatePhotos(photos: UserPhoto[]) {
  const pages: UserPhoto[][] = [];
  let index = 0;
  while (index < photos.length) {
    const remaining = photos.length - index;
    let count = 1;
    if (remaining >= 6) count = 6;
    else if (remaining === 5) count = 4;
    else if (remaining === 4) count = 4;
    else if (remaining === 3) count = 2;
    else if (remaining === 2) count = 2;
    pages.push(photos.slice(index, index + count));
    index += count;
  }
  return pages;
}

export function generateTocItems(pages: AlbumPage[]): TocItem[] {
  return pages
    .filter((page) => page.type === 'content')
    .map((page) => ({
      title: page.title || `回忆 ${page.pageNumber}`,
      pageNumber: page.pageNumber,
    }));
}
