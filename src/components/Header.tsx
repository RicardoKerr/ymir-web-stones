
import React from 'react';
import { Palette, Menu } from 'lucide-react';

export const Header = () => {
  return (
    <header className="relative z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Palette className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mosaic</h1>
              <p className="text-sm text-gray-300">Art Gallery</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white hover:text-purple-400 transition-colors duration-300 font-medium">
              Gallery
            </a>
            <a href="#" className="text-white hover:text-purple-400 transition-colors duration-300 font-medium">
              Artists
            </a>
            <a href="#" className="text-white hover:text-purple-400 transition-colors duration-300 font-medium">
              Collections
            </a>
            <a href="#" className="text-white hover:text-purple-400 transition-colors duration-300 font-medium">
              About
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white hover:text-purple-400 transition-colors duration-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};
