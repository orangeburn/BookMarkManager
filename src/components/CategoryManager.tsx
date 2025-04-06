import React, { useState } from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { Folder, Plus, Edit2, Trash2 } from "lucide-react";
import { Category } from "../types/bookmark";

export const CategoryManager: React.FC = () => {
  const { categories, setCategories, bookmarks, setBookmarks } = useBookmarkStore();
  
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
      if (!useBookmarkStore.getState().selectedCategory) {
        useBookmarkStore.getState().setSelectedCategory(folder.id);
      }
    } catch (error) {
      console.error('创建书签分类失败:', error);
      alert('创建分类失败，请重试');
    }
  };

  // 编辑分类
  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveEditingCategory = async () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      try {
        // 使用Chrome API更新书签文件夹
        await chrome.bookmarks.update(editingCategoryId, {
          title: editingCategoryName.trim()
        });

        setCategories(
          categories.map(cat =>
            cat.id === editingCategoryId
              ? { ...cat, name: editingCategoryName.trim() }
              : cat
          )
        );
        setEditingCategoryId(null);
        setEditingCategoryName("");
      } catch (error) {
        console.error('更新书签分类失败:', error);
        alert('更新分类失败，请重试');
      }
    }
  };

  // 删除确认弹层状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    // 检查是否为'未分类'项
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    if (categoryToDelete?.name === '未分类') {
      alert('默认分类"未分类"不能删除');
      return;
    }
    setCategoryToDeleteId(categoryId);
    setDeleteConfirmOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!categoryToDeleteId) return;

    try {
      // 获取要删除的分类下的所有书签
      const categoryToDelete = categories.find(cat => cat.id === categoryToDeleteId);
      if (!categoryToDelete) return;

      // 获取分类下的所有书签
      const bookmarksToMove = Object.values(bookmarks).filter(bookmark => bookmark.category === categoryToDeleteId);

      // 将书签移动到'其他书签'分类下
      for (const bookmark of bookmarksToMove) {
        try {
          await chrome.bookmarks.move(bookmark.id, {
            parentId: '2' // Chrome API的'其他书签'分类ID
          });
        } catch (error) {
          console.error(`移动书签失败: ${bookmark.title}`, error);
        }
      }

      // 删除空的分类文件夹
      await chrome.bookmarks.removeTree(categoryToDeleteId);

      // 更新本地状态
      const updatedBookmarks = { ...bookmarks };
      bookmarksToMove.forEach(bookmark => {
        updatedBookmarks[bookmark.id] = {
          ...bookmark,
          category: '2' // 更新为'其他书签'分类
        };
      });
      setBookmarks(updatedBookmarks);
      
      // 删除分类
      setCategories(categories.filter(cat => cat.id !== categoryToDeleteId));

      // 如果当前选中的是被删除的分类，清除选中状态
      if (useBookmarkStore.getState().selectedCategory === categoryToDeleteId) {
        useBookmarkStore.getState().setSelectedCategory(null);
      }

      // 关闭确认弹层
      setDeleteConfirmOpen(false);
      setCategoryToDeleteId(null);
    } catch (error) {
      console.error('删除书签分类失败:', error);
      alert('删除分类失败，请重试');
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDeleteId(null);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">分类管理</h2>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isAddingCategory}
        >
          <Plus size={16} />
          添加分类
        </button>
      </div>

      {/* 添加分类表单 */}
      {isAddingCategory && (
        <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                const value = e.target.value;
                if (validateInput(value)) {
                  setNewCategoryName(value);
                }
              }}
              placeholder="输入分类名称（最多10个中文或20个英文字符）"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              确认
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName("");
              }}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 分类列表 */}
      <ul className="space-y-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 group"
          >
            {editingCategoryId === category.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (validateInput(value)) {
                      setEditingCategoryName(value);
                    }
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={saveEditingCategory}
                  disabled={!editingCategoryName.trim()}
                  className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditingCategoryId(null);
                    setEditingCategoryName("");
                  }}
                  className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ pointerEvents: 'all' }}>
                  <button
                    onClick={() => startEditingCategory(category)}
                    className="p-1 text-gray-600 hover:text-blue-600"
                    title="编辑分类"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="删除分类"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && (
          <li className="p-3 text-center text-gray-500">暂无分类，请添加</li>
        )}
      </ul>

      {/* 删除确认弹层 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这个分类吗？该分类下的所有书签将被移至未分类。</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};