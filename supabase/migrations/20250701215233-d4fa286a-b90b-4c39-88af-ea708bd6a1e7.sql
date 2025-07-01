-- Criar função para definir configurações de contexto (necessária para RLS)
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;