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
    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)
    console.log('Senha length:', senha?.length)
    
    // Obter informações do cliente para logs
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIP = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip')

    // Validar entrada
    if (!email || !senha) {
      console.log('Validation failed: missing email or password')
      await logLoginAttempt(supabase, email || 'unknown', false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar usuário
    console.log('Searching for user:', email.toLowerCase().trim())
    const { data: user, error } = await supabase
      .from('aralogo_auth')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    console.log('User query result:', { user: user ? 'found' : 'not found', error })
    if (user) {
      console.log('User details:', { 
        id: user.id, 
        email: user.email, 
        status: user.status, 
        is_admin: user.is_admin,
        senha_hash_length: user.senha?.length 
      })
    }

    if (error || !user) {
      console.log('User not found or database error:', error)
      await logLoginAttempt(supabase, email, false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar senha
    console.log('Checking password...')
    console.log('Plain password length:', senha.length)
    console.log('Stored hash length:', user.senha.length)
    console.log('Hash starts with:', user.senha.substring(0, 10))
    
    let passwordValid = false;
    
    // Verificar se a senha é um hash bcrypt (começa com $2a$, $2b$, ou $2y$)
    if (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$') || user.senha.startsWith('$2y$')) {
      // Senha já está hashada, usar bcrypt compare
      passwordValid = await compare(senha, user.senha)
      console.log('Using bcrypt compare, result:', passwordValid)
    } else {
      // Senha ainda não está hashada (usuários antigos), comparar diretamente
      passwordValid = senha === user.senha
      console.log('Using direct compare, result:', passwordValid)
      
      // Se a senha está correta, vamos atualizá-la para o formato hash
      if (passwordValid) {
        console.log('Password correct, updating to hash format...')
        const hashedPassword = await hash(senha)
        await supabase
          .from('aralogo_auth')
          .update({ senha: hashedPassword })
          .eq('id', user.id)
        console.log('Password updated to hash format')
      }
    }
    
    if (!passwordValid) {
      console.log('Password validation failed')
      await logLoginAttempt(supabase, email, false, clientIP, userAgent)
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar status
    console.log('Checking user status:', user.status)
    if (user.status !== 'aprovado') {
      console.log('User status not approved:', user.status)
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
    console.log('Login successful for user:', email)
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
    console.error('=== LOGIN ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
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