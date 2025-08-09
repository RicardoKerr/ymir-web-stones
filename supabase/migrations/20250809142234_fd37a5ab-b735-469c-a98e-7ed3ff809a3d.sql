
-- 1) Funções auxiliares sem recursão (bypass RLS via SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.is_current_user_approved()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.aralogo_auth
    WHERE email = current_setting('app.current_user_email', true)
      AND status = 'aprovado'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.aralogo_auth
    WHERE email = current_setting('app.current_user_email', true)
      AND is_admin = true
      AND status = 'aprovado'
  );
$$;

-- 2) Garantir que RLS esteja habilitado (idempotente)
ALTER TABLE public.aralogo_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aralogo_simples ENABLE ROW LEVEL SECURITY;

-- 3) Corrigir políticas de aralogo_auth (remover as recursivas e recriar)

-- Remover políticas que causam recursão
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios dados" ON public.aralogo_auth;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios dados" ON public.aralogo_auth;

-- Manter a de INSERT para registro (não recursiva)
-- CREATE POLICY "Permitir registro de novos usuários" já existe e fica inalterada

-- Nova política: usuário vê apenas sua própria linha
CREATE POLICY "User can view own row"
ON public.aralogo_auth
FOR SELECT
USING (email = current_setting('app.current_user_email', true));

-- Nova política: admin pode ver todas as linhas
CREATE POLICY "Admins can view all rows"
ON public.aralogo_auth
FOR SELECT
USING (public.is_current_user_admin());

-- Nova política de UPDATE: usuário atualiza a própria linha OU admin atualiza qualquer
CREATE POLICY "Self or admin can update aralogo_auth"
ON public.aralogo_auth
FOR UPDATE
USING (
  email = current_setting('app.current_user_email', true)
  OR public.is_current_user_admin()
)
WITH CHECK (
  email = current_setting('app.current_user_email', true)
  OR public.is_current_user_admin()
);

-- 4) Corrigir políticas de aralogo_simples (substituir as que referenciam aralogo_auth direto)

-- Remover as antigas que fazem subselect direto
DROP POLICY IF EXISTS "Authenticated users can insert stones" ON public.aralogo_simples;
DROP POLICY IF EXISTS "Authenticated users can update stones" ON public.aralogo_simples;
DROP POLICY IF EXISTS "Authenticated users can delete stones" ON public.aralogo_simples;

-- Manter a política pública de SELECT:
-- "Public can view all stones" permanece inalterada

-- Criar novas políticas baseadas nas funções auxiliares (sem recursão)
CREATE POLICY "Approved users can insert stones"
ON public.aralogo_simples
FOR INSERT
WITH CHECK (public.is_current_user_approved());

CREATE POLICY "Approved users can update stones"
ON public.aralogo_simples
FOR UPDATE
USING (public.is_current_user_approved())
WITH CHECK (public.is_current_user_approved());

CREATE POLICY "Approved users can delete stones"
ON public.aralogo_simples
FOR DELETE
USING (public.is_current_user_approved());
