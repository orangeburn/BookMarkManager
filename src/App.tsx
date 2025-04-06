import React, { useEffect, useState, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BookmarkList } from './components/BookmarkList';
import { SettingsModal } from './components/SettingsModal';
import { CategoryModal } from './components/CategoryModal';
import { useBookmarkStore } from './store/bookmarkStore';
import { useEditingStore } from './store/editingStore';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('应用错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">应用加载出错</h2>
            <p className="text-gray-600">请刷新页面重试</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingSpinner() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
    </div>
  );
}

function App() {
  const loadBookmarks = useBookmarkStore(state => state.loadBookmarks);
  const { isEditing, confirmEdit } = useEditingStore();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <div className="h-screen w-full flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar onAddCategory={() => setIsCategoryModalOpen(true)} />
            <main className="flex-1 bg-gray-50 overflow-hidden">
              <BookmarkList />
            </main>
          </div>
          <SettingsModal />
          <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;