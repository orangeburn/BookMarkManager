import React from "react";
import { Globe } from "lucide-react";
import { useBookmarkStore } from "../store/bookmarkStore";
import { SearchBar } from "./SearchBar";
import { ModelSettings } from "./ModelSettings";

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          书签管理器
        </h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <ModelSettings />
        </div>
      </div>
    </header>
  );

};
