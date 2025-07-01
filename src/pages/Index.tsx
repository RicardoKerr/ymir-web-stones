
import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { MosaicGrid } from '@/components/MosaicGrid';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <Hero />
      
      {/* Gallery Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 mb-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Featured <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Artworks</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Immerse yourself in our carefully curated collection of digital masterpieces
            </p>
          </div>
        </div>
        
        <MosaicGrid />
      </section>
      
      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Mosaic Art Gallery. Crafted with passion for digital art.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
