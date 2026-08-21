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
        .then((data) => setRestaurants(data))
        .catch((err) => console.error('Failed to fetch restaurants:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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
      const name = r.name || '';
      const desc = r.description || '';
      const dishes = r.popular_dishes || [];
      const rCuisines = r.cuisine_types || r.cuisines || [];
      const rNeighborhood = r.neighborhood || '';

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase()) ||
        dishes.some((d) => d.toLowerCase().includes(search.toLowerCase()));

      const matchesCuisine =
        selectedCuisine === 'all' || rCuisines.includes(selectedCuisine);

      const matchesNeighborhood =
        selectedNeighborhood === 'all' || rNeighborhood === selectedNeighborhood;

      return matchesSearch && matchesCuisine && matchesNeighborhood;
    });
  }, [restaurants, search, selectedCuisine, selectedNeighborhood]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#FAF8F5] border-3 border-black shadow-neo-xl rounded-neo-lg w-full max-w-5xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="bg-neo-blue border-b-3 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-bold">
              🏢
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black leading-none">
                Restaurant Directory
              </h2>
              <p className="text-xs font-bold text-gray-800 mt-0.5">
                Explore all {restaurants.length} GoodFoods network locations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-white hover:bg-neo-yellow border-2 border-black rounded-neo-sm flex items-center justify-center font-black shadow-neo-sm"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 bg-white border-b-2 border-black space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by restaurant name, dish (e.g. Pad Thai, Truffle Pasta)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neo-canvas border-2 border-black text-xs font-bold text-black placeholder:text-gray-500 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Neighborhood Filter */}
            <div className="sm:w-48">
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full py-2 px-2.5 bg-neo-canvas border-2 border-black text-xs font-bold text-black focus:outline-none"
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
            <span className="font-mono font-bold text-gray-500 text-[11px] uppercase shrink-0">
              Cuisines:
            </span>
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-2 py-0.5 border border-black font-mono font-bold shrink-0 text-[11px] ${
                selectedCuisine === 'all'
                  ? 'bg-neo-yellow text-black shadow-neo-sm'
                  : 'bg-white text-gray-700'
              }`}
            >
              ALL
            </button>
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(c)}
                className={`px-2 py-0.5 border border-black font-mono font-bold shrink-0 text-[11px] uppercase ${
                  selectedCuisine === c
                    ? 'bg-neo-yellow text-black shadow-neo-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
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
              <div className="inline-block p-4 bg-white border-2 border-black rounded-neo-sm shadow-neo">
                ⏳ Loading 75 restaurant locations...
              </div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block p-6 bg-white border-2 border-black rounded-neo-sm shadow-neo max-w-sm">
                <p className="font-black text-base uppercase">No restaurants match your search</p>
                <p className="text-xs text-gray-600 mt-1">Try clearing filters or searching for another keyword.</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCuisine('all');
                    setSelectedNeighborhood('all');
                  }}
                  className="btn-neo bg-neo-yellow px-3 py-1 text-xs mt-3 font-bold"
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
        <div className="bg-white border-t-2 border-black p-3 flex items-center justify-between text-xs font-mono font-bold">
          <span>Showing {filteredRestaurants.length} of {restaurants.length} locations</span>
          <button
            onClick={onClose}
            className="btn-neo bg-black text-white px-4 py-1 font-mono uppercase text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
