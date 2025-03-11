import { create } from 'zustand';
import { Bookmark, Category } from '../types/bookmark';


interface BookmarkState {
  bookmarks: Record<string, Bookmark>;
  categories: Category[];
  selectedCategory: string | null;
  viewMode: 'card' | 'list';
  searchQuery: string;
  isSettingsOpen: boolean;
  apiKey: string | null;
  setBookmarks: (bookmarks: Record<string, Bookmark>) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setApiKey: (key: string) => void;
  loadBookmarks: () => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: {},
  categories: [],
  selectedCategory: null,
  viewMode: 'card',
  searchQuery: '',
  isSettingsOpen: false,
  apiKey: null,
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setApiKey: (key) => set({ apiKey: key }),
  loadBookmarks: async () => {
    try {
      const processNode = (node: chrome.bookmarks.BookmarkTreeNode): Bookmark | null => {
        if (node.url) {
          return {
            id: node.id,
            title: node.title,
            url: node.url,
            dateAdded: node.dateAdded || Date.now(),
            category: node.parentId,
            icon: `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(node.url)}`
          };
        }
        return null;
      };

      const processCategory = (node: chrome.bookmarks.BookmarkTreeNode): Category => {
        return {
          id: node.id,
          name: node.title,
          bookmarkIds: node.children?.filter(child => child.url).map(child => child.id) || []
        };
      };

      let bookmarksMap: Record<string, Bookmark>;
      let categories: Category[];

      // 检查是否在浏览器环境中
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        const tree = await chrome.bookmarks.getTree();
        bookmarksMap = {};
        categories = [];

      const processTree = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
        nodes.forEach(node => {
          if (node.children) {
            if (node.id !== '0') { // Skip root node
              categories.push(processCategory(node));
            }
            processTree(node.children);
          } else if (node.url) {
            const bookmark = processNode(node);
            if (bookmark) {
              bookmarksMap[bookmark.id] = bookmark;
            }
          }
        });
      };

        processTree(tree);
        
        // 确保所有书签的category属性正确设置
        console.log('加载的书签数据:', bookmarksMap);
        console.log('加载的分类数据:', categories);
      } else {
        // 在非浏览器环境中加载mock数据
        console.log('非浏览器环境，加载mock数据');
        const { mockBookmarks, mockCategories } = await import('../mockData');
        bookmarksMap = mockBookmarks.reduce<Record<string, Bookmark>>((acc, bookmark) => {
          acc[bookmark.id.toString()] = {
            id: bookmark.id.toString(),
            title: bookmark.title,
            url: bookmark.url,
            icon: bookmark.icon,
            dateAdded: Date.now(),
            category: bookmark.categoryId.toString()
          };
          return acc;
        }, {});
        categories = mockCategories.map(category => ({
          id: category.id.toString(),
          name: category.name,
          bookmarkIds: mockBookmarks
            .filter(b => b.categoryId === category.id)
            .map(b => b.id.toString())
        }));
      }
      
      // 设置状态并确保selectedCategory有效
      set({ bookmarks: bookmarksMap, categories });
      
      // 如果有分类但没有选中分类，则默认选择第一个分类
      const state = useBookmarkStore.getState();
      if (categories.length > 0 && !state.selectedCategory) {
        set({ selectedCategory: categories[0].id });
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }
}));

// 添加一个调试函数，用于在控制台输出当前状态
const debugStore = () => {
  const state = useBookmarkStore.getState();
  console.log('当前Store状态:', {
    bookmarksCount: Object.keys(state.bookmarks).length,
    categoriesCount: state.categories.length,
    selectedCategory: state.selectedCategory,
    viewMode: state.viewMode
  });
};

// 初始化时执行一次调试
debugStore();

// 监听状态变化
useBookmarkStore.subscribe(debugStore);