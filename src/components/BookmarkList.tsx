import React from "react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { ExternalLink, Edit2, Trash2 } from "lucide-react";
import { EditBookmarkModal } from "./EditBookmarkModal";
import { ConfirmModal } from "./ConfirmModal";
import { Bookmark } from "../types/bookmark";

type BookmarkFormData = Pick<Bookmark, 'title' | 'url' | 'tags' | 'summary' | 'category'>;

const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch (e) {
    return "";
  }
};

export const BookmarkList: React.FC = () => {
  const { bookmarks, viewMode, selectedCategory, setBookmarks, searchQuery, categories } =
    useBookmarkStore();

  const [editingBookmark, setEditingBookmark] = React.useState<string | null>(null);
  const [deletingBookmark, setDeletingBookmark] = React.useState<string | null>(null);

  const filteredBookmarks = React.useMemo(() => {
    let filtered = Object.values(bookmarks);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((bookmark) => {
        return (
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(query))) ||
          (bookmark.summary && bookmark.summary.toLowerCase().includes(query))
        );
      });
    }

    if (!searchQuery && selectedCategory) {
      filtered = filtered.filter(
        (bookmark) => bookmark.category === selectedCategory,
      );
    }

    return filtered;
  }, [bookmarks, selectedCategory, searchQuery]);

  const handleEdit = (bookmarkId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingBookmark(bookmarkId);
  };

  const handleSave = (data: BookmarkFormData) => {
    if (editingBookmark) {
      const newBookmarks = { ...bookmarks };
      newBookmarks[editingBookmark] = {
        ...bookmarks[editingBookmark],
        ...data
      };
      setBookmarks(newBookmarks);
      setEditingBookmark(null);
    }
  };

  const handleDelete = (bookmarkId: string) => {
    setDeletingBookmark(bookmarkId);
  };

  const confirmDelete = () => {
    if (deletingBookmark) {
      const newBookmarks = { ...bookmarks };
      delete newBookmarks[deletingBookmark];
      setBookmarks(newBookmarks);
      setDeletingBookmark(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="relative bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={getFaviconUrl(bookmark.url)}
                  alt=""
                  className="w-4 h-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold flex-grow pr-20 hover:text-blue-600"
                >
                  {bookmark.title}
                </a>
              </div>
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bookmark.id, e);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {bookmark.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {bookmark.summary && (
              <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto">
                {bookmark.summary?.slice(0, 25)}
              </p>
            )}
          </div>
        ))}
      </div>

      {editingBookmark && (
        <EditBookmarkModal
          isOpen={!!editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSave={handleSave}
          initialData={{
            title: bookmarks[editingBookmark].title,
            url: bookmarks[editingBookmark].url,
            tags: bookmarks[editingBookmark].tags || [],
            summary: bookmarks[editingBookmark].summary || '',
            category: bookmarks[editingBookmark].category || ''
          }}
        />
      )}
      <ConfirmModal
        isOpen={!!deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
        onConfirm={confirmDelete}
        title="删除书签"
        message="确定要删除这个书签吗？此操作无法撤销。"
      />
    </>
  );
};
