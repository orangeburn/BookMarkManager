import '@testing-library/jest-dom';

// 定义Chrome书签API的类型
type ChromeBookmark = {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: ChromeBookmark[];
};

// 设置全局 Chrome API mock
const chrome = {
  bookmarks: {
    getTree: vi.fn().mockResolvedValue([]) as jest.Mock<Promise<ChromeBookmark[]>>,
    create: vi.fn().mockResolvedValue({}) as jest.Mock<Promise<ChromeBookmark>>,
    remove: vi.fn().mockResolvedValue(undefined),
    move: vi.fn().mockResolvedValue({}) as jest.Mock<Promise<ChromeBookmark>>,
    update: vi.fn().mockResolvedValue({}) as jest.Mock<Promise<ChromeBookmark>>
  },
  runtime: {
    id: 'test-extension-id'
  }
};

global.chrome = chrome as unknown as typeof chrome;