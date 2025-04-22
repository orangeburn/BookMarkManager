import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';

export const ModelSettings: React.FC = () => {
  const { 
    setSettingsOpen,
    selectedModel
  } = useBookmarkStore();
  
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  return (
    <div className="relative">
      <button
        className="p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center"
        onClick={handleOpenSettings}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <Settings className="h-5 w-5 text-gray-600" />
      </button>
      
      {isTooltipVisible && (
        <div className="absolute right-0 mt-2 py-1 px-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
          {selectedModel ? `当前模型: ${selectedModel}` : '设置AI模型'}
        </div>
      )}
    </div>
  );
};