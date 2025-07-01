import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Filter, Search, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useImageUpload } from '@/hooks/useImageUpload';
import jsPDF from 'jspdf';

interface Stone {
  id: string;
  name: string;
  category: string;
  rock_type: string;
  finishes: string;
  available_in: string;
  base_color: string;
  characteristics: string;
  image_url: string;
  image_name_site?: string;
  enable_on_off: boolean;
}

const fetchStones = async (): Promise<Stone[]> => {
  const {
    data,
    error
  } = await supabase.from('aralogo_simples').select('"Nome", "Categoria", "Tipo de Rocha", "Acabamentos Disponíveis", "Disponível em", "Cor Base", "Características", "Caminho da Imagem", "Imagem_Name_Site", "Enable_On_Off"');
  if (error) {
    console.error('Error fetching stones:', error);
    throw new Error('Could not fetch stones');
  }
  if (!data) {
    return [];
  }
  return data.filter(item => item['Nome'] && item['Enable_On_Off'] === true) // Only show enabled stones
  .map((item: any, index: number) => ({
    id: item['Nome'] || `stone-${index}`,
    name: item['Nome'] || 'N/A',
    category: item['Categoria'] || 'N/A',
    rock_type: item['Tipo de Rocha'] || 'N/A',
    finishes: item['Acabamentos Disponíveis'] || 'N/A',
    available_in: item['Disponível em'] || 'N/A',
    base_color: item['Cor Base'] || 'N/A',
    characteristics: item['Características'] || 'N/A',
    image_url: item['Caminho da Imagem'] || item['Nome'] || '/placeholder.svg',
    image_name_site: item['Imagem_Name_Site'] || null,
    enable_on_off: item['Enable_On_Off'] || false
  }));
};

