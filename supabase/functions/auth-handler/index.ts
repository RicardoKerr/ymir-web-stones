import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { action, email, senha, newPassword } = await req.json()

    // Configurar setting de contexto para RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: email
    })

    switch (action) {
      case 'register':
        return await handleRegister(supabase, email, senha)
      case 'login':
        return await handleLogin(supabase, email, senha, req)
      case 'change_password':
        return await handleChangePassword(supabase, email, newPassword)
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleRegister(supabase: any, email: string, senha: string) {
  try {
    // Validar entrada
    if (!email || !senha) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (senha.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('aralogo_auth')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Este email já está registrado' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(senha)

    // Inserir usuário
    const { error } = await supabase
      .from('aralogo_auth')
      .insert({
        email: email.toLowerCase().trim(),
        senha: hashedPassword,
        status: 'pendente'
      })

    if (error) {
      console.error('Erro ao inserir usuário:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta criada com sucesso! Aguarde aprovação para acessar o catálogo.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no registro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleLogin(supabase: any, email: string, senha: string, req: Request) {
  try {
    // Obter informações do cliente para logs
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIP = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip')

    // Validar entrada
    if (!email || !senha) {
      await logLoginAttempt(supabase, email || 'unknown', false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('aralogo_auth')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) {
      await logLoginAttempt(supabase, email, false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar senha
    const passwordValid = await compare(senha, user.senha)
    if (!passwordValid) {
      await logLoginAttempt(supabase, email, false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar status
    if (user.status !== 'aprovado') {
      await logLoginAttempt(supabase, email, false, clientIP, userAgent)
      const message = user.status === 'pendente' ? 
        'Sua conta está pendente de aprovação.' : 
        'Sua conta foi recusada.'
      
      return new Response(
        JSON.stringify({ error: message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Login bem-sucedido
    await logLoginAttempt(supabase, email, true, clientIP, userAgent)

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin,
          status: user.status
        },
        message: 'Login realizado com sucesso!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no login:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleChangePassword(supabase: any, email: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Nova senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hashedPassword = await hash(newPassword)

    const { error } = await supabase
      .from('aralogo_auth')
      .update({ senha: hashedPassword, updated_at: new Date().toISOString() })
      .eq('email', email)

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Erro ao alterar senha' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Senha alterada com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function logLoginAttempt(supabase: any, email: string, success: boolean, ip: string | null, userAgent: string) {
  try {
    await supabase.rpc('log_login_attempt', {
      user_email: email,
      login_success: success,
      client_ip: ip,
      client_user_agent: userAgent
    })
  } catch (error) {
    console.error('Erro ao registrar tentativa de login:', error)
  }
}