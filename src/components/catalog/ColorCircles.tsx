import React from 'react';

// Color mapping for common stone colors
const colorMap: Record<string, string> = {
  'White': '#ffffff',
  'Black': '#000000',
  'Gray': '#6b7280',
  'Grey': '#6b7280',
  'Blue': '#2563eb',
  'Green': '#16a34a',
  'Red': '#dc2626',
  'Brown': '#a16207',
  'Yellow': '#ca8a04',
  'Pink': '#db2777',
  'Purple': '#9333ea',
  'Orange': '#ea580c',
  'Beige': '#d6d3d1',
  'Cream': '#fef3c7',
  'Gold': '#eab308',
  'Silver': '#94a3b8',
  'Bronze': '#a16207',
  'Multicolor': '#ef4444',
  'Multi-color': '#ef4444',
  'Mixed': '#ef4444',
  'Varied': '#ef4444'
};

interface ColorCirclesProps {
  colorText: string;
}

const ColorCircles: React.FC<ColorCirclesProps> = ({ colorText }) => {
  // Split colors by comma and clean up whitespace
  const colors = colorText
    .split(',')
    .map(color => color.trim())
    .filter(color => color.length > 0);

  return (
    <div className="flex items-center gap-1">
      {colors.map((color, index) => {
        const hexColor = colorMap[color] || '#cccccc'; // Default gray for unmapped colors
        
        return (
          <div
            key={index}
            className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: hexColor }}
            title={color}
          />
        );
      })}
    </div>
  );
};

export default ColorCircles;