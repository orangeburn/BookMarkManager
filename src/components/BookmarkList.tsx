import React from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { ExternalLink, Edit2, Trash2, GripVertical, Grid, List, RefreshCw } from "lucide-react";
import { DndContext, useDraggable as useDrag, useDroppable as useDrop, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import { getFaviconUrl } from "../utils/favicon";
import { Bookmark, BookmarkFormData } from "../types/bookmark";
import { EditBookmarkModal } from "./EditBookmarkModal";
import { ConfirmModal } from './ConfirmModal';
import { generateTagsAndSummary } from '../api/ai';

// 定义BookmarkListItem组件
const BookmarkListItem: React.FC<{
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  moveBookmark: (dragId: string, hoverId: string) => void;
}> = React.memo(({ bookmark, onEdit, onDelete, moveBookmark }) => {
  const {attributes, listeners, setNodeRef: setDragNodeRef, isDragging} = useDrag({
    id: bookmark.id,
    data: { type: 'bookmark', index: bookmark.index },
  });

  const {setNodeRef: setDropNodeRef} = useDrop({
    id: bookmark.id,
    data: { type: 'bookmark' },
    onDragOver: (event) => {
      const { active } = event;
      if (active.id !== bookmark.id) {
        moveBookmark(active.id as string, bookmark.id);
      }
    }
  });

  // 处理列表项点击事件，打开书签链接
  const handleItemClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮或拖拽图标，不触发跳转
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[data-drag-handle]')
    ) {
      return;
    }
    window.open(bookmark.url, '_blank');
  };

  return (
    <div
      ref={(node) => {
        setDragNodeRef(node);
        setDropNodeRef(node);
      }}
      className={`relative bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''} flex items-center gap-2 w-full`}
      onClick={handleItemClick}
      style={{ cursor: 'pointer' }}
    >
      <div
        {...attributes}
        {...listeners}
        className="p-1 cursor-move hover:text-gray-600 touch-none flex-shrink-0"
        data-drag-handle
      >
        <GripVertical size={14} />
      </div>
      <img
        src={getFaviconUrl(bookmark.url)}
        alt=""
        className="w-5 h-5 flex-shrink-0"
        onError={(e) => {
          // 当图标加载失败时，使用默认图标
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
            onEdit(bookmark);
          }}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有在关键属性变化时才重新渲染
  return (
    prevProps.bookmark.id === nextProps.bookmark.id &&
    prevProps.bookmark.title === nextProps.bookmark.title &&
    prevProps.bookmark.url === nextProps.bookmark.url &&
    prevProps.bookmark.index === nextProps.bookmark.index &&
    JSON.stringify(prevProps.bookmark.tags) === JSON.stringify(nextProps.bookmark.tags) &&
    prevProps.bookmark.summary === nextProps.bookmark.summary
  );
});

