import React, { useState } from "react";
import { X, Grid, List } from "lucide-react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { CategoryManager } from "./CategoryManager";

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    apiKey, 
    setApiKey, 
    apiUrl, 
    setApiUrl,
    selectedModel,
    setSelectedModel,
    useWebCrawler,
    setUseWebCrawler,
    viewMode,
    setViewMode
  } = useBookmarkStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey !== null ? apiKey : "");
  const [tempApiUrl, setTempApiUrl] = useState(apiUrl !== undefined && apiUrl !== null ? apiUrl : "");
  const [tempSelectedModel, setTempSelectedModel] = useState(selectedModel !== undefined && selectedModel !== null ? selectedModel : "");
  const [tempUseWebCrawler, setTempUseWebCrawler] = useState(useWebCrawler);
  
  const [tempViewMode, setTempViewMode] = useState(viewMode);
  
  // 当设置面板打开时，从store中获取最新的设置值
  React.useEffect(() => {
    if (isSettingsOpen) {
      console.log('设置面板打开，加载当前设置:', {
        apiKey: apiKey ? '已设置' : '未设置',
        apiUrl,
        selectedModel,
        useWebCrawler
      });
      setTempApiKey(apiKey !== null ? apiKey : "");
      setTempApiUrl(apiUrl !== undefined && apiUrl !== null ? apiUrl : "");
      setTempSelectedModel(selectedModel !== undefined && selectedModel !== null ? selectedModel : "");
      setTempUseWebCrawler(useWebCrawler);
      setTempViewMode(viewMode);
    }
  }, [isSettingsOpen, apiKey, apiUrl, selectedModel, useWebCrawler, viewMode]);
  const [activeTab, setActiveTab] = useState<'api' | 'categories'>('api');

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    // 确保即使是空字符串也能正确保存
    setApiKey(tempApiKey);
    // 不再使用默认值，允许空字符串
    setApiUrl(tempApiUrl);
    setSelectedModel(tempSelectedModel);
    setUseWebCrawler(tempUseWebCrawler);
    setViewMode(tempViewMode);
    
    // 添加延迟关闭，确保设置有时间保存
    setTimeout(() => {
      // 验证设置是否成功保存
      console.log('保存的设置:', {
        apiKey: tempApiKey ? '已设置' : '未设置',
        apiUrl: tempApiUrl,
        selectedModel: tempSelectedModel,
        useWebCrawler: tempUseWebCrawler,
        viewMode: tempViewMode
      });
      setSettingsOpen(false);
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-oid="8cfins."
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col"
        data-oid="5la5:f5"
      >
        <div
          className="flex items-center justify-between mb-4"
          data-oid="s.sz1k."
        >
          <h2 className="text-xl font-semibold" data-oid="5-zoss0">
            设置
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full"
            data-oid="hta8j6."
          >
            <X className="h-5 w-5" data-oid="9m8rfot" />
          </button>
        </div>
        
        {/* 标签页切换 */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('api')}
          >
            API 设置
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'categories' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('categories')}
          >
            分类管理
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'api' && (
            <div className="space-y-4" data-oid="rgu00rt">
              <div data-oid="p0iv.oj" className="space-y-4">
                <div>
                  <label
                    htmlFor="apiUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    API URL
                  </label>
                  <input
                    type="text"
                    id="apiUrl"
                    value={tempApiUrl}
                    onChange={(e) => setTempApiUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.openai.com/v1/chat/completions"
                  />
                </div>
                <div>
                  <label
                    htmlFor="model"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    AI 模型
                  </label>
                  <input
                    type="text"
                    id="model"
                    value={tempSelectedModel}
                    onChange={(e) => setTempSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：gpt-3.5-turbo, gpt-4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    请输入您想使用的AI模型名称，例如：gpt-3.5-turbo, gpt-4, gpt-4-turbo等
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium text-gray-700 mb-1"
                    data-oid="8q1_kdn"
                  >
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                    data-oid="uejzdqn"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="useWebCrawler"
                      className="text-sm font-medium text-gray-700"
                    >
                      启用网页爬虫（提取网页内容用于AI分析）
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="useWebCrawler"
                        checked={tempUseWebCrawler}
                        onChange={(e) => setTempUseWebCrawler(e.target.checked)}
                        className="sr-only"
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full shadow-inner"></div>
                      <div
                        className={`absolute w-5 h-5 rounded-full shadow inset-y-0 left-0 transition-transform duration-200 transform ${tempUseWebCrawler ? 'translate-x-5 bg-blue-500' : 'translate-x-0 bg-white'}`}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    启用后，AI将分析网页内容生成更准确的标签和描述，但可能需要更长的处理时间
                  </p>
                </div>
                {/* 注释掉默认视图模式选择部分
                <div className="mt-4">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    默认视图模式
                  </label>
                  <div className="flex space-x-4">
                    <div 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer ${tempViewMode === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setTempViewMode('card')}
                    >
                      <Grid className="h-5 w-5 mr-2 text-gray-700" />
                      <span>卡片视图</span>
                    </div>
                    <div 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer ${tempViewMode === 'list' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setTempViewMode('list')}
                    >
                      <List className="h-5 w-5 mr-2 text-gray-700" />
                      <span>列表视图</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    选择书签的默认显示方式，卡片视图更直观，列表视图可显示更多信息
                  </p>
                </div>
                */}
              </div>
              <div className="flex justify-end gap-3" data-oid="2p37nvo">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  data-oid="xp7ck9b"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-oid="l3qoizj"
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
        {activeTab === 'categories' && (
          <CategoryManager />
        )}
      </div>
    </div>
  );
};
