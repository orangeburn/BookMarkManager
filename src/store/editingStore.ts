import { create } from 'zustand';

interface EditingState {
  isEditing: boolean;
  editingId: string | null;
  setEditing: (isEditing: boolean, id?: string | null) => void;
  handleEnterKey: (callback: () => void) => void;
  confirmEdit: () => void;
}

export const useEditingStore = create<EditingState>((set) => ({
  isEditing: false,
  editingId: null,
  setEditing: (isEditing: boolean, id: string | null = null) => {
    set({ isEditing, editingId: id });
  },
  handleEnterKey: (callback: () => void) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  },
  confirmEdit: () => {
    set({ isEditing: false, editingId: null });
  },
}));