const StoneViewer = () => {
  const navigate = useNavigate();
  const {
    getImageUrl
  } = useImageUpload();
  const paginationRef = useRef<HTMLDivElement>(null);
  
  const {
    data: stones = [],
    isLoading,
    isError
  } = useQuery<Stone[]>({
    queryKey: ['aralogo_simples'],
    queryFn: fetchStones
  });
  
  const [filteredStones, setFilteredStones] = useState<Stone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rockTypeFilter, setRockTypeFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Extract unique values for filters, removing null or empty values
  const categories = [...new Set(stones.map(stone => stone.category))].filter(Boolean).sort();
  const rockTypes = [...new Set(stones.map(stone => stone.rock_type))].filter(Boolean).sort();
  const colors = [...new Set(stones.map(stone => stone.base_color))].filter(Boolean).sort();

  // Function to apply filters
  const applyFilters = () => {
    let filtered = stones;
    if (searchTerm) {
      filtered = filtered.filter(stone => stone.name.toLowerCase().includes(searchTerm.toLowerCase()) || stone.characteristics && stone.characteristics.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(stone => stone.category === categoryFilter);
    }
    if (rockTypeFilter && rockTypeFilter !== 'all') {
      filtered = filtered.filter(stone => stone.rock_type === rockTypeFilter);
    }
    if (colorFilter && colorFilter !== 'all') {
      filtered = filtered.filter(stone => stone.base_color === colorFilter);
    }
    setFilteredStones(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Apply filters whenever something changes
  useEffect(() => {
    if (!isLoading) {
      applyFilters();
    }
  }, [searchTerm, categoryFilter, rockTypeFilter, colorFilter, stones, isLoading]);
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setRockTypeFilter('all');
    setColorFilter('all');
  };
  
  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };
  
  const closeZoom = () => {
    setZoomedImage(null);
  };

  // Function to clean text from unsupported characters (emojis, etc.)
  const cleanText = (text: string): string => {
    if (!text) return 'N/A';
    
    // Remove emojis and other non-printable characters
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // misc symbols
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // dingbats
      .replace(/\s+/g, ' ')                   // normalize whitespace
      .trim();
  };

  // Function to load and convert image to base64
  const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

  // PDF Generation Function
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Cover Page
      pdf.setFontSize(36);
      pdf.setTextColor(0, 123, 255); // Blue color
      pdf.text('YMIR MIDDLE EAST', pageWidth / 2, 80, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(108, 117, 125); // Gray color
      pdf.text('STONES TRADING & EXPORT LLC', pageWidth / 2, 100, { align: 'center' });
      
      // Premium Materials Catalog title
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51); // Dark gray
      pdf.text('Premium Materials Catalog', pageWidth / 2, 240, { align: 'center' });
      
      // Add new page for content
      pdf.addPage();
      
      // Process each filtered stone
      for (let i = 0; i < filteredStones.length; i++) {
        const stone = filteredStones[i];
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // Stone title
        pdf.setFontSize(24);
        pdf.setTextColor(51, 51, 51);
        pdf.text(stone.name, 20, 30);
        
        // Draw line under title
        pdf.setDrawColor(51, 51, 51);
        pdf.line(20, 35, 190, 35);
        
        // Item name
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Item Name: ${stone.name}`, 20, 50);
        
        // Load and add stone image
        const imageIdentifier = stone.image_name_site || stone.name;
        const imageUrl = getImageUrl(imageIdentifier);
        const imageBase64 = await loadImageAsBase64(imageUrl);
        
        if (imageBase64) {
          try {
            // Image dimensions and position (increased by 50%)
            const imgWidth = 120; // mm (was 80mm)
            const imgHeight = 90; // mm (was 60mm)
            const imgX = (pageWidth - imgWidth) / 2; // Center horizontally
            const imgY = 60; // Position below item name
            
            pdf.addImage(imageBase64, 'JPEG', imgX, imgY, imgWidth, imgHeight);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }
        
        // Technical specifications (positioned below image)
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text('Technical Specifications:', 20, 165);
        
        const specs = [
          `Category: ${cleanText(stone.category)}`,
          `Rock type: ${cleanText(stone.rock_type)}`,
          `Available finishes: ${cleanText(stone.finishes)}`,
          `Available in: ${cleanText(stone.available_in)}`,
          `Base color: ${cleanText(stone.base_color)}`,
          `Characteristics: ${cleanText(stone.characteristics)}`
        ];
        
        let yPosition = 180;
        const maxWidth = 165; // Maximum width for text (210 - 20 margin left - 25 margin right)
        
        specs.forEach(spec => {
          // Split text into multiple lines if it's too long
          const lines = pdf.splitTextToSize(`• ${spec}`, maxWidth);
          
          // Add each line
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 7; // Slightly smaller line spacing
          });
          
          // Add extra space between different specifications
          yPosition += 2;
        });
      }
      
      // Save the PDF
      const fileName = `stones-catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredStones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStones = filteredStones.slice(startIndex, endIndex);
  const goToPage = (page: number) => {
    setCurrentPage(page);
    scrollToCurrentPage(page);
  };
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      scrollToCurrentPage(newPage);
    }
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      scrollToCurrentPage(newPage);
    }
  };

  // Atualiza o cálculo para centralizar o número ativo, quando possível.
  const scrollToCurrentPage = (page: number) => {
    if (paginationRef.current) {
      const pageButton = paginationRef.current.querySelector(`[data-page="${page}"]`) as HTMLElement;
      if (pageButton) {
        const container = paginationRef.current;
        const containerWidth = container.offsetWidth;
        const buttonLeft = pageButton.offsetLeft;
        const buttonWidth = pageButton.offsetWidth;
        const pages = Array.from(paginationRef.current.querySelectorAll('[data-page]')) as HTMLElement[];

        // Centraliza exceto quando está nas extremidades
        if (pages.length > 0) {
          const firstBtn = pages[0];
          const lastBtn = pages[pages.length - 1];

          // Se está nas 2 primeiras páginas ~ â esquerda total
          if (pageButton === firstBtn || pageButton === pages[1]) {
            container.scrollTo({
              left: 0,
              behavior: "smooth"
            });
            return;
          }
          // Se está nas 2 últimas páginas ~ à direita total
          if (pageButton === lastBtn || pageButton === pages[pages.length - 2]) {
            container.scrollTo({
              left: container.scrollWidth,
              behavior: "smooth"
            });
            return;
          }
        }

        // Centraliza para páginas intermediárias
        const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  // Auto-scroll to current page when component mounts or page changes
  useEffect(() => {
    if (currentPage > 1) {
      setTimeout(() => scrollToCurrentPage(currentPage), 100);
    }
  }, [currentPage]);
  
  return <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Natural Stones Catalog</h1>
          
          {/* Filter Area */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-700">Search Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={rockTypeFilter} onValueChange={setRockTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rock Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {rockTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={colorFilter} onValueChange={setColorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Base Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All colors</SelectItem>
                  {colors.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredStones.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredStones.length)} of {filteredStones.length} stones
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {isLoading && <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="ml-4 text-gray-600">Carregando pedras...</p>
          </div>}

        {isError && <div className="text-center py-12 text-red-600">
            <p>Um erro ocorreu ao carregar o catálogo.</p>
            <p>Por favor, tente novamente mais tarde.</p>
          </div>}

        {!isLoading && !isError && <>
            {/* 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentStones.map(stone => {
            // Uses the new Imagem_Name_Site column if it exists, otherwise uses the stone name
            const imageIdentifier = stone.image_name_site || stone.name;
            const imageUrl = getImageUrl(imageIdentifier);
            console.log('Stone:', stone.name, 'Image identifier:', imageIdentifier, 'Image URL:', imageUrl);
            return <div key={stone.id} className="produto border border-gray-200 rounded-lg overflow-hidden shadow-lg bg-white">
                    <div className="p-6">
                      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-800 pb-3 mb-4">
                        {stone.name}
                      </h1>
                      
                      <div className="font-bold text-lg mb-6">
                        Item Name: {stone.name}
                      </div>
                      
                      <div className="text-center my-8 relative">
                        <img src={imageUrl} alt={stone.name} className="w-full h-64 object-cover mx-auto border border-gray-300 rounded-lg shadow-lg cursor-pointer" onClick={() => handleImageZoom(imageUrl)} onError={e => {
                    const target = e.target as HTMLImageElement;
                    console.error('Error loading image:', imageUrl, 'for stone:', stone.name);
                    target.src = '/placeholder.svg';
                  }} />
                        <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => handleImageZoom(imageUrl)}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="bg-gray-100 p-6 rounded-lg">
                        <strong className="text-lg">Technical Specifications:</strong>
                        <ul className="mt-4 space-y-2 pl-6">
                          <li><strong>Category:</strong> {stone.category}</li>
                          <li><strong>Rock type:</strong> {stone.rock_type}</li>
                          <li><strong>Available finishes:</strong> {stone.finishes}</li>
                          <li><strong>Available in:</strong> {stone.available_in}</li>
                          <li><strong>Base color:</strong> {stone.base_color}</li>
                          <li><strong>Characteristics:</strong> {stone.characteristics}</li>
                        </ul>
                      </div>
                    </div>
                  </div>;
          })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && <div className="mt-8">
                {/* Mobile-first responsive pagination */}
                <div className="flex items-center gap-2 md:justify-center">
                  <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="flex-shrink-0" aria-label="Anterior">
                    <ChevronsLeft className="w-5 h-5" />
                  </Button>
                  
                  {/* Scrollable page numbers container */}
                  <div ref={paginationRef} className="flex gap-1 overflow-x-auto scrollbar-hide px-1 md:px-0" style={{
              maxWidth: "90vw"
            }}>
                    <div className="flex gap-1 min-w-max">
                      {Array.from({
                  length: totalPages
                }, (_, i) => i + 1).map(page => <Button key={page} data-page={page} variant={currentPage === page ? "default" : "outline"} size="icon" onClick={() => goToPage(page)} className={`flex-shrink-0 transition-all duration-150 ${currentPage === page ? 'ring-2 ring-primary' : ''}`} style={{
                  minWidth: '2.25rem',
                  padding: 0
                }} aria-label={`Página ${page}`}>
                          {page}
                        </Button>)}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="flex-shrink-0" aria-label="Próxima">
                    <ChevronsRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>}

            {filteredStones.length === 0 && !isLoading && <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  Nenhuma pedra encontrada com os filtros aplicados
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>}
          </>}

        {/* Zoom Modal - 80% of screen */}
        {zoomedImage && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeZoom}>
            <div className="relative w-[80vw] h-[80vh] p-4">
              <Button variant="outline" size="sm" className="absolute top-2 right-2 z-10" onClick={closeZoom}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <img src={zoomedImage} alt="Zoom" className="w-full h-full object-contain" onClick={e => e.stopPropagation()} />
            </div>
          </div>}
      </div>
    </div>;
};

export default StoneViewer;
