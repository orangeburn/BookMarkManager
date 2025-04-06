import { create } from 'zustand';
import { Bookmark, Category } from '../types/bookmark';

declare global {
  interface Window {
    chrome?: typeof chrome;
  }
}

interface BookmarkState {
  bookmarks: Record<string, Bookmark>;
  categories: Category[];
  selectedCategory: string | null;
  viewMode: 'card' | 'list';
  searchQuery: string;
  isSettingsOpen: boolean;
  apiKey: string | null;
  apiUrl: string;
  selectedModel: string;
  useWebCrawler: boolean;
  setBookmarks: (bookmarks: Record<string, Bookmark>) => void;
  updateBookmark: (bookmarkId: string, updatedData: Partial<Bookmark>) => void;
  updateMultipleBookmarks: (bookmarksData: Record<string, Partial<Bookmark>>) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setApiKey: (key: string) => void;
  setApiUrl: (url: string) => void;
  setSelectedModel: (modelId: string) => void;
  setUseWebCrawler: (use: boolean) => void;
  loadBookmarks: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const loadSettingsFromStorage = async (): Promise<Partial<BookmarkState>> => {
  try {
    const storedData = localStorage.getItem('bookmarkSettings');
    const storedBookmarks = localStorage.getItem('bookmarkData');
    
    // 默认设置
    let settings = {
      apiKey: null,
      apiUrl: '',
      selectedModel: '',
      useWebCrawler: true,
      viewMode: 'card',
      selectedCategory: null,
      bookmarks: {},
      categories: []
    };
    
    // 尝试从独立存储项中加载API设置（优先级最高）
    const individualApiKey = localStorage.getItem('apiKey');
    const individualApiUrl = localStorage.getItem('apiUrl');
    const individualModel = localStorage.getItem('selectedModel');
    
    // 从bookmarkSettings中加载设置
    if (storedData) {
      try {
        const parsedSettings = JSON.parse(storedData);
        // 合并设置，保留默认值
        settings = { 
          ...settings, 
          ...parsedSettings,
          // 确保这些字段即使是空字符串也能被正确加载
          apiKey: parsedSettings.apiKey !== undefined ? parsedSettings.apiKey : settings.apiKey,
          apiUrl: parsedSettings.apiUrl !== undefined ? parsedSettings.apiUrl : settings.apiUrl,
          selectedModel: parsedSettings.selectedModel !== undefined ? parsedSettings.selectedModel : settings.selectedModel
        };
      } catch (parseError) {
        console.error('解析bookmarkSettings时出错:', parseError);
      }
    }
    
    // 如果有独立存储的API设置，优先使用它们覆盖从bookmarkSettings加载的设置
    if (individualApiKey !== null) {
      settings.apiKey = individualApiKey;
    }
    
    if (individualApiUrl !== null) {
      settings.apiUrl = individualApiUrl;
    }
    
    if (individualModel !== null) {
      settings.selectedModel = individualModel;
    }
    
    console.log('从localStorage加载的设置:', {
      apiKey: settings.apiKey ? '已设置' : '未设置',
      apiUrl: settings.apiUrl,
      selectedModel: settings.selectedModel,
      useWebCrawler: settings.useWebCrawler
    });
    
    if (storedBookmarks) {
      const parsedBookmarks = JSON.parse(storedBookmarks);
      if (parsedBookmarks.bookmarks) {
        settings.bookmarks = Object.entries(parsedBookmarks.bookmarks).reduce((acc, [id, bookmark]) => {
          acc[id] = {
            ...bookmark,
            tags: bookmark.tags || [],
            summary: bookmark.summary || '',
            category: bookmark.category || null
          };
          return acc;
        }, {} as Record<string, Bookmark>);
      }
      settings.categories = parsedBookmarks.categories || [];
    }
    
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      apiKey: null,
      apiUrl: '',
      selectedModel: '',
      useWebCrawler: true,
      viewMode: 'card',
      bookmarks: {},
      categories: []
    };
  }
};

