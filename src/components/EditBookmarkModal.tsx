import React from 'react';
import { X, Wand2 } from 'lucide-react';
import { Category } from '../types';
import { Bookmark } from '../types/bookmark';
import { generateTagsAndSummary } from '../api/ai';
import { useBookmarkStore } from '../store/bookmarkStore';

interface EditBookmarkModalProps {
  bookmark: Bookmark;
  onSubmit: (title: string, url: string, tags: string[], summary: string, category: string) => void;
  onCancel: () => void;
  categories: Category[];
}

export const EditBookmarkModal: React.FC<EditBookmarkModalProps> = ({ bookmark, onSubmit, onCancel, categories }) => {
  console.log("EditBookmarkModal received bookmark:", bookmark);
  const [title, setTitle] = React.useState(bookmark.title);
  const [url, setUrl] = React.useState(bookmark.url);
  const [tags, setTags] = React.useState(bookmark.tags?.join(',') || '');
  const [summary, setSummary] = React.useState(bookmark.summary || '');
  const [category, setCategory] = React.useState(bookmark.category || '');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const apiKey = useBookmarkStore(state => state.apiKey);
  const apiUrl = useBookmarkStore(state => state.apiUrl);
  const selectedModel = useBookmarkStore(state => state.selectedModel);
  const useWebCrawler = useBookmarkStore(state => state.useWebCrawler);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 处理标签，确保标签直接绑定到书签对象
    // 根据标签内容判断长度限制：中文不超过7个字符，英文不超过14个字符
    const processedTags = tags.split(/[,，]/).map(tag => tag.trim()).filter(tag => {
      if (tag.length === 0) return false;
      // 检查标签是否包含中文字符
      const hasChinese = /[\u4e00-\u9fa5]/.test(tag);
      // 中文标签最多7个字符，英文标签最多14个字符
      return hasChinese ? tag.length <= 7 : tag.length <= 14;
    }).slice(0, 5);
    onSubmit(
      title,
      url,
      processedTags, // 直接将处理好的标签数组传递给onSubmit
      summary,
      category
    );
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 过滤特殊字符，只保留字母、数字、中文字符和基本标点
    let newTags = e.target.value;
    newTags = newTags.replace(/[^a-zA-Z0-9\s.,;:"'?!，。；："'？！\-\u4e00-\u9fa5]/g, '');
    
    const tagCount = newTags.split(/[,，]/).filter(tag => tag.trim().length > 0).length;
    if (tagCount <= 5) {
      setTags(newTags);
    }
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 过滤特殊字符，只保留字母、数字、中文字符和基本标点
    let newSummary = e.target.value;
    newSummary = newSummary.replace(/[^a-zA-Z0-9\s.,;:"'?!，。；："'？！\-\u4e00-\u9fa5]/g, '');
    
    // 根据语言类型判断长度限制：中文不超过25个字，英文不超过50个字母
    const chineseChars = newSummary.match(/[\u4e00-\u9fa5]/g) || [];
    const otherChars = newSummary.replace(/[\u4e00-\u9fa5]/g, '').length;
    
    // 如果包含中文，则总长度不超过25；如果全是英文，则不超过50
    if ((chineseChars.length > 0 && newSummary.length <= 25) || 
        (chineseChars.length === 0 && newSummary.length <= 50)) {
      setSummary(newSummary);
    }
  };

  const handleGenerateAI = async () => {
    if (!apiKey) {
      alert('请先在设置中配置OpenAI API密钥');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateTagsAndSummary(
        { ...bookmark, title, url }, 
        apiKey, 
        apiUrl, 
        selectedModel,
        useWebCrawler // 传递是否使用网页爬虫的设置
      );
      setTags(result.tags.join(','));
      setSummary(result.summary);
    } catch (error) {
      console.error('生成标签和描述失败:', error);
      alert('生成标签和描述失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4">编辑书签</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              标签（用逗号分隔，最多5个，中文标签不超过7个字符，英文标签不超过14个字符）
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={handleTagsChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Wand2 size={16} className="mr-1" />
                {isGenerating ? '生成中...' : 'AI生成'}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
              摘要（中文不超过25个字，英文不超过50个字母）
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={handleSummaryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};