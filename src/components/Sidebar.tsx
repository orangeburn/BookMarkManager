import React, { useState, useEffect } from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { Folder, Plus, Edit2, Trash2, RefreshCw, X } from "lucide-react";
import { Category } from "../types/bookmark";
import { Tabs } from "./Tabs";

interface SidebarProps {
  onAddCategory?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddCategory }) => {
  const { 
    categories, 
    smartCategories,
    selectedCategory, 
    setSelectedCategory, 
    bookmarks, 
    setBookmarks, 
    setCategories,
    activeTab,
    setActiveTab,
    generateSmartCategories,
    isLoading,
    error
  } = useBookmarkStore();
    
  // 状态管理
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // 计算字符串长度（中文算2个字符，其他算1个字符）
  const calculateStringLength = (str: string): number => {
    return str.split('').reduce((total, char) => {
      return total + (/[^\x00-\xff]/.test(char) ? 2 : 1);
    }, 0);
  };

  // 验证输入长度
  const validateInput = (value: string): boolean => {
    return calculateStringLength(value) <= 20;
  };

  // 添加新分类
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      alert('请输入分类名称');
      return;
    }

    if (!validateInput(trimmedName)) {
      alert('分类名称过长，请控制在10个中文或20个英文字符以内');
      return;
    }

    // 检查分类名称是否重复
    if (categories.some(cat => cat.name === trimmedName)) {
      alert('该分类名称已存在，请使用其他名称');
      return;
    }

    try {
      // 使用Chrome API创建书签文件夹
      const folder = await chrome.bookmarks.create({
        title: trimmedName,
        parentId: '2' // 在其他书签中创建
      });

      const newCategory: Category = {
        id: folder.id,
        name: folder.title,
        bookmarkIds: [],
        icon: "📁"
      };

      // 更新本地状态
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // 重置表单状态
      setNewCategoryName("");
      setIsAddingCategory(false);

      // 如果还没有选中的分类，将新创建的分类设为选中
      if (!selectedCategory) {
        setSelectedCategory(folder.id);
      }
    } catch (error) {
      console.error('创建书签分类失败:', error);
      alert('创建分类失败，请重试');
    }
  };

  // 编辑分类
  const startEditingCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发分类选择
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveEditingCategory = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (editingCategoryId && editingCategoryName.trim()) {
      setCategories(
        categories.map(cat =>
          cat.id === editingCategoryId
            ? { ...cat, name: editingCategoryName.trim() }
            : cat
        )
      );
      setEditingCategoryId(null);
      setEditingCategoryName("");
    }
  };

  // 删除分类
  const handleDeleteCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (window.confirm("确定要删除这个分类吗？相关书签将被移至未分类")) {
      // 更新书签，将被删除分类的书签设为未分类
      const updatedBookmarks = { ...bookmarks };
      Object.keys(updatedBookmarks).forEach(bookmarkId => {
        if (updatedBookmarks[bookmarkId].category === categoryId) {
          updatedBookmarks[bookmarkId] = {
            ...updatedBookmarks[bookmarkId],
            category: undefined
          };
        }
      });
      setBookmarks(updatedBookmarks);
      
      // 删除分类
      setCategories(categories.filter(cat => cat.id !== categoryId));
      
      // 如果删除的是当前选中的分类，则清除选中状态
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
      }
    }
  };

  // 处理标签页切换
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'categories' | 'smart');
    // 切换到智能标签页时，如果没有智能分类，则自动生成
    if (tab === 'smart' && smartCategories.length === 0) {
      generateSmartCategories();
    }
  };

  // 刷新智能分类 - 用户主动触发生成智能分类
  const handleRefreshSmartCategories = async () => {
    // 获取API设置状态
    const apiKey = useBookmarkStore.getState().apiKey;
    const apiUrl = useBookmarkStore.getState().apiUrl;
    
    // 如果正在加载中，点击则取消刷新
    if (isLoading) {
      // 调用取消生成方法
      useBookmarkStore.getState().cancelSmartCategoriesGeneration();
      alert('已取消智能分类生成');
      return;
    }
    
    // 检查是否有足够的书签数据
    const bookmarksCount = Object.keys(bookmarks).length;
    if (bookmarksCount === 0) {
      alert('没有书签数据，无法生成智能分类。请先添加一些书签。');
      return;
    }
    
    // 显示确认对话框
    if (confirm('确定要刷新智能分类吗？这将根据当前所有书签的标签和描述重新生成分类。')) {
      // 如果没有设置API，提示用户但仍然继续（会使用基于标签的回退方案）
      if (!apiKey || !apiUrl) {
        alert('注意：未设置AI API，将使用基本的标签分类方法。要获得更智能的分类，请在设置中配置API。');
      }
      
      try {
        // 调用生成智能分类方法
        await generateSmartCategories();
        
        // 检查是否有错误
        const currentError = useBookmarkStore.getState().error;
        if (currentError) {
          alert(`生成智能分类时出错: ${currentError}`);
          return;
        }
        
        // 成功生成分类后提示用户
        if (useBookmarkStore.getState().smartCategories.length > 0) {
          alert('智能分类已成功生成！');
        } else {
          alert('未能生成智能分类，可能是因为书签数据不足或没有足够的标签信息。');
        }
      } catch (error) {
        console.error('生成智能分类失败:', error);
        alert('生成智能分类失败，请检查控制台获取详细错误信息。');
      }
    }
  };

  // 获取当前显示的分类列表
  const currentCategories = activeTab === 'categories' ? categories : smartCategories;

  return (
    <aside
      className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col"
      data-oid="hpvpsv0"
    >
      <Tabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={[
          { id: 'categories', label: '分类' },
          { id: 'smart', label: '智能' }
        ]}
      />
      <div className="flex justify-between items-center p-4 flex-shrink-0">
        <h2
          className="text-lg font-semibold text-gray-700"
          data-oid="w89f:n9"
        >
          {activeTab === 'categories' ? '分类' : '智能分类'}
        </h2>
        <div className="flex items-center gap-1">
          {activeTab === 'categories' ? (
            <button 
              onClick={() => onAddCategory ? onAddCategory() : setIsAddingCategory(true)}
              className="p-1 hover:bg-gray-200 rounded-full" 
              title="添加分类"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={handleRefreshSmartCategories}
              className="p-1 hover:bg-gray-200 rounded-full" 
              title={isLoading ? "点击取消刷新" : "刷新智能分类"}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
      
      {/* 添加分类表单 */}
      {isAddingCategory && (
        <div className="mx-2 mb-2 p-2 border border-gray-200 rounded-md bg-gray-100 flex-shrink-0">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="输入分类名称"
            className="w-full px-2 py-1 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              确认
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName("");
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      <nav className="flex-1 overflow-y-auto space-y-1 px-2 max-h-[calc(100vh-8rem)] custom-scrollbar overflow-x-hidden" data-oid="pcd:n-h">
        {/* 确保未分类文件夹始终显示在智能标签页中 */}
        {currentCategories.map((category) => (
          <div 
            key={category.id}
            className={`group flex items-center justify-between w-full px-3 py-2 ${selectedCategory === category.id ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors`}
          >
            {editingCategoryId === category.id ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => saveEditingCategory(e)}
                  disabled={!editingCategoryName.trim()}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="保存"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategoryId(null);
                    setEditingCategoryName("");
                  }}
                  className="p-1 text-gray-600 hover:text-gray-800"
                  title="取消"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  className="flex items-center gap-2 flex-grow text-left"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {activeTab !== 'smart' && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `hsl(${parseInt(category.id) * 137 % 360}, 70%, 50%)` }}
                    />
                  )}
                  {activeTab === 'smart' && (
                    <span className="text-sm ml-1 mr-0.5">{category.icon || '🏷️'}</span>
                  )}
                  <span className="font-inherit" data-oid="5o4mv35">
                    {category.name}
                  </span>
                </button>
                {activeTab === 'categories' && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => startEditingCategory(category, e)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="编辑分类"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {currentCategories.length === 0 && (
          <div className="p-3 text-center text-gray-500 text-sm">
            {activeTab === 'categories' 
              ? '暂无分类，请添加' 
              : '暂无智能分类，正在生成...'}
          </div>
        )}
      </nav>
    </aside>
  );
};
