import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  status: string;
  loginTime?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há uma sessão válida no localStorage
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem('aralogo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verificar se a sessão não expirou (24 horas)
          if (userData.loginTime) {
            const loginTime = new Date(userData.loginTime);
            const now = new Date();
            const diffHours = Math.abs(now.getTime() - loginTime.getTime()) / 36e5;
            
            if (diffHours > 24) {
              // Sessão expirada
              localStorage.removeItem('aralogo_user');
              setUser(null);
            } else {
              // Configurar contexto de sessão no Supabase
              supabase.rpc('set_config', {
                setting_name: 'app.current_user_email',
                setting_value: userData.email
              });
              setUser(userData);
            }
          } else {
            // Dados antigos sem loginTime, remover
            localStorage.removeItem('aralogo_user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        localStorage.removeItem('aralogo_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Validações básicas
      if (!email || !senha) {
        return { success: false, error: 'Email e senha são obrigatórios.' };
      }

      if (senha.length < 8) {
        return { success: false, error: 'Senha deve ter pelo menos 8 caracteres.' };
      }

      // Chamar Edge Function segura para login
      const { data, error } = await supabase.functions.invoke('auth-handler', {
        body: {
          action: 'login',
          email: email.trim(),
          senha: senha
        }
      });

      if (error || !data.success) {
        return { success: false, error: data?.error || 'Erro inesperado durante login.' };
      }

      // Salvar dados do usuário de forma segura
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        is_admin: data.user.is_admin,
        status: data.user.status,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('aralogo_user', JSON.stringify(userData));
      
      // Configurar contexto de sessão no Supabase
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_email',
        setting_value: data.user.email
      });

      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro inesperado durante login.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aralogo_user');
    setUser(null);
    
    // Limpar contexto de sessão no Supabase (fire and forget)
    supabase.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: ''
    });
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};