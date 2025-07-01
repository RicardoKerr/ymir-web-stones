
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface CatalogHeaderProps {
  onAdd: () => void;
}

const CatalogHeader: React.FC<CatalogHeaderProps> = ({ onAdd }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              {user?.email} {isAdmin && '(Admin)'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Natural Stone Catalog
      </h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stone
        </Button>
      </div>
    </div>
  );
};

export default CatalogHeader;
