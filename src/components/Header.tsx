import React from "react";
import { Search, Globe } from "lucide-react";
import { useBookmarkStore } from "../store/bookmarkStore";

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery } = useBookmarkStore();

  return (
    <header className="bg-white shadow-sm px-6 py-4" data-oid="x3noin6">
      <div className="flex items-center justify-between" data-oid="otoa71v">
        <h1 className="text-2xl font-bold text-gray-800" data-oid="7fk:6he">
          书签管理器
        </h1>
        <div className="flex items-center gap-4" data-oid="2mdde2i">
          <div className="relative" data-oid="yo46djq">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5"
              data-oid="tlqj4iw"
            />

            <input
              type="text"
              placeholder="搜索书签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              data-oid="cqwfg3u"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
