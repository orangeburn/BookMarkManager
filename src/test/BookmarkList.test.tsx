import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookmarkList } from '../components/BookmarkList';
import { useBookmarkStore } from '../store/bookmarkStore';

// Mock zustand store
vi.mock('../store/bookmarkStore', () => ({
  useBookmarkStore: vi.fn()
}));

describe('BookmarkList', () => {
  const mockBookmarks = {
    '1': {
      id: '1',
      title: 'Test Bookmark',
      url: 'https://test.com',
      dateAdded: Date.now(),
      category: '0',
      icon: 'test-icon.png',
      tags: ['test', 'example']
    }
  };

  it('should render bookmarks in card view', () => {
    (useBookmarkStore as any).mockImplementation(() => ({
      bookmarks: mockBookmarks,
      viewMode: 'card'
    }));

    render(<BookmarkList />);

    // 验证卡片视图渲染
    expect(screen.getByText('Test Bookmark')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://test.com');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-icon.png');
    
    // 验证标签渲染
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('should render bookmarks in list view', () => {
    (useBookmarkStore as any).mockImplementation(() => ({
      bookmarks: mockBookmarks,
      viewMode: 'list'
    }));

    render(<BookmarkList />);

    // 验证列表视图渲染
    expect(screen.getByText('Test Bookmark')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://test.com');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-icon.png');

    // 验证标签渲染
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('should handle empty bookmarks', () => {
    (useBookmarkStore as any).mockImplementation(() => ({
      bookmarks: {},
      viewMode: 'card'
    }));

    const { container } = render(<BookmarkList />);
    
    // 验证空书签列表渲染
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should apply correct grid layout in card view', () => {
    (useBookmarkStore as any).mockImplementation(() => ({
      bookmarks: mockBookmarks,
      viewMode: 'card'
    }));

    const { container } = render(<BookmarkList />);
    
    // 验证卡片视图网格布局
    expect(container.firstChild).toHaveClass('grid');
    expect(container.firstChild).toHaveClass('grid-cols-1');
    expect(container.firstChild).toHaveClass('md:grid-cols-2');
    expect(container.firstChild).toHaveClass('lg:grid-cols-3');
  });

  it('should apply correct layout in list view', () => {
    (useBookmarkStore as any).mockImplementation(() => ({
      bookmarks: mockBookmarks,
      viewMode: 'list'
    }));

    const { container } = render(<BookmarkList />);
    
    // 验证列表视图布局
    expect(container.firstChild).toHaveClass('space-y-2');
  });
});