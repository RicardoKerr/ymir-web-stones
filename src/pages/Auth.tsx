import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', senha: '' });
  const [signupData, setSignupData] = useState({ email: '', senha: '' });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/catalog';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(loginData.email, loginData.senha);
      
      if (!result.success) {
        toast({
          title: "Erro de login",
          description: result.error || "Erro inesperado durante login.",
          variant: "destructive",
        });
        return;
      }

      const from = location.state?.from?.pathname || '/catalog';
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando...",
      });

      navigate(from, { replace: true });
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado durante login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas no frontend
      if (!signupData.email || !signupData.senha) {
        toast({
          title: "Erro de validação",
          description: "Email e senha são obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (signupData.senha.length < 8) {
        toast({
          title: "Erro de validação",
          description: "Senha deve ter pelo menos 8 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Validação básica de email
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(signupData.email)) {
        toast({
          title: "Erro de validação",
          description: "Formato de email inválido.",
          variant: "destructive",
        });
        return;
      }

      // Chamar Edge Function segura para registro
      const { data, error } = await supabase.functions.invoke('auth-handler', {
        body: {
          action: 'register',
          email: signupData.email.trim(),
          senha: signupData.senha
        }
      });

      if (error || !data.success) {
        toast({
          title: "Erro de registro",
          description: data?.error || "Erro inesperado durante registro.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registro realizado com sucesso!",
        description: "Sua conta está pendente de aprovação. Aguarde a aprovação para acessar o catálogo.",
      });

      setSignupData({ email: '', senha: '' });
    } catch (error) {
      console.error('Erro no registro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado durante registro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para início
        </Button>

        <div className="flex items-center justify-center">
          <Tabs defaultValue="login" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Registrar-se</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso ao Catálogo</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para gerenciar o catálogo de pedras.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="E-mail"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Senha"
                        value={loginData.senha}
                        onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitar Acesso</CardTitle>
                  <CardDescription>
                    Cadastre-se para solicitar acesso ao gerenciamento do catálogo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="E-mail"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Senha (apenas letras e números)"
                        value={signupData.senha}
                        onChange={(e) => setSignupData({ ...signupData, senha: e.target.value })}
                        pattern="[A-Za-z0-9]+"
                        title="Use apenas letras e números"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Registrando..." : "Solicitar Acesso"}
                    </Button>
                  </form>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Atenção:</strong> Após o cadastro, sua conta precisa ser aprovada antes de acessar o catálogo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
