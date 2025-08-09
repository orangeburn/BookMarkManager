import React, { useMemo } from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { Edit2, Trash2, Grid, List, RefreshCw } from "lucide-react";
import { getFaviconUrl } from "../utils/favicon";
import { Bookmark } from "../types/bookmark";
import { EditBookmarkModal } from "./EditBookmarkModal";
import { ConfirmModal } from './ConfirmModal';

// 智能分类书签列表组件
export const SmartBookmarkList: React.FC = () => {
  const {
    bookmarks,
    smartCategories,
    selectedCategory,
    viewMode,
    setViewMode,
    updateBookmark,
    activeTab
  } = useBookmarkStore();

  // 状态管理
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = React.useState<string | null>(null);

  // 获取当前选中的智能分类
  const selectedSmartCategory = useMemo(() => {
    if (activeTab !== 'smart' || !selectedCategory) return null;
    return smartCategories.find(cat => cat.id === selectedCategory);
  }, [activeTab, selectedCategory, smartCategories]);

  // 获取当前分类下的书签
  const filteredBookmarks = useMemo(() => {
    if (!selectedSmartCategory) return [];
    
    // 从智能分类的bookmarkIds中获取书签
    return selectedSmartCategory.bookmarkIds
      .map(id => bookmarks[id])
      .filter(bookmark => bookmark) // 过滤掉不存在的书签
      .sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0)); // 按添加日期排序
  }, [selectedSmartCategory, bookmarks]);

  // 处理书签编辑
  const handleEditBookmark = React.useCallback((bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsEditModalOpen(true);
  }, []);

  // 处理书签删除
  const handleDeleteBookmark = React.useCallback((id: string) => {
    setBookmarkToDelete(id);
    setIsConfirmDeleteOpen(true);
  }, []);

  // 确认删除书签
  const confirmDeleteBookmark = React.useCallback(() => {
    if (bookmarkToDelete) {
      // 从智能分类中移除书签引用，但不删除实际书签
      if (selectedSmartCategory) {
        const updatedSmartCategories = smartCategories.map(cat => {
          if (cat.id === selectedSmartCategory.id) {
            return {
              ...cat,
              bookmarkIds: cat.bookmarkIds.filter(id => id !== bookmarkToDelete)
            };
          }
          return cat;
        });
        
        // 更新智能分类
        useBookmarkStore.getState().setSmartCategories(updatedSmartCategories);
      }
      
      // 关闭确认对话框
      setBookmarkToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  }, [bookmarkToDelete, selectedSmartCategory, smartCategories]);

  // 保存编辑后的书签
  const handleSaveBookmark = React.useCallback((bookmarkId: string, formData: any) => {
    updateBookmark(bookmarkId, formData);
    setIsEditModalOpen(false);
    setEditingBookmark(null);
  }, [updateBookmark]);

  // 如果不在智能分类标签页或没有选中分类，不显示任何内容
  if (activeTab !== 'smart' || !selectedSmartCategory) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-500">
        <p>请选择一个智能分类以查看书签</p>
      </div>
    );
  }

  // 如果当前分类下没有书签
  if (filteredBookmarks.length === 0) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-500">
        <p>当前智能分类下没有书签</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar relative">
      {/* 固定操作栏 */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-white shadow-sm py-2 px-4 mb-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              useBookmarkStore.getState().generateSmartCategories();
            }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新智能分类"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        {/* 视图切换按钮 - 固定在操作栏右侧 */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewMode('card');
            }}
            className={`p-2 ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="卡片视图"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewMode('list');
            }}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="列表视图"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* 书签列表 */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          没有找到匹配的书签
        </div>
      ) : (
        <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6' : 'flex flex-col space-y-3'}>
          {filteredBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className={`bg-white rounded-lg shadow-sm ${viewMode === 'card' ? 'p-4' : 'p-3'} hover:shadow-md transition-shadow`}
              onClick={() => window.open(bookmark.url, '_blank')}
              style={{ cursor: 'pointer' }}
            >
              {viewMode === 'card' ? (
                <div className="flex flex-col w-full space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <img
                        src={getFaviconUrl(bookmark.url)}
                        alt=""
                        className="w-5 h-5 rounded-sm flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icons/icon32.png';
                        }}
                      />
                      <h3 className="ml-2 font-medium text-sm text-gray-900 truncate flex-1" title={bookmark.title}>
                        {bookmark.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBookmark(bookmark);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBookmark(bookmark.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {bookmark.summary && (
                    <p className="text-xs text-gray-500 line-clamp-2">{bookmark.summary}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <img
                    src={getFaviconUrl(bookmark.url)}
                    alt=""
                    className="w-5 h-5 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icons/icon32.png';
                    }}
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className="text-sm font-medium hover:text-blue-600 truncate flex-shrink min-w-0 max-w-[300px]"
                      title={bookmark.title}
                    >
                      {bookmark.title}
                    </span>
                    {bookmark.tags && bookmark.tags.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0 max-w-[200px] overflow-hidden items-center">
                        {bookmark.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{bookmark.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditBookmark(bookmark);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bookmark.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* 编辑书签模态框 */}
      {isEditModalOpen && editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          onSubmit={(title, url, tags, summary, category) => {
            handleSaveBookmark(editingBookmark.id, {
              title,
              url,
              tags,
              summary,
              category
            });
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingBookmark(null);
          }}
          categories={useBookmarkStore.getState().categories}
        />)}

      {/* 删除确认模态框 */}
      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => {
            setIsConfirmDeleteOpen(false);
            setBookmarkToDelete(null);
          }}
          onConfirm={confirmDeleteBookmark}
          title="从智能分类中移除"
          message="确定要从此智能分类中移除这个书签吗？这不会删除实际的书签，只会从当前智能分类中移除。"
          confirmText="移除"
          cancelText="取消"
        />
      )}
    </div>
  );
};