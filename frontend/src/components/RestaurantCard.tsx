import React from 'react';
import { Star, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';
import type { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect?: (restaurant: Restaurant) => void;
  compact?: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onSelect,
  compact = false,
}) => {
  const cuisines = restaurant.cuisine_types || restaurant.cuisines || [];
  const ambiances = restaurant.ambiance || [];
  const popularDishes = restaurant.popular_dishes || [];
  const ratingVal =
    typeof restaurant.rating === 'number'
      ? restaurant.rating.toFixed(1)
      : '4.5';
  const priceVal = restaurant.price_range || '$$';
  const neighborhoodVal = restaurant.neighborhood || restaurant.city || 'GoodFoods Location';

  return (
    <div className="bg-neo-card border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-3.5 flex flex-col justify-between text-left transition-all">
      <div>
        {/* Top bar: Name & Price */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-black text-base uppercase tracking-tight text-neo-main leading-snug">
              {restaurant.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neo-muted font-bold">
              <MapPin className="w-3.5 h-3.5 text-neo-orange shrink-0" />
              <span>{neighborhoodVal}</span>
              {restaurant.address && (
                <>
                  <span>•</span>
                  <span className="text-neo-muted font-mono text-[11px] truncate max-w-[160px]">
                    {restaurant.address}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="bg-neo-yellow text-black border border-neutral-200 dark:border-neutral-700 font-mono font-black text-xs px-2 py-0.5 shadow-sm rounded-lg">
              {priceVal}
            </span>
            <div className="flex items-center gap-0.5 bg-black text-white px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Star className="w-3 h-3 fill-neo-yellow text-neo-yellow" />
              <span>{ratingVal}</span>
            </div>
          </div>
        </div>

        {/* Cuisine and Ambiance Pill Badges */}
        {(cuisines.length > 0 || ambiances.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {cuisines.map((cuisine) => (
              <span
                key={cuisine}
                className="bg-neo-blue/20 text-neo-main border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] font-mono uppercase font-black rounded-lg"
              >
                🍽️ {cuisine}
              </span>
            ))}
            {ambiances.slice(0, 2).map((amb) => (
              <span
                key={amb}
                className="bg-neo-purple/20 text-neo-main border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] font-mono uppercase font-black rounded-lg"
              >
                🎭 {amb}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {restaurant.description && !compact && (
          <p className="text-xs text-neo-main mt-2 line-clamp-2 leading-relaxed font-medium">
            {restaurant.description}
          </p>
        )}

        {/* Popular Dishes */}
        {popularDishes.length > 0 && !compact && (
          <div className="mt-2.5 pt-2 border-t border-dashed border-black">
            <div className="text-[10px] font-mono uppercase font-black text-neo-main flex items-center gap-1">
              <span>Popular Dishes:</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {popularDishes.map((dish) => (
                <span
                  key={dish}
                  className="bg-neo-surface border border-neutral-200 dark:border-neutral-700 text-neo-main text-[10px] font-sans px-1.5 py-0.5 rounded-lg font-bold"
                >
                  {dish}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features / Amenities */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] font-mono text-neo-muted font-bold">
          {restaurant.open_time && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-neo-orange shrink-0" />
              {restaurant.open_time} - {restaurant.close_time || '22:00'}
            </span>
          )}
          {restaurant.seating_capacity != null && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3 text-neo-blue shrink-0" />
              {restaurant.seating_capacity} seats
            </span>
          )}
          {restaurant.has_outdoor_seating && (
            <span className="text-green-700 font-black flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Outdoor
            </span>
          )}
          {restaurant.parking_available && (
            <span className="text-blue-700 font-black flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Parking
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      {onSelect && (
        <button
          onClick={() => onSelect(restaurant)}
          className="btn-neo bg-neo-yellow text-black text-xs font-black uppercase py-2 px-3 mt-3 w-full flex items-center justify-center gap-1 shadow-sm hover:bg-neo-orange hover:text-white"
        >
          <span>⚡ Select & Check Availability</span>
        </button>
      )}
    </div>
  );
};
