import React from 'react';
import { 
  LayoutGrid,
  MapPin
} from 'lucide-react';

interface CategoryFilterProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  viewMode: 'grid' | 'map';
  setViewMode: (mode: 'grid' | 'map') => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-1">
        
        {/* View Mode Toggle & Sort dropdown */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          
          {/* Grid vs Map Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[11px] transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[11px] transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>Harita</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline text-[11px]">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 font-semibold text-[11px] cursor-pointer shadow-2xs"
            >
              <option value="score-desc" className="bg-white dark:bg-slate-800">En Yüksek Puan (Sporpuan)</option>
              <option value="reviews-desc" className="bg-white dark:bg-slate-800">En Çok Yorum Alanlar</option>
              <option value="date-asc" className="bg-white dark:bg-slate-800">Yaklaşan Etkinlikler</option>
              <option value="title-asc" className="bg-white dark:bg-slate-800">A-Z İsim</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
};
