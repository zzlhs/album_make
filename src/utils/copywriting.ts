export const copywritingTemplates = {
  travel: [
    '把沿途的风景，装进这一页回忆里。',
    '走过的路，看过的云，都成为了今天的故事。',
    '这一站，是属于我们的美好片段。',
  ],
  growth: [
    '慢慢长大的每一天，都值得被认真收藏。',
    '小小的瞬间，也会变成很久以后的珍贵回忆。',
    '愿这些画面，记录你一路成长的光。',
  ],
  memory: [
    '有些时刻不会重来，但可以被温柔保存。',
    '把重要的人和重要的日子，留在这一页里。',
    '时间会往前走，回忆会一直闪闪发光。',
  ],
  family: [
    '平凡的日子，因为在一起而闪闪发光。',
    '把家的温度，留在这一页里。',
    '这些笑脸，是最值得收藏的风景。',
  ],
  friends: [
    '一起笑过的瞬间，会在很久以后继续发亮。',
    '把属于我们的故事，认真放进相册里。',
    '因为有你们，普通日子也有了纪念意义。',
  ],
  couple: [
    '把相爱的片段，装订成温柔的一本书。',
    '这一页，是关于我们的小小宇宙。',
    '时间向前走，我们一起把回忆留下。',
  ],
  pet: [
    '小小爪印，也会变成心里很大的温柔。',
    '把陪伴的日常，收藏成不会褪色的画面。',
    '你出现以后，生活多了好多可爱的瞬间。',
  ],
};

export type CopywritingType = keyof typeof copywritingTemplates;

export function generateNoteText(type: CopywritingType = 'memory') {
  const list = copywritingTemplates[type];
  return list[Math.floor(Math.random() * list.length)];
}

export function themeToCopywritingType(theme: string): CopywritingType {
  if (theme === 'travel') return 'travel';
  if (theme === 'kids') return 'growth';
  if (theme === 'watercolor') return 'family';
  return 'memory';
}
