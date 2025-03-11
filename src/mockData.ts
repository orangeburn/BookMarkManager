import { Bookmark, Category } from './types';
import { atom } from 'jotai';

export const selectedCategoryIdAtom = atom<number | null>(null);

export const categoriesAtom = atom<Category[]>([
  { id: 1, name: '常用网站', icon: '🌐' },
  { id: 2, name: '学习资源', icon: '📚' },
  { id: 3, name: '工具软件', icon: '🛠️' },
  { id: 4, name: '娱乐休闲', icon: '🎮' },
  { id: 5, name: '新闻资讯', icon: '📰' },
  { id: 6, name: '社交媒体', icon: '💬' }
]);

export const mockCategories: Category[] = [
  { id: 1, name: '常用网站', icon: '🌐' },
  { id: 2, name: '学习资源', icon: '📚' },
  { id: 3, name: '工具软件', icon: '🛠️' },
  { id: 4, name: '娱乐休闲', icon: '🎮' },
  { id: 5, name: '新闻资讯', icon: '📰' },
  { id: 6, name: '社交媒体', icon: '💬' }
];

export const mockBookmarks: Omit<Bookmark, 'category' | 'dateAdded'>[] = [
  {
    id: 1,
    title: '百度',
    url: 'https://www.baidu.com',
    icon: 'https://www.baidu.com/favicon.ico',
    categoryId: 1,
    description: '全球最大的中文搜索引擎'
  },
  {
    id: 2,
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.com/favicon.ico',
    categoryId: 3,
    description: '全球最大的代码托管平台'
  },
  {
    id: 3,
    title: '掘金',
    url: 'https://juejin.cn',
    icon: 'https://juejin.cn/favicon.ico',
    categoryId: 2,
    description: '优质的开发者社区'
  },
  {
    id: 4,
    title: 'Bilibili',
    url: 'https://www.bilibili.com',
    icon: 'https://www.bilibili.com/favicon.ico',
    categoryId: 4,
    description: '国内知名的视频弹幕网站'
  },
  {
    id: 5,
    title: '知乎',
    url: 'https://www.zhihu.com',
    icon: 'https://www.zhihu.com/favicon.ico',
    categoryId: 5,
    description: '中文互联网高质量的问答社区'
  },
  {
    id: 6,
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'https://chat.openai.com/favicon.ico',
    categoryId: 3,
    description: '强大的AI对话助手'
  },
  {
    id: 7,
    title: '微博',
    url: 'https://weibo.com',
    icon: 'https://weibo.com/favicon.ico',
    categoryId: 6,
    description: '中国最大的社交媒体平台'
  },
  {
    id: 8,
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    icon: 'https://stackoverflow.com/favicon.ico',
    categoryId: 2,
    description: '全球最大的程序员问答社区'
  },
  {
    id: 9,
    title: 'YouTube',
    url: 'https://www.youtube.com',
    icon: 'https://www.youtube.com/favicon.ico',
    categoryId: 4,
    description: '全球最大的视频分享平台'
  },
  {
    id: 10,
    title: '腾讯新闻',
    url: 'https://news.qq.com',
    icon: 'https://news.qq.com/favicon.ico',
    categoryId: 5,
    description: '综合性新闻门户网站'
  }
];