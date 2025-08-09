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
      
      // 收集所有书签数据，用于提交给AI进行分析
      const bookmarksData = bookmarksWithMetadata.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        tags: bookmark.tags || [],
        summary: bookmark.summary || ''
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

      // 这里已经有了allBookmarkIds变量，不需要重复声明
      
      // 如果有API密钥和URL，使用AI生成智能分类
      if (apiKey && apiUrl) {
        try {
          console.log('开始使用AI生成智能分类，API配置:', { apiUrl, modelName: selectedModel || 'gpt-3.5-turbo' });
          
          // 构建提交给AI的数据，增强提示词以获得更好的分类效果
          const prompt = `
作为资深档案专家请分析以下书签数据，并创建不多于20个有意义的智能分类类别。每个类别应该能够归纳一组相关的书签。你的目标是便于用户进行信息检索。

分析要求：
1. 不要仅依赖标签，而是综合分析书签的标题、URL和内容摘要
2. 创建有意义的分类名称，能够准确反映该类别下书签的共同主题
3. 每个书签可以属于多个分类
4. 尽量让每个书签都被分类，除非确实无法归类
5. 请不要在分类名称中包含任何特殊字符，如逗号、引号、反斜杠等
6. 同一个分类里，不可出现相同的书签ID
7. 无法分类的书签归属到'未分类'中

书签数据：
${JSON.stringify(bookmarksData, null, 2)}

【重要】你必须严格按照以下JSON格式返回分类结果，不要添加任何额外的文本、注释或解释。你的整个回复必须是一个有效的JSON数组，可以直接被JSON.parse()解析：
[
  {
    "name": "分类名称",
    "bookmarkIds": ["书签ID1", "书签ID2"],
    "description": "简短描述该分类的主题和内容特点"
  }
]

【格式要求】：
1. 返回的必须是有效的JSON格式，使用双引号而非单引号
2. 不要在JSON前后添加任何额外文本、代码块标记或解释
3. 确保所有字符串都正确转义，特别是包含双引号或特殊字符的内容
4. bookmarkIds数组必须只包含在提供的书签数据中存在的ID
5. 返回的JSON必须可以直接被JSON.parse()解析，不要使用任何非标准JSON语法
6. 不要在JSON中包含任何注释
7. 不要使用undefined、NaN或函数等非JSON值
8. 不要使用任何Markdown格式或代码块
9. 不要包含任何换行符(\n)、回车符(\r)或制表符(\t)等特殊字符

示例返回格式（请确保你的返回与此格式完全一致）：
[
  {
    "name": "技术文档",
    "bookmarkIds": ["123", "456"],
    "description": "包含各类技术文档和API参考资料"
  },
  {
    "name": "学习资源",
    "bookmarkIds": ["789", "101"],
    "description": "各类学习平台和教程网站"
  }
]
`;

          console.log('准备发送AI请求...');
          
          // 调用AI API
          // 处理 API URL，确保正确的端点路径
          const isGroqApi = apiUrl.toLowerCase().includes('groq.com');
          const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
          const fullApiUrl = isGroqApi 
            ? `${baseUrl}/completion`  // Groq API 使用 /completion 端点
            : `${baseUrl}/chat/completions`;  // OpenAI API 使用 /chat/completions 端点
            
          console.log('构建的API URL:', fullApiUrl);
          console.log('发送API请求到:', fullApiUrl);
          
          const requestBody = {
              model: selectedModel || 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: '你是一个专业的书签分类助手，擅长根据书签的标题、URL、标签和描述进行智能分类。你的分类应该有意义且直观，能够帮助用户更好地组织和查找书签。你必须严格按照要求返回标准JSON格式，不添加任何额外文本、代码块标记或注释。'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7
            };
            
            console.log('API请求体:', JSON.stringify(requestBody));
            
            const response = await fetch(fullApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            console.error(`AI API请求失败: ${response.status}`);
            throw new Error(`AI API请求失败: ${response.status}`);
          }

          console.log('AI API请求成功，状态码:', response.status);
          const data = await response.json();
          console.log('AI API响应数据:', data);
          const aiResponse = data.choices[0].message.content;
          
          // 尝试解析AI返回的JSON数据
          try {
            console.log('开始解析AI响应...');
            console.log('原始AI响应:', aiResponse.substring(0, 200) + '...');
            
            // 使用更强大的正则表达式提取JSON数组部分
            const jsonRegex = /\[\s*\{[\s\S]*?\}\s*\]/g;
            const jsonMatches = aiResponse.match(jsonRegex);
            
            // 如果找到了JSON数组格式的内容，使用第一个匹配项
            let jsonStr = '';
            if (jsonMatches && jsonMatches.length > 0) {
              jsonStr = jsonMatches[0];
              console.log('通过正则表达式提取到JSON数组:', jsonStr.substring(0, 100) + '...');
            } else {
              // 如果没有找到JSON数组，尝试使用整个响应内容
              jsonStr = aiResponse;
              console.log('未找到JSON数组格式，使用完整响应');
            }
            
            // 第一阶段清理：移除Markdown代码块标记和其他非JSON内容
            jsonStr = jsonStr.replace(/```(?:json)?[\r\n]?|```/g, '').trim(); // 移除所有代码块标记
            jsonStr = jsonStr.replace(/^[\s\S]*?(\[)/m, '$1'); // 移除JSON数组开始前的所有内容
            jsonStr = jsonStr.replace(/(\])[\s\S]*?$/m, '$1'); // 移除JSON数组结束后的所有内容
            
            // 第二阶段清理：修复常见的JSON格式错误
            jsonStr = jsonStr.replace(/'/g, '"'); // 将单引号替换为双引号
            jsonStr = jsonStr.replace(/,\s*\]/g, ']'); // 移除数组末尾多余的逗号
            jsonStr = jsonStr.replace(/,\s*\}/g, '}'); // 移除对象末尾多余的逗号
            jsonStr = jsonStr.replace(/\\n/g, '\n'); // 处理转义的换行符
            jsonStr = jsonStr.replace(/\\r/g, '\r'); // 处理转义的回车符
            jsonStr = jsonStr.replace(/\\t/g, '\t'); // 处理转义的制表符
            
            // 第三阶段清理：处理可能的Unicode转义和不可见字符
            jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            
            // 第四阶段清理：确保属性名使用双引号
            jsonStr = jsonStr.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            
            console.log('清理后的JSON字符串:', jsonStr.substring(0, 100) + '...');
            
            let aiCategories;
            try {
              // 尝试直接解析清理后的JSON
              aiCategories = JSON.parse(jsonStr);
              console.log('JSON解析成功，分类数量:', aiCategories.length);
            } catch (jsonError) {
              console.error('第一次JSON解析失败:', jsonError);
              
              // 尝试进一步修复和解析
              try {
                // 检查是否有未闭合的引号或括号
                let fixedStr = jsonStr;
                
                // 修复可能的JSON语法错误
                fixedStr = fixedStr
                  // 修复未闭合的对象
                  .replace(/(\{[^\}]*$)/g, '$1}')
                  // 修复未闭合的数组
                  .replace(/(\[[^\]]*$)/g, '$1]')
                  // 修复缺少值的属性 ("key":,)
                  .replace(/"([^"]+)"\s*:\s*,/g, '"$1":null,')
                  // 修复缺少逗号的相邻属性
                  .replace(/}\s*{/g, '},{')
                  // 修复属性名后缺少值的情况
                  .replace(/"([^"]+)"\s*:\s*(?=\s*[,\}])/g, '"$1":null')
                  // 修复字符串中未转义的引号
                  .replace(/(?<!\\)"([^"]*)(?<!\\)"([^"]*)(?<!\\)"([^"]*)(?<!\\)"/g, '"$1\\"$2\\"$3"')
                  // 修复多余的逗号
                  .replace(/,\s*([\}\]])/g, '$1');
                
                console.log('进一步修复后的JSON字符串:', fixedStr.substring(0, 100) + '...');
                
                // 尝试解析修复后的JSON
                aiCategories = JSON.parse(fixedStr);
                console.log('修复后JSON解析成功');
              } catch (fixError) {
                console.error('修复后JSON解析仍然失败:', fixError);
                
                // 最后尝试：使用更激进的方法提取和重构JSON
                try {
                  // 提取所有可能的键值对
                  const nameMatches = jsonStr.match(/"name"\s*:\s*"([^"]+)"/g) || [];
                  const bookmarkIdsMatches = jsonStr.match(/"bookmarkIds"\s*:\s*(\[[^\]]*\])/g) || [];
                  const descriptionMatches = jsonStr.match(/"description"\s*:\s*"([^"]*)"/g) || [];
                  
                  // 如果至少找到了一些名称，尝试重建JSON
                  if (nameMatches.length > 0) {
                    console.log('尝试从部分匹配重建JSON...');
                    
                    // 构建一个最小化的有效JSON数组
                    const reconstructedCategories = [];
                    
                    for (let i = 0; i < nameMatches.length; i++) {
                      const nameMatch = nameMatches[i].match(/"([^"]+)"$/) || ['', '未命名分类'];
                      const name = nameMatch[1];
                      
                      // 尝试获取对应的bookmarkIds
                      let bookmarkIds = [];
                      if (bookmarkIdsMatches[i]) {
                        try {
                          const idsJson = bookmarkIdsMatches[i].replace(/"bookmarkIds"\s*:\s*/, '');
                          bookmarkIds = JSON.parse(idsJson);
                        } catch (e) {
                          console.error('解析bookmarkIds失败:', e);
                        }
                      }
                      
                      // 尝试获取对应的description
                      let description = '';
                      if (descriptionMatches[i]) {
                        const descMatch = descriptionMatches[i].match(/"([^"]*)"$/) || ['', ''];
                        description = descMatch[1];
                      }
                      
                      reconstructedCategories.push({
                        name,
                        bookmarkIds,
                        description
                      });
                    }
                    
                    aiCategories = reconstructedCategories;
                    console.log('成功从部分匹配重建JSON，分类数量:', aiCategories.length);
                  } else {
                    // 如果无法提取任何分类名称，创建一个基本的分类结构
                    console.log('无法从响应中提取分类数据，创建基本分类...');
                    
                    // 创建一个基本的分类，将所有书签放入"其他"分类
                    aiCategories = [
                      {
                        name: "其他",
                        bookmarkIds: allBookmarkIds,
                        description: "自动创建的分类，包含所有书签"
                      }
                    ];
                    
                    console.log('创建了基本分类，包含所有书签');
                  }
                } catch (reconstructError) {
                  console.error('重建JSON失败:', reconstructError);
                  
                  // 即使在最坏的情况下也提供一个可用的分类
                  console.log('所有解析方法都失败，创建应急分类...');
                  aiCategories = [
                    {
                      name: "所有书签",
                      bookmarkIds: allBookmarkIds,
                      description: "包含所有书签的应急分类"
                    }
                  ];
                }
              }
            }
            
            // 验证并转换AI返回的分类数据
            if (Array.isArray(aiCategories) && aiCategories.length > 0) {
              // 创建一个新的智能分类数组，不包含未分类项
              const smartCategories: Category[] = aiCategories.map((cat, index) => ({
                id: `smart_${index}_${Date.now()}`,
                name: cat.name,
                bookmarkIds: Array.isArray(cat.bookmarkIds) ? cat.bookmarkIds : [],
                icon: "🏷️", // 为智能分类添加标签图标
                description: cat.description // 保存分类描述，如果有的话
              }));
              
              // 收集已被AI分类的书签ID
              const categorizedBookmarkIds = new Set<string>();
              smartCategories.forEach(category => {
                category.bookmarkIds.forEach(id => categorizedBookmarkIds.add(id));
              });
              
              // 找出所有未被AI分类的书签（包括有标签有描述但AI未分类的，以及之前识别的无标签无描述的书签）
              const aiUncategorizedBookmarks = bookmarksWithMetadata
                .filter(bookmark => !categorizedBookmarkIds.has(bookmark.id))
                .map(bookmark => bookmark.id);
              
              // 合并两类未分类书签：1. 无标签无描述的 2. 有标签有描述但AI未分类的
              const uncategorizedBookmarks = [...new Set([...uncategorizedBookmarkIds, ...aiUncategorizedBookmarks])];
              
              console.log(`AI分类后：有标签有描述但未被分类的书签: ${aiUncategorizedBookmarks.length}, 最终未分类书签总数: ${uncategorizedBookmarks.length}`);
              
              // 创建最终的智能分类数组，包含AI生成的分类
              const finalSmartCategories = [...smartCategories];
              
              // 在所有AI生成的分类之后添加固定的未分类类别
              const fixedUncategorizedId = 'smart_uncategorized';
              finalSmartCategories.push({
                id: fixedUncategorizedId,
                name: "未分类",
                bookmarkIds: uncategorizedBookmarks,
                icon: "📁" // 为未分类添加文件夹图标
              });
              
              console.log(`AI分类完成，共生成 ${finalSmartCategories.length - 1} 个智能分类，有 ${uncategorizedBookmarks.length} 个书签归入未分类项`);
              
              // 更新状态并保存到localStorage
              set({ smartCategories: finalSmartCategories });
              saveSettingsToStorage({ smartCategories: finalSmartCategories });
              return;
            } else {
              throw new Error('AI返回的分类数据无效');
            }
          } catch (parseError) {
            console.error('解析AI响应失败:', parseError);
            throw new Error('解析AI响应失败: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
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
(async () => {
  try {
    // 加载设置
    const settings = await loadSettingsFromStorage();
    
    // 初始化store状态
    useBookmarkStore.setState(settings);
    
    console.log('初始化store完成，当前设置状态:', {
      apiKey: settings.apiKey ? '已设置' : '未设置',
      apiUrl: settings.apiUrl,
      selectedModel: settings.selectedModel,
      useWebCrawler: settings.useWebCrawler
    });
  } catch (error) {
    console.error('初始化store失败:', error);
    // 使用默认设置初始化
    useBookmarkStore.setState(DEFAULT_SETTINGS);
  }
})();
