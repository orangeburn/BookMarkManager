import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarkStore } from '../store/bookmarkStore';

describe('BookmarkStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    const store = useBookmarkStore.getState();
    store.setBookmarks({});
    store.setCategories([]);
    store.setViewMode('card');
    store.setSearchQuery('');
    store.setSettingsOpen(false);
    store.setApiKey('');

    // Mock Chrome API
    global.chrome.bookmarks.getTree = vi.fn();
  });

  it('should load bookmarks correctly', async () => {
    const mockBookmarkTree = {
      id: '0',
      children: [
        {
          id: '1',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '2',
              title: 'Example',
              url: 'https://example.com',
              dateAdded: 1234567890000
            }
          ]
        }
      ]
    };

    global.chrome.bookmarks.getTree.mockResolvedValue([mockBookmarkTree]);

    const store = useBookmarkStore.getState();
    await store.loadBookmarks();

    // 验证书签数据
    expect(Object.keys(store.bookmarks)).toHaveLength(1);
    expect(store.bookmarks['2']).toEqual({
      id: '2',
      title: 'Example',
      url: 'https://example.com',
      dateAdded: 1234567890000,
      category: '1',
      icon: `chrome-extension://test-extension-id/_favicon/?pageUrl=${encodeURIComponent('https://example.com')}`
    });

    // 验证分类数据
    expect(store.categories).toHaveLength(1);
    expect(store.categories[0]).toEqual({
      id: '1',
      name: 'Bookmarks Bar',
      bookmarkIds: ['2']
    });
  });

  it('should handle empty bookmark tree', async () => {
    global.chrome.bookmarks.getTree.mockResolvedValue([{
      id: '0',
      title: '',
      children: [{
        id: '1',
        title: 'Bookmarks Bar',
        children: []
      }]
    }]);

    const store = useBookmarkStore.getState();
    await store.loadBookmarks();

    expect(Object.keys(store.bookmarks)).toHaveLength(0);
    expect(store.categories).toHaveLength(0);
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    global.chrome.bookmarks.getTree.mockRejectedValue(error);

    const store = useBookmarkStore.getState();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await store.loadBookmarks();

    expect(consoleSpy).toHaveBeenCalledWith('Error loading bookmarks:', expect.any(Error));
    expect(Object.keys(store.bookmarks)).toHaveLength(0);
    expect(store.categories).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  it('should update store state correctly', () => {
    const store = useBookmarkStore.getState();

    // 测试设置书签
    const mockBookmarks = {
      '1': {
        id: '1',
        title: 'Test',
        url: 'https://test.com',
        dateAdded: Date.now(),
        category: '0',
        icon: 'test-icon'
      }
    };
    store.setBookmarks(mockBookmarks);
    expect(store.bookmarks).toEqual(mockBookmarks);

    // 测试设置分类
    const mockCategories = [{
      id: '0',
      name: 'Test Category',
      bookmarkIds: ['1']
    }];
    store.setCategories(mockCategories);
    expect(store.categories).toEqual(mockCategories);

    // 测试视图模式
    store.setViewMode('list');
    expect(store.viewMode).toBe('list');

    // 测试搜索查询
    store.setSearchQuery('test');
    expect(store.searchQuery).toBe('test');

    // 测试设置面板
    store.setSettingsOpen(true);
    expect(store.isSettingsOpen).toBe(true);

    // 测试 API Key
    store.setApiKey('test-key');
    expect(store.apiKey).toBe('test-key');
  });
});