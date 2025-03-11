import { Bookmark, Category } from '../types/bookmark';

export const mockBookmarks: Record<string, Bookmark> = {
  'b1': {
    id: 'b1',
    title: '掘金 - 开发者社区',
    url: 'https://juejin.cn',
    summary: '掘金是一个帮助开发者成长的社区，是给开发者用的 Hacker News，给设计师用的 Designer News，和给产品经理用的 Medium。',
    tags: ['技术', '社区', '开发'],
    category: 'c1',
    icon: 'https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/static/favicons/favicon-32x32.png',
    dateAdded: 1672502400000
  },
  'b2': {
    id: 'b2',
    title: 'GitHub: Let\'s build from here',
    url: 'https://github.com',
    summary: '世界上最大的软件开发平台，数百万开发者在这里工作。',
    tags: ['代码托管', '开源', '开发'],
    category: 'c1',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
    dateAdded: 1672588800000
  },
  'b3': {
    id: 'b3',
    title: '哔哩哔哩 (゜-゜)つロ 干杯~',
    url: 'https://www.bilibili.com',
    summary: '国内知名的视频弹幕网站，这里有最及时的动漫新番，最棒的ACG氛围。',
    tags: ['视频', '娱乐', '动漫'],
    category: 'c2',
    icon: 'https://www.bilibili.com/favicon.ico',
    dateAdded: 1672675200000
  },
  'b4': {
    id: 'b4',
    title: '知乎 - 有问题，就会有答案',
    url: 'https://www.zhihu.com',
    summary: '中文互联网高质量的问答社区和创作者聚集的原创内容平台。',
    tags: ['问答', '社区', '知识'],
    category: 'c2',
    icon: 'https://static.zhihu.com/heifetz/favicon.ico',
    dateAdded: 1672761600000
  },
  'b5': {
    id: 'b5',
    title: 'React – A JavaScript library for building user interfaces',
    url: 'https://react.dev',
    summary: 'React是用于构建用户界面的JavaScript库，由Facebook开发。',
    tags: ['前端', '框架', '开发'],
    category: 'c3',
    icon: 'https://react.dev/favicon.ico',
    dateAdded: 1672848000000
  }
};

export const mockCategories: Category[] = [
  {
    id: 'c1',
    name: '开发工具',
    bookmarkIds: ['b1', 'b2']
  },
  {
    id: 'c2',
    name: '休闲娱乐',
    bookmarkIds: ['b3', 'b4']
  },
  {
    id: 'c3',
    name: '学习资源',
    bookmarkIds: ['b5']
  }
];