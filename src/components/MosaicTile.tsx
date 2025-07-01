
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface MosaicItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  color: string;
}

interface MosaicTileProps {
  item: MosaicItem;
}

export const MosaicTile: React.FC<MosaicTileProps> = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeClasses = (size: MosaicItem['size']) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'wide':
        return 'md:col-span-2';
      case 'tall':
        return 'md:row-span-2';
      case 'medium':
        return 'md:col-span-1';
      case 'small':
      default:
        return 'md:col-span-1';
    }
  };

  return (
    <div
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-700 ease-out",
        "hover:scale-105 hover:z-10",
        "min-h-[200px] md:min-h-[250px]",
        getSizeClasses(item.size)
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${item.image})` }}
      />
      
      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
        isHovered ? "opacity-90" : "opacity-60",
        item.color
      )} />
      
      {/* Glassmorphism Effect */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10" />
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className={cn(
          "transform transition-all duration-500 ease-out",
          isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-80"
        )}>
          <h3 className="text-white font-bold text-xl md:text-2xl mb-2 drop-shadow-lg">
            {item.title}
          </h3>
          <p className="text-white/90 text-sm md:text-base font-medium drop-shadow-md">
            {item.subtitle}
          </p>
        </div>
        
        {/* Hover Effect Circle */}
        <div className={cn(
          "absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm",
          "flex items-center justify-center transition-all duration-300",
          isHovered ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}>
          <div className="w-6 h-6 rounded-full bg-white/40" />
        </div>
      </div>
      
      {/* Border Glow Effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl transition-all duration-300",
        "border-2 border-transparent",
        isHovered && "border-white/30 shadow-2xl shadow-white/20"
      )} />
    </div>
  );
};