const saveSettingsToStorage = (settings: Partial<BookmarkState>): void => {
  try {
    // 获取现有设置，确保不会覆盖其他设置
    const existingSettings = JSON.parse(localStorage.getItem('bookmarkSettings') || '{}');
    
    // 保存基本设置，不包含书签相关数据
    const settingsToSave = {
      ...existingSettings, // 保留现有设置
      // 只更新提供的设置，确保空字符串也能被保存
      ...(settings.apiKey !== undefined ? { apiKey: settings.apiKey } : {}),
      ...(settings.apiUrl !== undefined ? { apiUrl: settings.apiUrl } : {}),
      ...(settings.selectedModel !== undefined ? { selectedModel: settings.selectedModel } : {}),
      ...(settings.useWebCrawler !== undefined ? { useWebCrawler: settings.useWebCrawler } : {}),
      ...(settings.viewMode !== undefined ? { viewMode: settings.viewMode } : {}),
      ...(settings.selectedCategory !== undefined ? { selectedCategory: settings.selectedCategory } : {})
    };
    
    // 为了向后兼容，同时保存到单独的localStorage项中
    if (settings.apiKey !== undefined) {
      localStorage.setItem('apiKey', settings.apiKey);
    }
    if (settings.apiUrl !== undefined) {
      localStorage.setItem('apiUrl', settings.apiUrl);
    }
    if (settings.selectedModel !== undefined) {
      localStorage.setItem('selectedModel', settings.selectedModel);
    }
    
    localStorage.setItem('bookmarkSettings', JSON.stringify(settingsToSave));
    console.log('保存到localStorage的设置:', {
      apiKey: settingsToSave.apiKey ? '已设置' : '未设置',
      apiUrl: settingsToSave.apiUrl,
      selectedModel: settingsToSave.selectedModel,
      useWebCrawler: settingsToSave.useWebCrawler
    });
    
    // 单独保存书签数据，确保数据持久化
    if (settings.bookmarks || settings.categories) {
      const existingData = JSON.parse(localStorage.getItem('bookmarkData') || '{}');
      const existingBookmarks = existingData.bookmarks || {};
      
      // 合并书签数据，确保标签直接绑定到书签对象上
      const mergedBookmarks = settings.bookmarks ? 
        Object.entries(settings.bookmarks).reduce((acc, [id, bookmark]) => {
          const existingBookmark = existingBookmarks[id];
          
          // 如果是部分更新（如只更新tags和summary），需要确保保留现有书签的其他属性
          if (existingBookmark) {
            acc[id] = {
              ...existingBookmark, // 先保留所有现有属性
              ...bookmark, // 然后应用新的更新
              // 确保标签和描述正确保存，即使是部分更新
              tags: bookmark.tags !== undefined ? bookmark.tags : existingBookmark.tags || [],
              summary: bookmark.summary !== undefined ? bookmark.summary : existingBookmark.summary || ''
            };
          } else {
            // 如果是新书签，直接使用提供的数据
            acc[id] = {
              ...bookmark,
              tags: bookmark.tags || [],
              summary: bookmark.summary || '',
              category: bookmark.category || null
            };
          }
          return acc;
        }, {} as Record<string, Bookmark>) : existingBookmarks;

      const bookmarkData = {
        bookmarks: mergedBookmarks,
        categories: settings.categories || existingData.categories || []
      };
      // 确保将更新后的数据保存到localStorage
      localStorage.setItem('bookmarkData', JSON.stringify(bookmarkData));
      console.log('书签数据已保存到localStorage:', {
        bookmarksCount: Object.keys(mergedBookmarks).length,
        categoriesCount: (settings.categories || existingData.categories || []).length,
        // 输出一些示例书签数据，帮助调试
        sampleBookmark: Object.keys(mergedBookmarks).length > 0 ? 
          { 
            id: Object.keys(mergedBookmarks)[0],
            hasTags: !!mergedBookmarks[Object.keys(mergedBookmarks)[0]].tags?.length,
            hasSummary: !!mergedBookmarks[Object.keys(mergedBookmarks)[0]].summary
          } : 'No bookmarks'
      });
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: {},
  categories: [],
  selectedCategory: null,
  viewMode: 'card',
  searchQuery: '',
  isSettingsOpen: false,
  apiKey: null,
  apiUrl: '',
  selectedModel: '',
  useWebCrawler: true,
  setBookmarks: (bookmarks) => {
    set({ bookmarks });
    saveSettingsToStorage({ bookmarks });
  },
  updateBookmark: (bookmarkId, updatedData) => {
    set((state) => {
      if (!state.bookmarks[bookmarkId]) return state;
      
      const updatedBookmarks = {
        ...state.bookmarks,
        [bookmarkId]: {
          ...state.bookmarks[bookmarkId],
          ...updatedData
        }
      };
      
      saveSettingsToStorage({ bookmarks: updatedBookmarks });
      return { bookmarks: updatedBookmarks };
    });
  },
  updateMultipleBookmarks: (bookmarksData) => {
    // 使用异步函数和Promise链来确保逐个更新和保存书签
    const updateBookmarkAsync = async (entries: [string, Partial<Bookmark>][], index = 0) => {
      if (index >= entries.length) {
        console.log('所有书签的更新和保存已完成');
        return; // 所有书签都已更新完成
      }
      
      const [bookmarkId, data] = entries[index];
      console.log(`开始处理书签 ${bookmarkId} (${index + 1}/${entries.length})`);
      
      try {
        // 使用Promise来等待当前书签更新完成
        await new Promise<void>((resolve, reject) => {
          try {
            set((state) => {
              if (!state.bookmarks[bookmarkId]) {
                console.log(`书签 ${bookmarkId} 不存在，跳过`);
                resolve(); // 如果书签不存在，直接解析Promise
                return state;
              }
              
              // 只更新当前处理的这一个书签
              const updatedBookmarks = {
                ...state.bookmarks,
                [bookmarkId]: {
                  ...state.bookmarks[bookmarkId],
                  ...data
                }
              };
              
              // 创建一个单独的对象，只包含当前书签
              const singleBookmarkUpdate = {
                [bookmarkId]: updatedBookmarks[bookmarkId]
              };
              
              // 立即保存这个单独的书签更新
              console.log(`保存书签 ${bookmarkId} 的更新...`);
              saveSettingsToStorage({ bookmarks: singleBookmarkUpdate });
              console.log(`书签 ${bookmarkId} 已单独保存完成`);
              
              // 更新完成后解析Promise，增加延迟确保保存操作完成
              setTimeout(resolve, 200);
              return { bookmarks: updatedBookmarks };
            });
          } catch (error) {
            console.error(`处理书签 ${bookmarkId} 时出错:`, error);
            reject(error);
          }
        });
        
        // 在处理下一个书签之前添加额外延迟，确保当前书签的保存完全完成
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`书签 ${bookmarkId} 处理完成，准备处理下一个`);
      } catch (error) {
        console.error(`更新书签 ${bookmarkId} 失败:`, error);
      }
      
      // 处理下一个书签
      await updateBookmarkAsync(entries, index + 1);
    };
    
    // 开始逐个更新书签
    const entries = Object.entries(bookmarksData);
    console.log(`准备逐个更新 ${entries.length} 个书签...`);
    if (entries.length > 0) {
      updateBookmarkAsync(entries);
    }
  },
  setCategories: (categories) => {
    set({ categories });
    saveSettingsToStorage({ categories });
  },
  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId });
    saveSettingsToStorage({ selectedCategory: categoryId });
  },
  setViewMode: (mode) => {
    set({ viewMode: mode });
    saveSettingsToStorage({ viewMode: mode });
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setApiKey: (key) => {
    set((state) => ({ ...state, apiKey: key }));
    saveSettingsToStorage({ apiKey: key });
  },
  setApiUrl: (url) => {
    set((state) => ({ ...state, apiUrl: url }));
    saveSettingsToStorage({ apiUrl: url });
  },
  setSelectedModel: (modelId) => {
    set((state) => ({ ...state, selectedModel: modelId }));
    saveSettingsToStorage({ selectedModel: modelId });
  },
  setUseWebCrawler: (use) => {
    set((state) => ({ ...state, useWebCrawler: use }));
    saveSettingsToStorage({ useWebCrawler: use });
  },
  loadBookmarks: async () => {
    set({ isLoading: true, error: null });
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        const tree = await chrome.bookmarks.getTree();
        const bookmarks: Record<string, Bookmark> = {};
        const categories: Category[] = [];

        const processNode = (node: chrome.bookmarks.BookmarkTreeNode, parentId?: string) => {
          if (node.url) {
            // 处理书签
            // 从localStorage中获取已保存的书签数据
            const storedBookmarks = JSON.parse(localStorage.getItem('bookmarkData') || '{}');
            const existingBookmark = (storedBookmarks.bookmarks || {})[node.id];
            // 合并书签数据，确保标签直接绑定到书签对象上
            const bookmark: Bookmark = {
              id: node.id,
              title: node.title,
              url: node.url,
              dateAdded: node.dateAdded || Date.now(),
              index: node.index,
              // 确保标签直接从书签对象获取，不再依赖外部存储
              tags: existingBookmark?.tags || [], // 直接绑定标签到书签对象
              summary: existingBookmark?.summary || '', 
              category: existingBookmark?.category || parentId 
            };
            bookmarks[node.id] = bookmark;
          } else if (node.children) {
            // 处理文件夹/分类
            if (node.id !== '0') { // 只排除根节点，保留书签栏（id为'1'）
              const category: Category = {
                id: node.id,
                name: node.title,
                bookmarkIds: node.children
                  .filter(child => child.url)
                  .map(child => child.id)
              };
              categories.push(category);
            }
            // 递归处理子节点，传递当前节点ID作为父节点ID
            node.children.forEach(child => processNode(child, node.id));
          }
        };

        tree.forEach(node => processNode(node));
        set({ bookmarks, categories });
        // 保存书签数据到localStorage
        saveSettingsToStorage({ bookmarks, categories });
      } else {
        throw new Error('Chrome书签API不可用');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载书签失败';
      console.error('Error loading bookmarks:', error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

(async () => {
  try {
    const settings = await loadSettingsFromStorage();
    useBookmarkStore.setState(settings);
    console.log('初始化store完成，当前设置状态:', {
      apiKey: settings.apiKey ? '已设置' : '未设置',
      apiUrl: settings.apiUrl,
      selectedModel: settings.selectedModel,
      useWebCrawler: settings.useWebCrawler
    });
  } catch (error) {
    console.error('初始化store失败:', error);
  }
})();
