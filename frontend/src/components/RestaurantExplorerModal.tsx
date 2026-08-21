import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import type { Restaurant } from '../types';
import { fetchRestaurants } from '../api';
import { RestaurantCard } from './RestaurantCard';

interface RestaurantExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantExplorerModal: React.FC<RestaurantExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectRestaurant,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchRestaurants()
        .then(setRestaurants)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);
  // U2: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cuisines = useMemo(
    () => Array.from(new Set(restaurants.flatMap((r) => r.cuisine_types || r.cuisines || []))).sort(),
    [restaurants]
  );

  const neighborhoods = useMemo(
    () => Array.from(new Set(restaurants.map((r) => r.neighborhood).filter((n): n is string => Boolean(n)))).sort(),
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const cList = (r.cuisine_types || r.cuisines || []).map((c) => c.toLowerCase());
      const matchesCuisine =
        selectedCuisine === 'all' || cList.includes(selectedCuisine.toLowerCase());
      const matchesNeighborhood =
        selectedNeighborhood === 'all' ||
        (r.neighborhood && r.neighborhood.toLowerCase() === selectedNeighborhood.toLowerCase());

      const s = search.toLowerCase().trim();
      const matchesSearch =
        !s ||
        r.name.toLowerCase().includes(s) ||
        (r.description && r.description.toLowerCase().includes(s)) ||
        (r.popular_dishes && r.popular_dishes.some((d) => d.toLowerCase().includes(s)));

      return matchesCuisine && matchesNeighborhood && matchesSearch;
    });
  }, [restaurants, search, selectedCuisine, selectedNeighborhood]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="bg-neo-card border-3 border-black shadow-neo-xl rounded-neo-lg w-full max-w-5xl max-h-[90vh] flex flex-col my-auto overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-neo-blue border-b-3 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-neo-card border-2 border-black flex items-center justify-center rounded-neo-sm font-bold text-base">
              🏢
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black leading-none">
                Restaurant Directory
              </h2>
              <p className="text-xs font-bold text-black mt-0.5">
                Explore all {restaurants.length} GoodFoods network locations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 bg-neo-card hover:bg-neo-yellow border-2 border-black flex items-center justify-center rounded-neo-sm text-neo-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 bg-neo-card border-b-2 border-black space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neo-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by restaurant name, dish (e.g. Pad Thai, Truffle Pasta)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-mono text-xs font-bold placeholder:text-neo-muted focus:outline-none focus:bg-neo-card"
              />
            </div>

            {/* Neighborhood Filter */}
            <div className="sm:w-52">
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full py-2 px-2.5 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-mono text-xs font-bold focus:outline-none"
              >
                <option value="all">📍 All Neighborhoods</option>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuisine Pill Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-mono font-bold text-neo-main text-[11px] uppercase shrink-0">
              Cuisines:
            </span>
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-2.5 py-1 border border-black font-mono font-bold shrink-0 text-[11px] rounded-neo-sm transition-all ${selectedCuisine === 'all' ? 'bg-neo-yellow text-black shadow-neo-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
            >
              ALL
            </button>
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                className={`px-2.5 py-1 border border-black font-mono font-bold shrink-0 text-[11px] rounded-neo-sm transition-all ${selectedCuisine === c ? 'bg-neo-yellow text-black shadow-neo-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Cards Grid Container */}
        <div className="flex-1 p-4 overflow-y-auto bg-neo-canvas">
          {loading ? (
            <div className="py-16 text-center font-mono font-bold">
              <div className="inline-block p-4 bg-neo-card border-2 border-black rounded-neo shadow-neo text-neo-main">
                ⏳ Loading restaurant locations...
              </div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block p-6 bg-neo-card border-2 border-black rounded-neo shadow-neo max-w-md">
                <p className="font-black text-base uppercase text-neo-main">No restaurants match your search</p>
                <p className="text-xs text-neo-muted mt-1">Try clearing filters or searching for another keyword.</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCuisine('all');
                    setSelectedNeighborhood('all');
                  }}
                  className="btn-neo bg-neo-yellow text-black px-4 py-1.5 text-xs mt-3 font-bold uppercase"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onSelect={(r) => {
                    onSelectRestaurant(r);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-neo-card border-t-2 border-black p-3 flex items-center justify-between text-xs font-mono text-neo-main">
          <span>Showing {filteredRestaurants.length} of {restaurants.length} locations</span>
          <button
            onClick={onClose}
            className="btn-neo bg-black text-white border-black px-4 py-1.5 font-mono uppercase text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
