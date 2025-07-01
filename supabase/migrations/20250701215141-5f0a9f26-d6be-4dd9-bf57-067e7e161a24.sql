-- FASE 1: IMPLEMENTAR SEGURANÇA CRÍTICA

-- 1. Criar função para hash de senhas
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Por enquanto retorna o texto (será atualizado via Edge Function)
  RETURN password_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover políticas RLS permissivas existentes da tabela aralogo_auth
DROP POLICY IF EXISTS "Permitir consulta para autenticação" ON public.aralogo_auth;
DROP POLICY IF EXISTS "Permitir inserção para registro" ON public.aralogo_auth;
DROP POLICY IF EXISTS "Permitir atualização para gerenciamento" ON public.aralogo_auth;

-- 3. Criar políticas RLS seguras para aralogo_auth

-- Política para permitir INSERT apenas para registro (sem autenticação necessária)
CREATE POLICY "Permitir registro de novos usuários" 
ON public.aralogo_auth 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir SELECT apenas dos próprios dados ou para admins
CREATE POLICY "Usuários podem ver apenas seus próprios dados" 
ON public.aralogo_auth 
FOR SELECT 
USING (
  -- Permite acesso se é o próprio usuário (comparando email com dados na sessão)
  -- OU se é um admin (esta parte será implementada depois)
  email = current_setting('app.current_user_email', true)
  OR 
  EXISTS (
    SELECT 1 FROM public.aralogo_auth admin_check 
    WHERE admin_check.email = current_setting('app.current_user_email', true) 
    AND admin_check.is_admin = true 
    AND admin_check.status = 'aprovado'
  )
);

-- Política para permitir UPDATE apenas dos próprios dados ou para admins
CREATE POLICY "Usuários podem atualizar apenas seus próprios dados" 
ON public.aralogo_auth 
FOR UPDATE 
USING (
  email = current_setting('app.current_user_email', true)
  OR 
  EXISTS (
    SELECT 1 FROM public.aralogo_auth admin_check 
    WHERE admin_check.email = current_setting('app.current_user_email', true) 
    AND admin_check.is_admin = true 
    AND admin_check.status = 'aprovado'
  )
);

-- 4. Adicionar constraint para validação de email
ALTER TABLE public.aralogo_auth 
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 5. Adicionar constraint para validação de senha (mínimo 8 caracteres)
ALTER TABLE public.aralogo_auth 
ADD CONSTRAINT valid_password_length 
CHECK (length(senha) >= 8);

-- 6. Adicionar índice para melhor performance em consultas de email
CREATE INDEX IF NOT EXISTS idx_aralogo_auth_email ON public.aralogo_auth(email);
CREATE INDEX IF NOT EXISTS idx_aralogo_auth_status ON public.aralogo_auth(status);

-- 7. Criar tabela para logs de tentativas de login
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política para logs: apenas admins podem ver
CREATE POLICY "Apenas admins podem ver logs de login" 
ON public.login_attempts 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.aralogo_auth admin_check 
    WHERE admin_check.email = current_setting('app.current_user_email', true) 
    AND admin_check.is_admin = true 
    AND admin_check.status = 'aprovado'
  )
);

-- 8. Função para registrar tentativas de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  user_email TEXT, 
  login_success BOOLEAN, 
  client_ip INET DEFAULT NULL, 
  client_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address, user_agent)
  VALUES (user_email, login_success, client_ip, client_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários explicativos
COMMENT ON POLICY "Permitir registro de novos usuários" ON public.aralogo_auth IS 'Permite registro sem autenticação, mas com validações';
COMMENT ON POLICY "Usuários podem ver apenas seus próprios dados" ON public.aralogo_auth IS 'Acesso restrito aos próprios dados ou admin';
COMMENT ON POLICY "Usuários podem atualizar apenas seus próprios dados" ON public.aralogo_auth IS 'Atualização restrita aos próprios dados ou admin';
COMMENT ON TABLE public.login_attempts IS 'Log de tentativas de login para auditoria de segurança';
COMMENT ON FUNCTION public.log_login_attempt IS 'Registra tentativas de login para monitoramento de segurança';