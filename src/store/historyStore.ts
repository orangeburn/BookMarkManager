import { create } from 'zustand';

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitCount: number;
  lastVisitTime: number;
}

// 按日期分组的历史记录类型
interface GroupedHistoryItems {
  [date: string]: HistoryItem[];
}

interface HistoryState {
  historyItems: Record<string, HistoryItem>;
  groupedHistoryItems: GroupedHistoryItems;
  isLoading: boolean;
  error: string | null;
  setHistoryItems: (items: Record<string, HistoryItem>) => void;
  loadHistory: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getGroupedHistoryItems: () => GroupedHistoryItems;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  historyItems: {},
  groupedHistoryItems: {},
  isLoading: false,
  error: null,
  
  setHistoryItems: (items) => {
    const groupedItems = groupHistoryItemsByDate(items);
    set({ historyItems: items, groupedHistoryItems: groupedItems });
  },
  
  getGroupedHistoryItems: () => {
    return groupHistoryItemsByDate(get().historyItems);
  },
  
  loadHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // 检查是否在浏览器环境中，并且chrome.history API是否可用
      if (typeof chrome !== 'undefined' && chrome.history) {
        // 获取过去7天的历史记录
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);
        
        const historyItems = await chrome.history.search({
          text: '',  // 空字符串匹配所有历史记录
          startTime: startTime.getTime(),
          maxResults: 100  // 限制结果数量
        });
        
        // 转换为Record格式
        const historyRecord: Record<string, HistoryItem> = {};
        historyItems.forEach((item) => {
          if (item.id && item.url) {
            historyRecord[item.id] = {
              id: item.id,
              title: item.title || item.url,
              url: item.url,
              visitCount: item.visitCount || 1,
              lastVisitTime: item.lastVisitTime || Date.now()
            };
          }
        });
        
        // 按日期分组历史记录
        const groupedItems = groupHistoryItemsByDate(historyRecord);
        
        set({ 
          historyItems: historyRecord, 
          groupedHistoryItems: groupedItems,
          isLoading: false 
        });
      } else {
        // 非浏览器环境或API不可用，使用模拟数据
        console.log('Chrome历史API不可用，使用模拟数据');
        set({ 
          historyItems: {},
          groupedHistoryItems: {},
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '加载历史记录失败',
        isLoading: false 
      });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}));

// 辅助函数：将历史记录按日期分组并倒序排列
const groupHistoryItemsByDate = (historyItems: Record<string, HistoryItem>): GroupedHistoryItems => {
  const grouped: GroupedHistoryItems = {};
  
  // 将历史记录按日期分组
  Object.values(historyItems).forEach(item => {
    const date = new Date(item.lastVisitTime);
    const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    
    grouped[dateStr].push(item);
  });
  
  // 对每个日期组内的历史记录按时间倒序排序
  Object.keys(grouped).forEach(dateStr => {
    grouped[dateStr].sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  });
  
  return grouped;
};