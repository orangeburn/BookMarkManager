import React, { useState } from "react";
import { X } from "lucide-react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { CategoryManager } from "./CategoryManager";

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, apiKey, setApiKey } =
    useBookmarkStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey || "");
  const [activeTab, setActiveTab] = useState<'api' | 'categories'>('api');

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setApiKey(tempApiKey);
    setSettingsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      data-oid="8cfins."
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl"
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
        
        {activeTab === 'api' && (
          <div className="space-y-4" data-oid="rgu00rt">
            <div data-oid="p0iv.oj">
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
        
        {activeTab === 'categories' && (
          <CategoryManager />
        )}
      </div>
    </div>
  );
};
