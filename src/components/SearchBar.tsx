import React from 'react';
import { Search } from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useBookmarkStore();

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5"
      />
      <input
        type="text"
        placeholder="搜索书签..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
    </div>
  );
};