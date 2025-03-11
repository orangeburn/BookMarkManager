import React, { useState } from "react";
import { useAtom } from "jotai";
import { selectedCategoryIdAtom, categoriesAtom } from "../mockData";
import { Category } from "../types";
import { useBookmarkStore } from "../store/bookmarkStore";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";

const CategoryList: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useAtom(selectedCategoryIdAtom);
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const { bookmarks, setBookmarks } = useBookmarkStore();

  // 处理拖拽结束事件
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    // 处理跨列表的拖拽（改变分类）
    if (destination.droppableId.startsWith('category-')) {
      const categoryId = destination.droppableId.replace('category-', '');
      const newBookmarks = { ...bookmarks };
      
      if (newBookmarks[draggableId]) {
        newBookmarks[draggableId] = {
          ...newBookmarks[draggableId],
          categoryId: parseInt(categoryId)
        };
        setBookmarks(newBookmarks);
        console.log(`书签 ${draggableId} 已移动到分类 ${categoryId}`);
      }
    }
  };

  // 移除拖拽状态
  // const [isDragOver, setIsDragOver] = useState<string | null>(null);

  // 移除处理拖拽进入分类
  // const handleDragEnter = (e: React.DragEvent, categoryId: number) => {
  //   e.preventDefault();
  //   setIsDragOver(String(categoryId));
  //   // 添加拖拽悬停效果
  //   if (e.currentTarget instanceof HTMLElement) {
  //     e.currentTarget.style.backgroundColor = '#e5e7eb';
  //     e.currentTarget.style.transition = 'background-color 0.2s';
  //   }
  // };

  // const handleDragLeave = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragOver(null);
  //   // 移除拖拽悬停效果
  //   if (e.currentTarget instanceof HTMLElement) {
  //     e.currentTarget.style.backgroundColor = '';
  //   }
  // };

  // const handleDrop = (e: React.DragEvent, categoryId: number) => {
  //   e.preventDefault();
  //   const bookmarkId = e.dataTransfer.getData('bookmarkId');
  //   if (bookmarkId && bookmarks[bookmarkId]) {
  //     const newBookmarks = { ...bookmarks };
  //     newBookmarks[bookmarkId] = {
  //       ...newBookmarks[bookmarkId],
  //       category: String(categoryId)
  //     };
  //     setBookmarks(newBookmarks);
  //   }
  //   setIsDragOver(null);
  //   // 移除拖拽悬停效果
  //   if (e.currentTarget instanceof HTMLElement) {
  //     e.currentTarget.style.backgroundColor = '';
  //   }
  // };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSave = () => {
    if (editingId && editingName.trim()) {
      setCategories(categories.map(cat =>
        cat.id === editingId ? { ...cat, name: editingName.trim() } : cat
      ));
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id: number) => {
    if (window.confirm("确定要删除这个分类吗？删除后，该分类下的所有书签将被移至"未分类"。")) {
      setCategories(categories.filter(cat => cat.id !== id));
      
      const updatedBookmarks = { ...bookmarks };
      Object.keys(updatedBookmarks).forEach(bookmarkId => {
        if (updatedBookmarks[bookmarkId].categoryId === id) {
          updatedBookmarks[bookmarkId] = {
            ...updatedBookmarks[bookmarkId],
            categoryId: 0
          };
        }
      });
      setBookmarks(updatedBookmarks);
      
      if (selectedCategoryId === id) {
        const remainingCategories = categories.filter(cat => cat.id !== id);
        if (remainingCategories.length > 0) {
          setSelectedCategoryId(remainingCategories[0].id);
        } else {
          setSelectedCategoryId(null);
        }
      }
    }
  };

  return (
    <div
      className="w-64 h-full bg-gray-100 p-4 overflow-y-auto"
      data-oid="eyxo_-."
    >
      <h2 className="text-xl font-bold mb-4 text-gray-800" data-oid="zsmq:hv">
        书签分类
      </h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <ul className="space-y-2" data-oid="wj3kv_d">
          {categories.map((category) => (
            <Droppable 
              key={category.id} 
              droppableId={`category-${category.id}`} 
              type="BOOKMARK"
            >
              {(provided, snapshot) => (
                <li
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  key={category.id}
                  className={`
                    group
                    flex items-center p-3 rounded-lg
                    transition-all duration-200
                    ${selectedCategoryId === category.id
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                    }
                    ${snapshot.isDraggingOver 
                      ? "bg-blue-100 border-2 border-dashed border-blue-400 scale-105" 
                      : "border-2 border-transparent"}
                    cursor-pointer
                  `}
                  onClick={() => setSelectedCategoryId(category.id)}
                  data-oid="fyqwi.v"
                >
                  <span className="text-xl mr-3" data-oid="w_xgw37">
                    {category.icon}
                  </span>
                  {editingId === category.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-transparent outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave();
                        }}
                        className="text-sm text-green-500 hover:text-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel();
                        }}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="flex-1">{category.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                          }}
                          className="text-sm text-gray-500 hover:text-blue-600"
                        >
                          编辑
                        </button>
                        {category.id !== 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(category.id);
                            }}
                            className="text-sm text-gray-500 hover:text-red-600"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {provided.placeholder}
                </li>
              )}
            </Droppable>
          ))}
        </ul>
      </DragDropContext>
    </div>
  );
};

export default CategoryList;
