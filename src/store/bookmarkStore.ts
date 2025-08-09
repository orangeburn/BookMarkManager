import { create } from 'zustand';
import { Bookmark, Category } from '../types/bookmark';

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

// 存储键常量
const STORAGE_KEYS = {
  SETTINGS: 'bookmarkSettings',
  BOOKMARK_DATA: 'bookmarkData',
  API_KEY: 'apiKey',
  API_URL: 'apiUrl',
  SELECTED_MODEL: 'selectedModel',
  SMART_CATEGORIES: 'smartCategories'
};

// 默认设置
const DEFAULT_SETTINGS = {
  apiKey: null as string | null,
  apiUrl: '',
  selectedModel: '',
  useWebCrawler: true,
  viewMode: 'card' as 'card' | 'list',
  selectedCategory: null as string | null,
  bookmarks: {} as Record<string, Bookmark>,
  categories: [] as Category[],
  smartCategories: [] as Category[],
  activeTab: 'categories' as 'categories' | 'smart'
};

interface BookmarkState {
  bookmarks: Record<string, Bookmark>;
  categories: Category[];
  smartCategories: Category[];
  activeTab: 'categories' | 'smart';
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
  setSmartCategories: (categories: Category[]) => void;
  setActiveTab: (tab: 'categories' | 'smart') => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setApiKey: (key: string) => void;
  setApiUrl: (url: string) => void;
  setSelectedModel: (modelId: string) => void;
  setUseWebCrawler: (use: boolean) => void;
  loadBookmarks: () => Promise<void>;
  generateSmartCategories: () => Promise<void>;
  cancelSmartCategoriesGeneration: () => void;
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * 从localStorage加载设置和书签数据
 */
const loadSettingsFromStorage = async (): Promise<Partial<BookmarkState>> => {
  try {
    // 克隆默认设置对象，避免修改原始对象
    let settings = { ...DEFAULT_SETTINGS };
    
    // 加载设置数据
    const loadSettings = () => {
      try {
        const storedData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!storedData) return;
        
        const parsedSettings = JSON.parse(storedData);
        // 合并设置，保留默认值
        settings = { 
          ...settings, 
          ...parsedSettings,
          // 确保这些字段即使是空字符串也能被正确加载
          apiKey: parsedSettings.apiKey !== undefined ? parsedSettings.apiKey : settings.apiKey,
          apiUrl: parsedSettings.apiUrl !== undefined ? parsedSettings.apiUrl : settings.apiUrl,
          selectedModel: parsedSettings.selectedModel !== undefined ? parsedSettings.selectedModel : settings.selectedModel,
          activeTab: parsedSettings.activeTab || 'categories'
        };
      } catch (parseError) {
        console.error('解析bookmarkSettings时出错:', parseError);
      }
    };
    
    // 加载独立存储的API设置（优先级最高）
    const loadIndividualSettings = () => {
      const individualApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const individualApiUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
      const individualModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
      
      if (individualApiKey !== null) settings.apiKey = individualApiKey;
      if (individualApiUrl !== null) settings.apiUrl = individualApiUrl;
      if (individualModel !== null) settings.selectedModel = individualModel;
    };
    
    // 加载书签数据
    const loadBookmarkData = () => {
      try {
        const storedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARK_DATA);
        if (!storedBookmarks) return;
        
        const parsedBookmarks = JSON.parse(storedBookmarks);
        if (parsedBookmarks.bookmarks) {
          settings.bookmarks = Object.entries(parsedBookmarks.bookmarks).reduce((acc, [id, bookmark]: [string, any]) => {
            acc[id] = {
              ...(bookmark as Partial<Bookmark>),
              tags: bookmark?.tags || [],
              summary: bookmark?.summary || '',
              category: bookmark?.category || null
            } as Bookmark;
            return acc;
          }, {} as Record<string, Bookmark>);
        }
        settings.categories = parsedBookmarks.categories || [];
      } catch (parseError) {
        console.error('解析书签数据时出错:', parseError);
      }
    };
    
