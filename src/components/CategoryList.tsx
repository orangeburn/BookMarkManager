import React, { useState, useMemo } from "react";
import { Category } from "../types/bookmark";
import { useBookmarkStore } from "../store/bookmarkStore";
import { useBookmarkStore } from "../store/bookmarkStore";
import { DndContext, DragEndEvent, useSensors, useSensor, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2 } from "lucide-react";

const generateUniqueColor = (id: number) => {
  const hue = (id * 137) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const truncateText = (text: string, maxLength = 5) => {
  let count = 0;
  return text.split("").reduce((acc, char) => {
    count += char.match(/[一-龥]/) ? 1 : 0.5;
    return count <= maxLength ? acc + char : acc;
  }, "") + (count > maxLength ? "…" : "");
};

const SortableCategory = ({ category, isSelected, onSelect, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id.toString()
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0
  };

  const categoryColor = useMemo(() => generateUniqueColor(category.id), [category.id]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center p-3 rounded-lg transition-all duration-200
        ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-200 text-gray-700"}
        ${isDragging ? "opacity-50" : ""}
        cursor-pointer
      `}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="mr-2 cursor-grab active:cursor-grabbing text-gray-500"
      >
        <GripVertical size={16} />
      </div>
      <div
        className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      />
      <div className="flex flex-1 items-center justify-between min-w-0 max-w-[calc(100%-3rem)]">
        <span className="flex-1 truncate mr-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
          {truncateText(category.name)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className="text-sm text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </li>
  );
};

const CategoryList: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, setCategories } = useBookmarkStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { bookmarks } = useBookmarkStore();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(cat => cat.id.toString() === active.id);
    const newIndex = categories.findIndex(cat => cat.id.toString() === over.id);

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, movedCategory);

    setCategories(newCategories);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="w-64 flex-1 bg-gray-100 p-4 custom-scrollbar overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">书签分类</h2>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(cat => cat.id.toString())} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2 overflow-y-auto" style={{ height: 'calc(100% - 96.25px)' }}>
              {categories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onSelect={() => setSelectedCategory(category.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default CategoryList;
