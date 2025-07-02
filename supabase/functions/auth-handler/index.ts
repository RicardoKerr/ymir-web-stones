
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_IP = 10
const MAX_ATTEMPTS_PER_EMAIL = 5
const rateLimitMap = new Map()

// Input validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const MIN_PASSWORD_LENGTH = 8
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 128

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return createErrorResponse('Método não permitido', 405)
    }

    // Get client info for rate limiting
    const clientIP = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    
    // Validate content type
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse('Content-Type deve ser application/json', 400)
    }

    // Parse and validate request body
    let body
    try {
      const text = await req.text()
      if (text.length > 1024) { // 1KB limit
        return createErrorResponse('Payload muito grande', 413)
      }
      body = JSON.parse(text)
    } catch (error) {
      return createErrorResponse('JSON inválido', 400)
    }

    const { action, email, senha, newPassword } = body

    // Validate required fields
    if (!action || typeof action !== 'string') {
      return createErrorResponse('Ação é obrigatória', 400)
    }

    if (!email || typeof email !== 'string') {
      return createErrorResponse('Email é obrigatório', 400)
    }

    // Validate email format and length
    if (!EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) {
      return createErrorResponse('Email inválido', 400)
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(clientIP, email, action)
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded: ${clientIP} - ${email} - ${action}`)
      return createErrorResponse(rateLimitResult.message, 429)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return createErrorResponse('Configuração do servidor inválida', 500)
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Set session context
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: email.toLowerCase().trim()
    })

    switch (action) {
      case 'register':
        return await handleRegister(supabase, email, senha, clientIP, userAgent)
      case 'login':
        return await handleLogin(supabase, email, senha, req, clientIP, userAgent)
      case 'change_password':
        return await handleChangePassword(supabase, email, newPassword)
      default:
        return createErrorResponse('Ação não reconhecida', 400)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
})

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  return cfConnectingIP || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIP) || 'unknown'
}

function checkRateLimit(ip: string, email: string, action: string): { allowed: boolean; message?: string } {
  const now = Date.now()
  const ipKey = `ip:${ip}`
  const emailKey = `email:${email}`
  
  // Clean old entries
  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key)
    }
  }
  
  // Check IP rate limit
  const ipData = rateLimitMap.get(ipKey) || { count: 0, windowStart: now }
  if (now - ipData.windowStart > RATE_LIMIT_WINDOW) {
    ipData.count = 0
    ipData.windowStart = now
  }
  
  if (ipData.count >= MAX_ATTEMPTS_PER_IP) {
    return { allowed: false, message: 'Muitas tentativas deste IP. Tente novamente em 15 minutos.' }
  }
  
  // Check email rate limit for login attempts
  if (action === 'login') {
    const emailData = rateLimitMap.get(emailKey) || { count: 0, windowStart: now }
    if (now - emailData.windowStart > RATE_LIMIT_WINDOW) {
      emailData.count = 0
      emailData.windowStart = now
    }
    
    if (emailData.count >= MAX_ATTEMPTS_PER_EMAIL) {
      return { allowed: false, message: 'Muitas tentativas para este email. Tente novamente em 15 minutos.' }
    }
  }
  
  // Update counters
  ipData.count++
  rateLimitMap.set(ipKey, ipData)
  
  if (action === 'login') {
    const emailData = rateLimitMap.get(emailKey) || { count: 0, windowStart: now }
    emailData.count++
    rateLimitMap.set(emailKey, emailData)
  }
  
  return { allowed: true }
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      } 
    }
  )
}

function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      } 
    }
  )
}

async function handleRegister(supabase: any, email: string, senha: string, clientIP: string, userAgent: string) {
  try {
    // Enhanced input validation
    const cleanEmail = email.toLowerCase().trim()
    
    if (!senha || typeof senha !== 'string') {
      return createErrorResponse('Senha é obrigatória', 400)
    }

    if (senha.length < MIN_PASSWORD_LENGTH || senha.length > MAX_PASSWORD_LENGTH) {
      return createErrorResponse(`Senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres`, 400)
    }

    // Password strength validation
    if (!isPasswordStrong(senha)) {
      return createErrorResponse('Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial', 400)
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('aralogo_auth')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return createErrorResponse('Erro ao verificar usuário existente', 500)
    }

    if (existingUser) {
      await logSecurityEvent(supabase, cleanEmail, 'register_attempt_existing_user', clientIP, userAgent)
      return createErrorResponse('Este email já está registrado', 409)
    }

    // Hash password
    const hashedPassword = await hash(senha)

    // Insert user
    const { error } = await supabase
      .from('aralogo_auth')
      .insert({
        email: cleanEmail,
        senha: hashedPassword,
        status: 'pendente'
      })

    if (error) {
      console.error('Error inserting user:', error)
      await logSecurityEvent(supabase, cleanEmail, 'register_failed', clientIP, userAgent)
      return createErrorResponse('Erro ao criar conta', 400)
    }

    await logSecurityEvent(supabase, cleanEmail, 'register_success', clientIP, userAgent)

    return createSuccessResponse({ 
      success: true, 
      message: 'Conta criada com sucesso! Aguarde aprovação para acessar o catálogo.' 
    })
  } catch (error) {
    console.error('Error in registration:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

async function handleLogin(supabase: any, email: string, senha: string, req: Request, clientIP: string, userAgent: string) {
  try {
    console.log('=== SECURE LOGIN ATTEMPT ===')
    
    const cleanEmail = email.toLowerCase().trim()
    
    // Enhanced input validation
    if (!senha || typeof senha !== 'string') {
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      return createErrorResponse('Senha é obrigatória', 400)
    }

    if (senha.length > MAX_PASSWORD_LENGTH) {
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      return createErrorResponse('Senha inválida', 400)
    }

    // Fetch user with error handling
    const { data: user, error } = await supabase
      .from('aralogo_auth')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (error) {
      console.error('Database error during login:', error)
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      return createErrorResponse('Erro interno do servidor', 500)
    }

    if (!user) {
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      await logSecurityEvent(supabase, cleanEmail, 'login_attempt_nonexistent_user', clientIP, userAgent)
      return createErrorResponse('Credenciais inválidas', 401)
    }

    // Enhanced password verification
    let passwordValid = false
    
    if (user.senha.startsWith('$2a$') || user.senha.startsWith('$2b$') || user.senha.startsWith('$2y$')) {
      // Hashed password
      passwordValid = await compare(senha, user.senha)
    } else {
      // Legacy plain text (should be migrated)
      passwordValid = senha === user.senha
      if (passwordValid) {
        await logSecurityEvent(supabase, cleanEmail, 'legacy_password_used', clientIP, userAgent)
      }
    }
    
    if (!passwordValid) {
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      await logSecurityEvent(supabase, cleanEmail, 'login_failed_invalid_password', clientIP, userAgent)
      return createErrorResponse('Credenciais inválidas', 401)
    }

    // Check user status
    if (user.status !== 'aprovado') {
      await logLoginAttempt(supabase, cleanEmail, false, clientIP, userAgent)
      await logSecurityEvent(supabase, cleanEmail, 'login_attempt_unapproved_user', clientIP, userAgent)
      
      const message = user.status === 'pendente' ? 
        'Sua conta está pendente de aprovação.' : 
        'Sua conta foi recusada.'
      
      return createErrorResponse(message, 403)
    }

    // Successful login
    await logLoginAttempt(supabase, cleanEmail, true, clientIP, userAgent)
    await logSecurityEvent(supabase, cleanEmail, 'login_success', clientIP, userAgent)

    return createSuccessResponse({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        status: user.status
      },
      message: 'Login realizado com sucesso!'
    })
  } catch (error) {
    console.error('Unexpected error in login:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

async function handleChangePassword(supabase: any, email: string, newPassword: string) {
  try {
    if (!newPassword || typeof newPassword !== 'string') {
      return createErrorResponse('Nova senha é obrigatória', 400)
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      return createErrorResponse(`Nova senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres`, 400)
    }

    if (!isPasswordStrong(newPassword)) {
      return createErrorResponse('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial', 400)
    }

    const hashedPassword = await hash(newPassword)

    const { error } = await supabase
      .from('aralogo_auth')
      .update({ senha: hashedPassword, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim())

    if (error) {
      console.error('Error changing password:', error)
      return createErrorResponse('Erro ao alterar senha', 400)
    }

    return createSuccessResponse({ success: true, message: 'Senha alterada com sucesso!' })
  } catch (error) {
    console.error('Error in password change:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

function isPasswordStrong(password: string): boolean {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
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
    console.error('Error logging login attempt:', error)
  }
}

async function logSecurityEvent(supabase: any, email: string, event: string, ip: string, userAgent: string) {
  try {
    // This would require a new table for security events
    console.log(`SECURITY EVENT: ${event} - ${email} - ${ip} - ${userAgent}`)
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}