    // 加载智能分类数据
    const loadSmartCategories = () => {
      try {
        const storedSmartCategories = localStorage.getItem(STORAGE_KEYS.SMART_CATEGORIES);
        if (!storedSmartCategories) return;
        
        settings.smartCategories = JSON.parse(storedSmartCategories) || [];
      } catch (parseError) {
        console.error('解析智能分类数据时出错:', parseError);
      }
    };
    
    // 执行加载流程
    loadSettings();
    loadIndividualSettings();
    loadBookmarkData();
    loadSmartCategories();
    
    console.log('从localStorage加载的设置:', {
      apiKey: settings.apiKey ? '已设置' : '未设置',
      apiUrl: settings.apiUrl,
      selectedModel: settings.selectedModel,
      useWebCrawler: settings.useWebCrawler,
      activeTab: settings.activeTab
    });
    
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * 保存设置和书签数据到localStorage
 */
const saveSettingsToStorage = (settings: Partial<BookmarkState>): void => {
  try {
    // 保存基本设置
    saveBasicSettings(settings);
    
    // 保存书签数据
    if (settings.bookmarks || settings.categories) {
      saveBookmarkData(settings);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * 保存基本设置到localStorage
 */
const saveBasicSettings = (settings: Partial<BookmarkState>): void => {
  try {
    // 获取现有设置，确保不会覆盖其他设置
    const existingSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    
    // 需要保存的设置字段
    const settingFields = [
      'apiKey', 'apiUrl', 'selectedModel', 'useWebCrawler', 'viewMode', 'selectedCategory', 'activeTab'
    ] as const;
    
    // 构建要保存的设置对象
    const settingsToSave = { ...existingSettings };
    
    // 只更新提供的设置
    settingFields.forEach(field => {
      if (settings[field] !== undefined) {
        settingsToSave[field] = settings[field];
      }
    });
    
    // 为了向后兼容，同时保存到单独的localStorage项中
    if (settings.apiKey !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, settings.apiKey || '');
    }
    if (settings.apiUrl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_URL, settings.apiUrl || '');
    }
    if (settings.selectedModel !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, settings.selectedModel || '');
    }
    
    // 保存智能分类
    if (settings.smartCategories !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SMART_CATEGORIES, JSON.stringify(settings.smartCategories));
    }
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsToSave));
    console.log('保存到localStorage的设置:', {
      apiKey: settingsToSave.apiKey ? '已设置' : '未设置',
      apiUrl: settingsToSave.apiUrl,
      selectedModel: settingsToSave.selectedModel,
      useWebCrawler: settingsToSave.useWebCrawler,
      activeTab: settingsToSave.activeTab
    });
  } catch (error) {
    console.error('保存基本设置时出错:', error);
    throw error; // 向上传递错误
  }
};

/**
 * 保存书签数据到localStorage
 */
const saveBookmarkData = (settings: Partial<BookmarkState>): void => {
  try {
    const existingData = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARK_DATA) || '{}');
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
            ...(bookmark as Partial<Bookmark>),
            tags: bookmark?.tags || [],
            summary: bookmark?.summary || '',
            category: bookmark?.category || undefined
          } as Bookmark;
        }
        return acc;
      }, {} as Record<string, Bookmark>) : existingBookmarks;

    const bookmarkData = {
      bookmarks: mergedBookmarks,
      categories: settings.categories || existingData.categories || []
    };
    
    // 确保将更新后的数据保存到localStorage
    localStorage.setItem(STORAGE_KEYS.BOOKMARK_DATA, JSON.stringify(bookmarkData));
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
  } catch (error) {
    console.error('保存书签数据时出错:', error);
    throw error; // 向上传递错误
  }
};

/**
 * 处理单批书签的AI分类
 */