// 定义卡片视图组件
const BookmarkCard: React.FC<{
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  moveBookmark: (dragId: string, hoverId: string) => void;
}> = React.memo(({ bookmark, onEdit, onDelete, moveBookmark }) => {
  const {attributes, listeners, setNodeRef: setDragNodeRef, isDragging} = useDrag({
    id: bookmark.id,
    data: { type: 'bookmark', index: bookmark.index },
  });

  const {setNodeRef: setDropNodeRef} = useDrop({
    id: bookmark.id,
    data: { type: 'bookmark' },
    onDragOver: (event) => {
      const { active } = event;
      if (active.id !== bookmark.id) {
        moveBookmark(active.id as string, bookmark.id);
      }
    }
  });

  // 处理卡片点击事件，打开书签链接
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮或拖拽图标，不触发跳转
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[data-drag-handle]')
    ) {
      return;
    }
    window.open(bookmark.url, '_blank');
  };

  // 截断书签标题，限制为5个中文字符长度（约10个英文字符）
  const truncateTitle = (title: string) => {
    if (!title || title.trim() === '') {
      return '';
    }
    return title.length > 10 ? title.slice(0, 10) + '...' : title;
  };

  return (
    <div
      ref={(node) => {
        setDragNodeRef(node);
        setDropNodeRef(node);
      }}
      className={`relative bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex flex-col w-full space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="p-1 cursor-move hover:text-gray-600 touch-none mr-1"
              data-drag-handle
            >
              <GripVertical size={14} />
            </div>
            <img
              src={getFaviconUrl(bookmark.url)}
              alt=""
              className="w-5 h-5 rounded-sm flex-shrink-0"
              onError={(e) => {
                // 当图标加载失败时，使用默认图标
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
                onEdit(bookmark);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bookmark.id);
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
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有在关键属性变化时才重新渲染
  return (
    prevProps.bookmark.id === nextProps.bookmark.id &&
    prevProps.bookmark.title === nextProps.bookmark.title &&
    prevProps.bookmark.url === nextProps.bookmark.url &&
    prevProps.bookmark.index === nextProps.bookmark.index &&
    JSON.stringify(prevProps.bookmark.tags) === JSON.stringify(nextProps.bookmark.tags) &&
    prevProps.bookmark.summary === nextProps.bookmark.summary
  );
});

export const BookmarkList: React.FC = () => {
  const {
    bookmarks,
    setBookmarks,
    categories,
    selectedCategory,
    viewMode,
    searchQuery,
    setViewMode,
    apiKey,
    apiUrl,
    selectedModel,
    useWebCrawler
  } = useBookmarkStore();
  
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = React.useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [processLogs, setProcessLogs] = React.useState<string[]>([]);
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  const [showMarquee, setShowMarquee] = React.useState(false);
  const marqueeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 组件卸载时清除计时器
  React.useEffect(() => {
    return () => {
      if (marqueeTimerRef.current) {
        clearTimeout(marqueeTimerRef.current);
      }
    };
  }, []);
  
  // 添加日志的函数，确保同步到控制台和UI
  const addLog = React.useCallback((message: string) => {
    console.log(message); // 先输出到控制台，确保控制台日志优先显示
    // 使用函数式更新确保状态更新基于最新状态
    setProcessLogs(prev => [...prev, message]); // 然后更新UI状态
  }, []);
  
  // 处理刷新书签按钮点击事件
  const handleRefreshBookmarks = React.useCallback(async () => {
    if (!selectedCategory || !apiKey || !apiUrl || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      // 清空之前的日志
      setProcessLogs([]);
      // 显示跑马灯
      setShowMarquee(true);
      
      // 获取当前分类下的所有书签
      const categoryBookmarks = Object.values(bookmarks).filter(
        bookmark => bookmark.category === selectedCategory
      );
      
      if (categoryBookmarks.length === 0) {
        addLog('当前分类下没有书签');
        return;
      }
      
      addLog(`开始处理 ${categoryBookmarks.length} 个书签...`);
      
      // 获取updateBookmark函数，用于单个更新书签
      const { updateBookmark } = useBookmarkStore.getState();
      
      // 逐个处理书签：生成一个，立即保存一个
      for (let i = 0; i < categoryBookmarks.length; i++) {
        const bookmark = categoryBookmarks[i];
        try {
          addLog(`[${i+1}/${categoryBookmarks.length}] 正在为书签 ${bookmark.title} 生成标签和描述...`);
          
          // 调用AI API生成标签和描述
          const { tags, summary } = await generateTagsAndSummary(
            bookmark,
            apiKey,
            apiUrl,
            selectedModel,
            useWebCrawler
          );
          
          // 立即更新当前书签
          addLog(`[${i+1}/${categoryBookmarks.length}] 正在保存书签 ${bookmark.title} 的标签和描述...`);
          updateBookmark(bookmark.id, { tags, summary });
          addLog(`[${i+1}/${categoryBookmarks.length}] 书签 ${bookmark.title} 的标签和描述已保存成功`);
          
          // 添加短暂延迟，确保保存操作完成
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          addLog(`[${i+1}/${categoryBookmarks.length}] 为书签 ${bookmark.title} 生成标签和描述失败: ${errorMessage}`);
          console.error(`为书签 ${bookmark.title} 生成标签和描述失败:`, error);
        }
      }
      
      addLog('所有书签的标签和描述已更新完成！');
      
      // 验证更新是否成功
      setTimeout(() => {
        const currentBookmarks = useBookmarkStore.getState().bookmarks;
        categoryBookmarks.forEach(bookmark => {
          console.log(`验书签 ${bookmark.title} 的更新:`, {
            'tags': currentBookmarks[bookmark.id]?.tags,
            'summary': currentBookmarks[bookmark.id]?.summary
          });
        });
        
        // 设置5秒后自动隐藏跑马灯 - 只在所有处理完成后设置计时器
        if (marqueeTimerRef.current) {
          clearTimeout(marqueeTimerRef.current);
        }
        marqueeTimerRef.current = setTimeout(() => {
          setShowMarquee(false);
        }, 5000);
      }, 500); // 延迟500ms确保状态已更新
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`刷新书签失败: ${errorMessage}`);
      console.error('刷新书签失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCategory, apiKey, apiUrl, isRefreshing, bookmarks, selectedModel, useWebCrawler, addLog]);
  
  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // 过滤书签 - 优化useMemo依赖项
  const filteredBookmarks = React.useMemo(() => {
    // 转换书签对象为数组
    const bookmarkArray = Object.values(bookmarks);
    
    // 根据搜索词和选中的分类过滤
    return bookmarkArray.filter(bookmark => {
      // 搜索词过滤
      const matchesSearch = searchQuery
        ? bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          (bookmark.summary && bookmark.summary.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      // 分类过滤 - 当有搜索词时不过滤分类，实现全局搜索
      const matchesCategory = searchQuery
        ? true  // 有搜索词时不过滤分类，实现全局搜索
        : selectedCategory
          ? bookmark.category === selectedCategory
          : true;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (a.index || 0) - (b.index || 0));
  }, [bookmarks, searchQuery, selectedCategory]);
  
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
      // 如果在浏览器环境中，使用Chrome书签API删除实际书签
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        try {
          chrome.bookmarks.remove(bookmarkToDelete)
            .then(() => {
              console.log(`书签 ${bookmarkToDelete} 已成功从Chrome书签管理器中删除`);
              // 删除成功后更新本地状态
              const updatedBookmarks = { ...bookmarks };
              delete updatedBookmarks[bookmarkToDelete];
              setBookmarks(updatedBookmarks);
              setBookmarkToDelete(null);
              setIsConfirmDeleteOpen(false);
            })
            .catch(error => {
              console.error('删除书签失败:', error);
              if (chrome.runtime.lastError) {
                console.error('Chrome API错误:', chrome.runtime.lastError);
              }
            });
        } catch (error) {
          console.error('调用Chrome书签API失败:', error);
        }
      } else {
        // 非浏览器环境或Chrome书签API不可用，仅更新UI状态
        console.log('非浏览器环境或Chrome书签API不可用，仅更新UI状态');
        const updatedBookmarks = { ...bookmarks };
        delete updatedBookmarks[bookmarkToDelete];
        setBookmarks(updatedBookmarks);
        setBookmarkToDelete(null);
        setIsConfirmDeleteOpen(false);
      }
    }
  }, [bookmarkToDelete, bookmarks, setBookmarks]);
  
  // 移动书签（拖拽排序）- 优化函数，减少不必要的状态更新
  const moveBookmark = React.useCallback((dragId: string, hoverId: string) => {
    // 确保两个书签都存在
    if (!bookmarks[dragId] || !bookmarks[hoverId]) {
      return;
    }
    
    const dragBookmark = bookmarks[dragId];
    const hoverBookmark = bookmarks[hoverId];
    const dragIndex = dragBookmark.index || 0;
    const hoverIndex = hoverBookmark.index || 0;
    
    // 如果索引相同，不需要移动
    if (dragIndex === hoverIndex) {
      return;
    }
    
    // 如果在浏览器环境中，使用Chrome书签API更新实际书签顺序
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      try {
        // 获取拖拽书签的信息
        if (dragBookmark && dragBookmark.category) {
          // 使用Chrome书签API移动书签
          chrome.bookmarks.move(dragId, {
            parentId: dragBookmark.category,
            index: hoverIndex
          }).then(() => {
            // 获取当前分类下的所有书签并按索引排序
            const categoryBookmarks = Object.values(bookmarks)
              .filter(bookmark => bookmark.category === dragBookmark.category)
              .sort((a, b) => (a.index || 0) - (b.index || 0));
            
            // 重新排序书签
            // 1. 先从当前分类书签列表中移除被拖拽的书签
            const bookmarksWithoutDrag = categoryBookmarks.filter(b => b.id !== dragId);
            
            // 2. 在目标位置插入被拖拽的书签
            const reorderedBookmarks = [
              ...bookmarksWithoutDrag.slice(0, hoverIndex),
              dragBookmark,
              ...bookmarksWithoutDrag.slice(hoverIndex)
            ];
            
            // 更新所有书签的索引
            const updatedBookmarks = { ...bookmarks };
            reorderedBookmarks.forEach((bookmark, index) => {
              if (updatedBookmarks[bookmark.id]) {
                updatedBookmarks[bookmark.id] = {
                  ...updatedBookmarks[bookmark.id],
                  index: index
                };
              }
            });
            
            // 更新书签状态
            setBookmarks(updatedBookmarks);
          }).catch(error => {
            console.error('移动书签失败:', error);
          });
        }
      } catch (error) {
        console.error('调用Chrome书签API失败:', error);
      }
    }
  }, [bookmarks, setBookmarks]);
  
  // 处理拖拽结束事件
  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      moveBookmark(active.id as string, over.id as string);
    }
  }, [moveBookmark]);

  return (
    <div className="p-4 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar relative">
      {/* 固定操作栏 */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-white shadow-sm py-2 px-4 mb-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center"> {/* 移除relative定位，避免作为跑马灯的定位参考 */}
        <button
          onClick={handleRefreshBookmarks}
          className="p-2 mr-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="重新生成标签和描述"
          disabled={!selectedCategory || isRefreshing}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
        
        {/* 固定尺寸容器，使用visibility而非条件渲染，避免DOM结构变化 */}
        <div className="w-[280px] h-6 ml-2 overflow-hidden">
          <div 
            className="w-full h-full overflow-hidden" 
            style={{ 
              visibility: showMarquee ? 'visible' : 'hidden',
            }}
          >
            {processLogs.length === 0 ? (
              <div className="whitespace-nowrap truncate h-6 leading-6 text-xs text-gray-600 px-2">准备就绪</div>
            ) : processLogs.length === 1 ? (
              <div className="whitespace-nowrap truncate h-6 leading-6 text-xs text-gray-600 px-2">{processLogs[0]}</div>
            ) : (
              <div className="h-full w-full overflow-hidden">
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                  }}
                >
                  {processLogs.slice(-1).map((log, index) => (
                    <div 
                      key={index} 
                      className="whitespace-nowrap truncate h-6 leading-6 text-xs text-gray-600 px-2"
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} style={{ display: 'none' }} />
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
        {/* 视图切换按钮 - 固定在操作栏右侧 */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewMode('card');
              console.log('切换到卡片视图');
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
              console.log('切换到列表视图');
            }}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="列表视图"
          >
            <List size={18} />
          </button>
        </div>
      </div>
      
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? '没有找到匹配的书签' : '没有书签'}
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            onDragEnd={handleDragEnd}
            measuring={{
              droppable: {
                strategy: 'always'
              }
            }}
          >
          <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6' : 'flex flex-col space-y-3'}>
            {filteredBookmarks.map(bookmark => (
              viewMode === 'card' ? (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEditBookmark}
                  onDelete={handleDeleteBookmark}
                  moveBookmark={moveBookmark}
                />
              ) : (
                <BookmarkListItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEditBookmark}
                  onDelete={handleDeleteBookmark}
                  moveBookmark={moveBookmark}
                />
              )
            ))}
          </div>
          </DndContext>
        )}
      
      {/* 编辑书签模态框 */}
      {isEditModalOpen && editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          onSubmit={(title, url, tags, summary, category) => {
            // 创建一个函数来更新本地状态，确保在Chrome API操作完成后调用
            const updateLocalState = () => {
              const updatedBookmarks = { ...bookmarks };
              updatedBookmarks[editingBookmark.id] = {
                ...editingBookmark,
                title,
                url,
                // 直接将标签数组绑定到书签对象
                tags: tags,
                summary,
                category
              };
              setBookmarks(updatedBookmarks);
              setIsEditModalOpen(false);
              setEditingBookmark(null);
            };
            
            // 定义一个变量来跟踪是否需要等待Chrome API操作完成
            let waitForChromeApi = false;
            
            // 如果分类发生变化，使用Chrome书签API更新书签的父文件夹
            if (typeof chrome !== 'undefined' && chrome.bookmarks && category !== editingBookmark.category) {
              waitForChromeApi = true; // 需要等待Chrome API操作完成
              console.log(`正在移动书签 ${editingBookmark.id} 从分类 ${editingBookmark.category} 到分类 ${category}`);
              try {
                // 先获取书签当前信息，确认其当前父文件夹ID
                chrome.bookmarks.get(editingBookmark.id, (currentResults) => {
                  if (currentResults && currentResults.length > 0) {
                    const currentBookmark = currentResults[0];
                    console.log('移动前的书签信息:', currentBookmark);
                    console.log('当前父文件夹ID:', currentBookmark.parentId);
                    console.log('目标父文件夹ID:', category);
                    
                    // 获取当前分类的详细信息，用于调试
                    chrome.bookmarks.get(currentBookmark.parentId, (parentInfo) => {
                      if (parentInfo && parentInfo.length > 0) {
                        console.log('当前父文件夹信息:', parentInfo[0]);
                      }
                    });
                    
                    // 获取目标分类的详细信息，用于调试
                    chrome.bookmarks.get(category, (targetInfo) => {
                      if (targetInfo && targetInfo.length > 0) {
                        console.log('目标父文件夹信息:', targetInfo[0]);
                      }
                    });
                    
                    // 执行移动操作
                    chrome.bookmarks.move(editingBookmark.id, {
                      parentId: category
                    }).then(() => {
                      console.log(`书签 ${editingBookmark.id} 已成功移动到分类 ${category}`);
                      
                      // 验证书签是否已正确移动到新分类
                      chrome.bookmarks.get(editingBookmark.id, (results) => {
                        if (results && results.length > 0) {
                          const updatedBookmark = results[0];
                          console.log('移动后的书签信息:', updatedBookmark);
                          
                          // 确认父文件夹ID是否与目标分类匹配
                          if (updatedBookmark.parentId !== category) {
                            console.warn('书签分类同步失败: Chrome书签管理器中的父文件夹ID与目标分类不匹配');
                            console.warn(`期望: ${category}, 实际: ${updatedBookmark.parentId}`);
                            
                            // 尝试再次移动
                            console.log('尝试再次移动书签...');
                            chrome.bookmarks.move(editingBookmark.id, {
                              parentId: category
                            }).then(() => {
                              // 再次移动成功后更新本地状态
                              updateLocalState();
                            }).catch(retryError => {
                              console.error('再次移动书签失败:', retryError);
                              // 即使再次移动失败，也更新本地状态
                              updateLocalState();
                            });
                          } else {
                            console.log('书签分类同步成功!');
                            // 移动成功后更新本地状态
                            updateLocalState();
                          }
                        } else {
                          // 如果无法获取书签信息，也更新本地状态
                          updateLocalState();
                        }
                      });
                      
                      // 添加一个延时检查，确保异步操作完成后再次验证
                      setTimeout(() => {
                        chrome.bookmarks.get(editingBookmark.id, (finalResults) => {
                          if (finalResults && finalResults.length > 0) {
                            const finalBookmark = finalResults[0];
                            console.log('最终书签状态:', finalBookmark);
                            if (finalBookmark.parentId !== category) {
                              console.warn('最终检查: 书签分类同步失败');
                            } else {
                              console.log('最终检查: 书签分类同步成功');
                            }
                          }
                        });
                      }, 1000); // 1秒后检查
                    }).catch(error => {
                      console.error('移动书签失败:', error);
                      if (chrome.runtime.lastError) {
                        console.error('Chrome API错误:', chrome.runtime.lastError);
                      }
                      // 即使移动失败，也更新本地状态
                      updateLocalState();
                    });
                  } else {
                    // 如果无法获取书签信息，也更新本地状态
                    updateLocalState();
                  }
                });
              } catch (error) {
                console.error('调用Chrome书签API失败:', error);
                // 出现异常时也更新本地状态
                updateLocalState();
              }
            }
            
            // 更新标题等其他属性
            if (typeof chrome !== 'undefined' && chrome.bookmarks && 
                (title !== editingBookmark.title || url !== editingBookmark.url)) {
              if (!waitForChromeApi) { // 如果不需要等待分类变更，则设置等待标题更新
                waitForChromeApi = true;
              }
              chrome.bookmarks.update(editingBookmark.id, {
                title: title,
                url: url
              }).then(() => {
                console.log(`书签 ${editingBookmark.id} 的标题和URL已更新`);
                if (!waitForChromeApi) { // 如果不需要等待其他操作，则更新本地状态
                  updateLocalState();
                }
              }).catch(error => {
                console.error('更新书签属性失败:', error);
                if (!waitForChromeApi) { // 即使更新失败，也更新本地状态
                  updateLocalState();
                }
              });
            }
            
            // 如果不需要等待Chrome API操作，直接更新本地状态
            if (!waitForChromeApi) {
              updateLocalState();
            }
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingBookmark(null);
          }}
          categories={categories}
        />
      )}
      
      {/* 确认删除模态框 */}
      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => {
            setIsConfirmDeleteOpen(false);
            setBookmarkToDelete(null);
          }}
          onConfirm={confirmDeleteBookmark}
          title="确认删除"
          message="确定要删除这个书签吗？此操作无法撤销。"
        />
      )}
    </div>
  );
};
