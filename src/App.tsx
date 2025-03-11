import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookmarkList } from './components/BookmarkList';
import { SettingsModal } from './components/SettingsModal';
import { useBookmarkStore } from './store/bookmarkStore';
import { useEditingStore } from './store/editingStore';

function App() {
  const loadBookmarks = useBookmarkStore(state => state.loadBookmarks);
  const { isEditing, confirmEdit } = useEditingStore();

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.isComposing && isEditing) {
        confirmEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, confirmEdit]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <BookmarkList />
        </main>
      </div>
      <SettingsModal />
    </div>
  );
}

export default App;