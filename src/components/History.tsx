import React, { useEffect, useState, useRef } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { useHistoryStore } from '../store/historyStore';
import { getFaviconUrl } from '../utils/favicon';

export const History: React.FC = () => {
  const { historyItems, loadHistory, isLoading } = useHistoryStore();
  const [showMarquee, setShowMarquee] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const marqueeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (marqueeTimerRef.current) {
        clearTimeout(marqueeTimerRef.current);
      }
    };
  }, []);

  // 添加日志的函数
  const addLog = React.useCallback((message: string) => {
    console.log(message);
    setProcessLogs(prev => [...prev, message]);
  }, []);

  // 处理刷新历史记录按钮点击事件
  const handleRefreshHistory = React.useCallback(async () => {
    if (isLoading) return;
    
    try {
      // 清空之前的日志
      setProcessLogs([]);
      // 显示跑马灯
      setShowMarquee(true);
      
      addLog('开始加载历史记录...');
      
      // 加载历史记录
      await loadHistory();
      
      addLog('历史记录加载完成！');
      
      // 设置5秒后自动隐藏跑马灯
      if (marqueeTimerRef.current) {
        clearTimeout(marqueeTimerRef.current);
      }
      marqueeTimerRef.current = setTimeout(() => {
        setShowMarquee(false);
      }, 5000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`加载历史记录失败: ${errorMessage}`);
      console.error('加载历史记录失败:', error);
    }
  }, [isLoading, loadHistory, addLog]);

  // 初始加载历史记录
  useEffect(() => {
    // 确保在组件挂载时加载历史记录
    handleRefreshHistory();
  }, [handleRefreshHistory]);

  // 渲染历史记录列表
  const renderHistoryItems = () => {
    // 获取按日期分组的历史记录
    const groupedItems = useHistoryStore.getState().getGroupedHistoryItems();
    const dateGroups = Object.keys(groupedItems);
    
    if (dateGroups.length === 0) {
      return (
        <div className="flex items-center justify-center flex-col h-64">
          <Clock className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-500">暂无历史记录</h3>
          <p className="text-gray-400 mt-2 text-center">
            您的浏览历史记录将显示在这里
          </p>
        </div>
      );
    }
    
    // 对日期进行排序（倒序）
    dateGroups.sort((a, b) => {
      const dateA = new Date(a.replace(/年|月|日/g, (match) => {
        if (match === '年') return '/';
        if (match === '月') return '/';
        return '';
      }));
      const dateB = new Date(b.replace(/年|月|日/g, (match) => {
        if (match === '年') return '/';
        if (match === '月') return '/';
        return '';
      }));
      return dateB.getTime() - dateA.getTime();
    });
    
    return (
      <div className="space-y-6">
        {dateGroups.map(dateStr => (
          <div key={dateStr} className="time-line-container">
            <div className="sticky top-16 z-10 bg-gray-100 py-2 px-4 rounded-lg mb-3 flex items-center shadow-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
              <h3 className="text-sm font-medium text-gray-700">{dateStr}</h3>
              <div className="ml-auto text-xs text-gray-500">{groupedItems[dateStr].length}条记录</div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-blue-100 ml-1 relative">
              {groupedItems[dateStr].map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow flex items-center gap-2 w-full cursor-pointer relative"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {/* 时间点标记 */}
                  <div className="absolute left-[-14px] top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full"></div>
                  <img
                    src={getFaviconUrl(item.url)}
                    alt=""
                    className="w-5 h-5 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icons/icon32.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium hover:text-blue-600 truncate flex-shrink min-w-0 max-w-[300px]"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                    <div className="text-xs text-gray-500">
                      {new Date(item.lastVisitTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar relative">
      {/* 固定操作栏 */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-white shadow-sm py-2 px-4 mb-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center"> {/* 移除relative定位，与BookmarkList保持一致 */}
          <button
            onClick={handleRefreshHistory}
            className="p-2 mr-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新历史记录"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
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
        {/* 添加右侧空白区域，与BookmarkList保持一致的布局 */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm invisible">
          {/* 这是一个不可见的占位元素，用于保持与BookmarkList操作栏的布局一致性 */}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {renderHistoryItems()}
      </div>
    </div>
  );
};