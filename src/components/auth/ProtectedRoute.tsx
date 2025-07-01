import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, loading, user, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login, preservando a rota atual
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user?.status !== 'aprovado') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <h2 className="text-2xl font-bold mb-4">Acesso Pendente</h2>
          <p className="text-muted-foreground mb-4">
            {user?.status === 'pendente' 
              ? 'Sua conta está pendente de aprovação. Entre em contato com o administrador.'
              : 'Sua conta foi recusada. Entre em contato com o administrador.'}
          </p>
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissões administrativas para acessar esta página.
          </p>
          <Navigate to="/catalog" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};