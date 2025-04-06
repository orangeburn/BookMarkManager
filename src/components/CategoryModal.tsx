import React, { useState, useEffect } from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { Plus, X } from "lucide-react";
import { Category } from "../types/bookmark";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { categories, setCategories, setSelectedCategory } = useBookmarkStore();
  
  // 状态管理
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 重置表单状态
  useEffect(() => {
    if (isOpen) {
      setNewCategoryName("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 计算字符串长度（中文算2个字符，其他算1个字符）
  const calculateStringLength = (str: string): number => {
    return str.split('').reduce((total, char) => {
      return total + (/[^\x00-\xff]/.test(char) ? 2 : 1);
    }, 0);
  };

  // 过滤特殊字符，只保留字母、数字、中文和基本标点符号
  const filterSpecialChars = (str: string): string => {
    // 允许字母、数字、中文、空格和常用标点符号
    return str.replace(/[^\w\s\u4e00-\u9fa5.,，。!！?？:：;；"'"()（）\[\]【】\-]/g, "");
  };

  // 验证输入长度
  const validateInput = (value: string): boolean => {
    return calculateStringLength(value) <= 20;
  };

  // 添加新分类
  const handleAddCategory = async () => {
    setError(null);
    // 先过滤特殊字符，再去除首尾空格
    const filteredName = filterSpecialChars(newCategoryName);
    const trimmedName = filteredName.trim();
    if (!trimmedName) {
      setError('请输入分类名称');
      return;
    }

    if (!validateInput(trimmedName)) {
      setError('分类名称过长，请控制在10个中文或20个英文字符以内');
      return;
    }

    // 检查分类名称是否重复
    if (categories.some(cat => cat.name === trimmedName)) {
      setError('该分类名称已存在，请使用其他名称');
      return;
    }

    setIsSubmitting(true);

    try {
      // 使用Chrome API创建书签文件夹
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        console.log('开始创建书签分类:', trimmedName);
        
        // 检查Chrome API是否正确初始化
        if (!chrome.runtime) {
          console.error('Chrome runtime API不可用');
          throw new Error('浏览器扩展API不可用，请刷新页面重试');
        }
        
        // 检查parentId是否有效
        const parentId = '2'; // 在其他书签中创建
        console.log('使用的父文件夹ID:', parentId);
        
        try {
          const folder = await chrome.bookmarks.create({
            title: trimmedName,
            parentId: parentId
          });
          
          console.log('Chrome API返回的文件夹信息:', folder);
          
          if (!folder || !folder.id) {
            throw new Error('创建书签文件夹失败：返回的文件夹信息无效');
          }

          const newCategory: Category = {
            id: folder.id,
            name: folder.title,
            bookmarkIds: [],
            icon: "📁"
          };

          // 更新本地状态
          const updatedCategories = [...categories, newCategory];
          setCategories(updatedCategories);

          // 如果还没有选中的分类，将新创建的分类设为选中
          if (!useBookmarkStore.getState().selectedCategory) {
            setSelectedCategory(folder.id);
          }
          
          // 关闭模态框
          onClose();

          console.log('分类创建成功:', newCategory);
        } catch (apiError) {
          console.error('Chrome bookmarks API调用失败:', apiError);
          if (chrome.runtime.lastError) {
            console.error('Chrome API错误详情:', chrome.runtime.lastError);
            throw new Error(`创建分类失败: ${chrome.runtime.lastError.message || '未知错误'}`);
          }
          throw apiError;
        }
      } else {
        console.error('Chrome bookmarks API不可用');
        throw new Error('浏览器扩展API不可用，请确保在Chrome扩展环境中运行');
      }
    } catch (error) {
      console.error('创建书签分类失败:', error);
      // 提供更具体的错误信息给用户
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`创建分类失败: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">添加分类</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
            分类名称
          </label>
          <input
            id="categoryName"
            type="text"
            value={newCategoryName}
            onChange={(e) => {
              const value = e.target.value;
              // 只检查长度限制，不限制输入的文本类型
              if (validateInput(value)) {
                setNewCategoryName(value);
              }
            }}
            placeholder="输入分类名称（最多10个中文或20个英文字符）"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            disabled={isSubmitting}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
          >
            {isSubmitting ? (
              <span>处理中...</span>
            ) : (
              <>
                <Plus size={16} />
                添加
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};