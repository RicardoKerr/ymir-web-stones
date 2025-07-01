
import React from 'react';
import { MosaicTile } from './MosaicTile';

const mosaicItems = [
  {
    id: 1,
    title: "Digital Dreams",
    subtitle: "Abstract Art",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    size: "large",
    color: "from-purple-600/80 to-blue-600/80"
  },
  {
    id: 2,
    title: "Ocean Waves",
    subtitle: "Nature Photography",
    image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop",
    size: "medium",
    color: "from-blue-500/80 to-teal-500/80"
  },
  {
    id: 3,
    title: "Urban Geometry",
    subtitle: "Architecture",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop",
    size: "small",
    color: "from-orange-500/80 to-red-500/80"
  },
  {
    id: 4,
    title: "Neon Nights",
    subtitle: "Street Art",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop",
    size: "tall",
    color: "from-pink-500/80 to-purple-600/80"
  },
  {
    id: 5,
    title: "Forest Path",
    subtitle: "Landscape",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    size: "medium",
    color: "from-green-500/80 to-emerald-600/80"
  },
  {
    id: 6,
    title: "Golden Hour",
    subtitle: "Portrait",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    size: "small",
    color: "from-yellow-500/80 to-orange-500/80"
  },
  {
    id: 7,
    title: "Cosmic Dance",
    subtitle: "Space Art",
    image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop",
    size: "wide",
    color: "from-indigo-600/80 to-purple-700/80"
  },
  {
    id: 8,
    title: "Minimalist",
    subtitle: "Design",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&h=600&fit=crop",
    size: "medium",
    color: "from-gray-500/80 to-slate-600/80"
  }
];

export const MosaicGrid = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-fr">
        {mosaicItems.map((item) => (
          <MosaicTile key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
