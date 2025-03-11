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

  // 添加新分类
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(), // 简单生成唯一ID
        name: newCategoryName.trim(),
        bookmarkIds: []
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  // 编辑分类
  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveEditingCategory = () => {
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

  // 删除确认弹层状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDeleteId(categoryId);
    setDeleteConfirmOpen(true);
  };

  // 确认删除
  const handleDeleteConfirm = () => {
    if (!categoryToDeleteId) return;

    // 获取要删除的分类下的所有书签
    const categoryToDelete = categories.find(cat => cat.id === categoryToDeleteId);
    if (!categoryToDelete) return;

    // 更新书签，将被删除分类的书签设为未分类
    const updatedBookmarks = { ...bookmarks };
    categoryToDelete.bookmarkIds.forEach(bookmarkId => {
      if (updatedBookmarks[bookmarkId]) {
        updatedBookmarks[bookmarkId] = {
          ...updatedBookmarks[bookmarkId],
          category: undefined
        };
      }
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
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDeleteId(null);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
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
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入分类名称"
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
                  onChange={(e) => setEditingCategoryName(e.target.value)}
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
                  <Folder className="h-4 w-4 text-blue-600" />
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