const processBatchCategories = async (
  bookmarksData: any[],
  apiKey: string,
  apiUrl: string,
  selectedModel: string
): Promise<any[]> => {
  // 构建提交给AI的数据，使用极简化的提示词
  const prompt = `
分析书签，创建最多5个分类。书签数据：
${JSON.stringify(bookmarksData, null, 0)}

返回JSON格式：
[{"name":"分类名","bookmarkIds":["id1","id2"],"description":"描述"}]
`;

  console.log('发送AI分类请求，书签数量:', bookmarksData.length);
  
  // 处理 API URL - Groq也使用标准的/chat/completions端点
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const fullApiUrl = `${baseUrl}/chat/completions`;
    
  const requestBody = {
    model: selectedModel || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '你是书签分类助手，返回标准JSON格式，无额外文本。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  };
  
  const response = await fetch(fullApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`AI API请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  // 简化的JSON解析逻辑
  try {
    // 第一步：清理响应文本
    let jsonStr = aiResponse.replace(/```(?:json)?[\r\n]?|```/g, '').trim();
    jsonStr = jsonStr.replace(/^[\s\S]*?(\[)/m, '$1').replace(/(\])[\s\S]*?$/m, '$1');
    
    // 第二步：修复常见的JSON错误
    jsonStr = jsonStr.replace(/'/g, '"'); // 单引号转双引号
    jsonStr = jsonStr.replace(/,\s*\]/g, ']'); // 移除数组末尾逗号
    jsonStr = jsonStr.replace(/,\s*\}/g, '}'); // 移除对象末尾逗号
    
    // 第三步：处理换行符和特殊字符
    jsonStr = jsonStr.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    
    const categories = JSON.parse(jsonStr);
    return Array.isArray(categories) ? categories : [];
  } catch (parseError) {
    console.error('JSON解析失败，尝试从响应中提取有效数据:', parseError);
    
    // 备用解析：尝试提取部分有效的分类数据
    try {
      const nameMatches = aiResponse.match(/"name"\s*:\s*"([^"]+)"/g) || [];
      const bookmarkIdsMatches = aiResponse.match(/"bookmarkIds"\s*:\s*(\[[^\]]*\])/g) || [];
      
      if (nameMatches.length > 0) {
        const categories = [];
        for (let i = 0; i < Math.min(nameMatches.length, bookmarkIdsMatches.length); i++) {
          const nameMatch = nameMatches[i].match(/"([^"]+)"$/);
          const idsMatch = bookmarkIdsMatches[i].match(/(\[.*\])/);
          
          if (nameMatch && idsMatch) {
            try {
              const name = nameMatch[1];
              const bookmarkIds = JSON.parse(idsMatch[1].replace(/'/g, '"'));
              categories.push({
                name,
                bookmarkIds: Array.isArray(bookmarkIds) ? bookmarkIds : [],
                description: `自动生成的${name}分类`
              });
            } catch (e) {
              console.error('解析单个分类失败:', e);
            }
          }
        }
        
        if (categories.length > 0) {
          console.log('通过备用解析方法成功提取分类:', categories.length);
          return categories;
        }
      }
    } catch (fallbackError) {
      console.error('备用解析也失败:', fallbackError);
    }
    
    // 如果所有解析方法都失败，返回空数组
    console.log('所有解析方法都失败，返回空数组');
    return [];
  }
};

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: {},
  categories: [],
  smartCategories: [],
  activeTab: 'categories',
  selectedCategory: null,
  viewMode: 'card',
  searchQuery: '',
  isSettingsOpen: false,
  apiKey: null,
  apiUrl: '',
  selectedModel: '',
  useWebCrawler: true,
  /**
   * 设置所有书签
   */
  setBookmarks: (bookmarks) => {
    set({ bookmarks });
    saveSettingsToStorage({ bookmarks });
  },
  /**
   * 更新单个书签
   */
  updateBookmark: (bookmarkId, updatedData) => {
    set((state) => {
      if (!state.bookmarks[bookmarkId]) return state;
      
      const currentBookmark = state.bookmarks[bookmarkId];
      const updatedBookmarks = {
        ...state.bookmarks,
        [bookmarkId]: {
          ...currentBookmark,
          ...updatedData
        }
      };
      
      // 如果分类发生变化，使用Chrome API同步更改
      if (updatedData.category && updatedData.category !== currentBookmark.category && 
          typeof chrome !== 'undefined' && chrome.bookmarks) {
        // 使用Chrome书签API移动书签到新分类
        chrome.bookmarks.move(bookmarkId, {
          parentId: updatedData.category
        }).then(() => {
          console.log(`书签 ${bookmarkId} 已成功移动到分类 ${updatedData.category}`);
        }).catch(error => {
          console.error(`移动书签 ${bookmarkId} 到分类 ${updatedData.category} 失败:`, error);
        });
      }
      
      saveSettingsToStorage({ bookmarks: updatedBookmarks });
      return { bookmarks: updatedBookmarks };
    });
  },
  /**
   * 批量更新多个书签
   * @param bookmarksData 要更新的书签数据
   */
  updateMultipleBookmarks: (bookmarksData) => {
    // 获取所有需要更新的书签
    const entries = Object.entries(bookmarksData);
    if (entries.length === 0) return;
    
    console.log(`准备批量更新 ${entries.length} 个书签...`);
    
    // 使用更高效的批处理方式
    const batchSize = 5; // 每批处理的书签数量
    
    /**
     * 处理单个书签的更新
     */
    const updateSingleBookmark = async (bookmarkId: string, data: Partial<Bookmark>): Promise<boolean> => {
      try {
        return await new Promise<boolean>((resolve) => {
          set((state) => {
            // 检查书签是否存在
            if (!state.bookmarks[bookmarkId]) {
              console.log(`书签 ${bookmarkId} 不存在，跳过`);
              resolve(false);
              return state;
            }
            
            // 更新书签
            const updatedBookmarks = {
              ...state.bookmarks,
              [bookmarkId]: {
                ...state.bookmarks[bookmarkId],
                ...data
              }
            };
            
            // 创建单独的更新对象
            const singleBookmarkUpdate = {
              [bookmarkId]: updatedBookmarks[bookmarkId]
            };
            
            // 保存更新
            saveSettingsToStorage({ bookmarks: singleBookmarkUpdate });
            console.log(`书签 ${bookmarkId} 已更新并保存`);
            
            // 标记为成功
            setTimeout(() => resolve(true), 50);
            return { bookmarks: updatedBookmarks };
          });
        });
      } catch (error) {
        console.error(`更新书签 ${bookmarkId} 失败:`, error);
        return false;
      }
    };
    
    /**
     * 批量处理书签更新
     */
    const processBatch = async (startIndex: number) => {
      const batch = entries.slice(startIndex, startIndex + batchSize);
      if (batch.length === 0) {
        console.log('所有书签的更新和保存已完成');
        return;
      }
      
      console.log(`处理批次 ${Math.floor(startIndex / batchSize) + 1}/${Math.ceil(entries.length / batchSize)}...`);
      
      // 并行处理当前批次中的所有书签
      const updatePromises = batch.map(([bookmarkId, data]) => 
        updateSingleBookmark(bookmarkId, data)
      );
      
      // 等待当前批次完成
      await Promise.all(updatePromises);
      
      // 处理下一批
      await processBatch(startIndex + batchSize);
    };
    
    // 开始批量处理
    processBatch(0);
  },
  /**
   * 设置分类列表
   */
  setCategories: (categories) => {
    set({ categories });
    saveSettingsToStorage({ categories });
  },
  /**
   * 设置智能分类列表
   */
  setSmartCategories: (categories) => {
    set({ smartCategories: categories });
    saveSettingsToStorage({ smartCategories: categories });
  },
  /**
   * 设置当前活动标签页（分类/智能）
   * 确保在切换标签页时正确处理未分类项的选择状态
   */
  setActiveTab: (tab) => {
    const state = get();
    
    // 如果从智能标签页切换到分类标签页，且当前选中的是未分类项，则重置选择
    if (tab === 'categories' && state.selectedCategory === 'smart_uncategorized') {
      set({ activeTab: tab, selectedCategory: null });
      saveSettingsToStorage({ activeTab: tab, selectedCategory: null });
    } else {
      set({ activeTab: tab });
      saveSettingsToStorage({ activeTab: tab });
    }
  },
  /**
   * 设置当前选中的分类
   * 确保在切换标签页时不会保持选中未分类项
   */
  setSelectedCategory: (categoryId) => {
    // 检查是否是未分类项，并且是否需要重置选择
    const state = get();
    const isUncategorizedItem = categoryId && categoryId === 'smart_uncategorized';
    
    // 如果是未分类项，且当前不在智能标签页，则不选中它
    if (isUncategorizedItem && state.activeTab !== 'smart') {
      return;
    }
    
    set({ selectedCategory: categoryId });
    saveSettingsToStorage({ selectedCategory: categoryId });
  },
  /**
   * 设置视图模式（卡片/列表）
   */
  setViewMode: (mode) => {
    set({ viewMode: mode });
    saveSettingsToStorage({ viewMode: mode });
  },
  /**
   * 设置搜索查询
   * 注意：搜索查询不需要持久化
   */
  setSearchQuery: (query) => set({ searchQuery: query }),
  /**
   * 设置设置面板开关状态
   * 注意：设置面板状态不需要持久化
   */
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  /**
   * 设置API密钥
   */
  setApiKey: (key) => {
    set({ apiKey: key });
    saveSettingsToStorage({ apiKey: key });
  },
  /**
   * 设置API URL
   */
  setApiUrl: (url) => {
    set({ apiUrl: url });
    saveSettingsToStorage({ apiUrl: url });
  },
  /**
   * 设置选中的模型
   */
  setSelectedModel: (modelId) => {
    set({ selectedModel: modelId });
    saveSettingsToStorage({ selectedModel: modelId });
  },
  /**
   * 设置是否使用网络爬虫
   */
  setUseWebCrawler: (use) => {
    set({ useWebCrawler: use });
    saveSettingsToStorage({ useWebCrawler: use });
  },
  /**
   * 从Chrome API加载书签
   */
  loadBookmarks: async () => {
    set({ isLoading: true, error: null });
    try {
      if (typeof chrome === 'undefined' || !chrome.bookmarks) {
        throw new Error('Chrome书签API不可用');
      }
      
      // 获取书签树
      const tree = await chrome.bookmarks.getTree();
      
      // 从localStorage获取已保存的书签数据
      const storedData = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARK_DATA) || '{}');
      const storedBookmarks = storedData.bookmarks || {};
      
      const bookmarks: Record<string, Bookmark> = {};
      const categories: Category[] = [];

      /**
       * 处理书签树节点
       */
      const processNode = (node: chrome.bookmarks.BookmarkTreeNode, parentId?: string) => {
        // 处理书签节点
        if (node.url) {
          const existingBookmark = storedBookmarks[node.id];
          
          // 合并书签数据，保留用户添加的元数据
          bookmarks[node.id] = {
            id: node.id,
            title: node.title,
            url: node.url,
            dateAdded: node.dateAdded || Date.now(),
            index: node.index,
            tags: existingBookmark?.tags || [],
            summary: existingBookmark?.summary || '', 
            category: existingBookmark?.category || parentId 
          };
        } 
        // 处理文件夹/分类节点
        else if (node.children) {
          // 排除根节点，保留书签栏和其他文件夹
          if (node.id !== '0') {
            categories.push({
              id: node.id,
              name: node.title,
              bookmarkIds: node.children
                .filter(child => child.url)
                .map(child => child.id)
            });
          }
          
          // 递归处理子节点
          node.children.forEach(child => processNode(child, node.id));
        }
      };

      // 处理整个书签树
      tree.forEach(node => processNode(node));
      
      // 更新状态并保存到localStorage
      set({ bookmarks, categories });
      saveSettingsToStorage({ bookmarks, categories });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载书签失败';
      console.error('加载书签时出错:', error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * 生成智能分类
   * 完全由AI分析书签内容并生成分类，不依赖现有标签匹配逻辑
   */
  generateSmartCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { bookmarks, apiKey, apiUrl, selectedModel } = get();
      
      // 收集所有书签ID，用于后续确定未分类的书签
      const allBookmarkIds = Object.keys(bookmarks);
      
      // 使用所有书签数据，不再筛选只有标签或描述的书签
      const bookmarksWithMetadata = Object.values(bookmarks);
      
      // 收集所有书签数据，大幅优化数据量以避免413错误
      const bookmarksData = bookmarksWithMetadata.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title.length > 50 ? bookmark.title.substring(0, 50) + '...' : bookmark.title,
        url: bookmark.url.length > 100 ? bookmark.url.substring(0, 100) + '...' : bookmark.url,
        tags: (bookmark.tags || []).slice(0, 3), // 进一步限制标签数量
        summary: (bookmark.summary || '').length > 100 ? (bookmark.summary || '').substring(0, 100) + '...' : (bookmark.summary || '')
      }));

      
      // 收集无标签无描述的书签ID，这些书签将自动归入未分类项
      const uncategorizedBookmarkIds = allBookmarkIds.filter(id => {
        const bookmark = bookmarks[id];
        return (!bookmark.tags || bookmark.tags.length === 0) && (!bookmark.summary || bookmark.summary.trim() === '');
      });
      
      console.log(`总书签数: ${allBookmarkIds.length}, 提交给AI的书签数: ${bookmarksData.length}, 无标签无描述的书签: ${uncategorizedBookmarkIds.length}`);
      
      // 如果没有书签数据，则创建一个只包含未分类项的智能分类列表
      if (bookmarksData.length === 0) {
        console.log('没有书签数据，无法生成智能分类');
        // 创建一个包含未分类项的智能分类列表，将所有书签归入未分类
        const emptySmartCategories = [{
          id: 'smart_uncategorized',
          name: "未分类",
          bookmarkIds: allBookmarkIds,
          icon: "📁" // 为未分类添加文件夹图标
        }];
        set({ smartCategories: emptySmartCategories });
        saveSettingsToStorage({ smartCategories: emptySmartCategories });
        return;
      }

      // 如果有API密钥和URL，使用AI生成智能分类
      if (apiKey && apiUrl) {
        try {
          console.log('开始使用AI生成智能分类，API配置:', { apiUrl, modelName: selectedModel || 'gpt-3.5-turbo' });
          // 如果书签数量过多，分批处理以避免413错误
          const MAX_BOOKMARKS_PER_REQUEST = 15; // 进一步减少批次大小
          const allCategorizedBookmarks: string[] = [];
          const allGeneratedCategories: any[] = [];
          
          if (bookmarksData.length > MAX_BOOKMARKS_PER_REQUEST) {
            console.log(`书签数量 (${bookmarksData.length}) 超过单次请求限制，开始分批处理...`);
            console.log('初始等待3秒以避免频率限制...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // 初始延迟
            
            // 分批处理
            for (let i = 0; i < bookmarksData.length; i += MAX_BOOKMARKS_PER_REQUEST) {
              const batch = bookmarksData.slice(i, i + MAX_BOOKMARKS_PER_REQUEST);
              console.log(`处理批次 ${Math.floor(i / MAX_BOOKMARKS_PER_REQUEST) + 1}/${Math.ceil(bookmarksData.length / MAX_BOOKMARKS_PER_REQUEST)}`);
              
              try {
                const batchCategories = await processBatchCategories(batch, apiKey, apiUrl, selectedModel);
                allGeneratedCategories.push(...batchCategories);
                
                // 收集已分类的书签ID
                batchCategories.forEach(cat => {
                  if (cat.bookmarkIds) {
                    allCategorizedBookmarks.push(...cat.bookmarkIds);
                  }
                });
                
                // 添加延迟避免429错误
                if (i + MAX_BOOKMARKS_PER_REQUEST < bookmarksData.length) {
                  await new Promise(resolve => setTimeout(resolve, 8000)); // 增加到8秒延迟
                }
              } catch (batchError) {
                console.error(`批次 ${Math.floor(i / MAX_BOOKMARKS_PER_REQUEST) + 1} 处理失败:`, batchError);
                // 如果是429错误，等待更长时间
                if (batchError instanceof Error && (batchError.message.includes('429') || batchError.message.includes('Too Many Requests'))) {
                  console.log('遇到频率限制，等待15秒后继续...');
                  await new Promise(resolve => setTimeout(resolve, 15000)); // 增加到15秒
                }
              }
            }
          } else {
            // 单次请求处理
            console.log('书签数量适中，使用单次请求处理');
            const singleBatchCategories = await processBatchCategories(bookmarksData, apiKey, apiUrl, selectedModel);
            allGeneratedCategories.push(...singleBatchCategories);
            
            singleBatchCategories.forEach(cat => {
              if (cat.bookmarkIds) {
                allCategorizedBookmarks.push(...cat.bookmarkIds);
              }
            });
          }

          // 验证并转换AI返回的分类数据
          if (allGeneratedCategories.length > 0) {
            // 创建一个新的智能分类数组，不包含未分类项
            const smartCategories: Category[] = allGeneratedCategories.map((cat, index) => ({
              id: `smart_${index}_${Date.now()}`,
              name: cat.name,
              bookmarkIds: Array.isArray(cat.bookmarkIds) ? cat.bookmarkIds : [],
              icon: "🏷️",
              description: cat.description
            }));
            
            // 收集已被AI分类的书签ID
            const categorizedBookmarkIds = new Set<string>(allCategorizedBookmarks);
            
            // 找出所有未被AI分类的书签
            const aiUncategorizedBookmarks = bookmarksWithMetadata
              .filter(bookmark => !categorizedBookmarkIds.has(bookmark.id))
              .map(bookmark => bookmark.id);
            
            // 合并两类未分类书签
            const uncategorizedBookmarks = [...new Set([...uncategorizedBookmarkIds, ...aiUncategorizedBookmarks])];
            
            console.log(`AI分类完成，共生成 ${smartCategories.length} 个智能分类，有 ${uncategorizedBookmarks.length} 个书签归入未分类项`);
            
            // 创建最终的智能分类数组
            const finalSmartCategories = [...smartCategories];
            
            // 添加未分类类别
            finalSmartCategories.push({
              id: 'smart_uncategorized',
              name: "未分类",
              bookmarkIds: uncategorizedBookmarks,
              icon: "📁"
            });
            
            // 更新状态并保存到localStorage
            set({ smartCategories: finalSmartCategories });
            saveSettingsToStorage({ smartCategories: finalSmartCategories });
            return;
          } else {
            throw new Error('AI未返回有效的分类数据');
          }
        } catch (aiError) {
          console.error('AI分类失败:', aiError);
          throw new Error('AI分类失败: ' + (aiError instanceof Error ? aiError.message : String(aiError)));
        }
      } else {
        // 如果未配置API，提示用户配置
        throw new Error('请先配置AI API密钥和URL以使用智能分类功能');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成智能分类失败';
      console.error('生成智能分类时出错:', error);
      set({ error: errorMessage });
      
      // 获取所有无标签无描述的书签ID
      const allBookmarkIds = Object.keys(get().bookmarks);
      const uncategorizedBookmarkIds = allBookmarkIds.filter(id => {
        const bookmark = get().bookmarks[id];
        return (!bookmark.tags || bookmark.tags.length === 0) && (!bookmark.summary || bookmark.summary.trim() === '');
      });
      
      // 创建一个只包含未分类项的智能分类列表作为回退方案
      const fallbackCategories = [{
        id: 'smart_uncategorized',
        name: "未分类",
        bookmarkIds: uncategorizedBookmarkIds, // 只包含无标签无描述的书签
        icon: "📁" // 为未分类添加文件夹图标
      }];
      set({ smartCategories: fallbackCategories });
      saveSettingsToStorage({ smartCategories: fallbackCategories });
    } finally {
      set({ isLoading: false });
    }
  },
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  cancelSmartCategoriesGeneration: () => {
    // 取消智能分类生成，重置加载状态
    console.log('取消智能分类生成');
    set({ isLoading: false, error: null });
  },
}));

/**
 * 初始化书签存储
 * 从localStorage加载设置并初始化store
 */
function initializeBookmarkStore() {
  loadSettingsFromStorage()
    .then(settings => {
      useBookmarkStore.setState(settings);
      console.log('初始化store完成，当前设置状态:', {
        apiKey: settings.apiKey ? '已设置' : '未设置',
        apiUrl: settings.apiUrl,
        selectedModel: settings.selectedModel,
        useWebCrawler: settings.useWebCrawler
      });
    })
    .catch(error => {
      console.error('初始化store失败:', error);
      useBookmarkStore.setState(DEFAULT_SETTINGS);
    });
}

initializeBookmarkStore();