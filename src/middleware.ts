// src/middleware.ts
// Middleware per protezione route con Supabase Auth

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Route pubbliche (non richiedono autenticazione)
const publicRoutes = [
  '/login',
  '/registrazione',
  '/forgot-password',
  '/reset-password',
  '/firma', // Pagine firma pubblica
]

// Route API pubbliche
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/callback',
  '/api/firma',
]

export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // Aggiorna sessione e ottieni utente
  const { supabaseResponse, user } = await updateSession(request)
  
  const isLoggedIn = !!user
  
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
  )
  
  const isPublicApiRoute = publicApiRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  
  // API pubbliche - lascia passare
  if (isPublicApiRoute) {
    return supabaseResponse
  }
  
  // API protette - verifica auth
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Non autorizzato' },
      { status: 401 }
    )
  }
  
  // Route pubbliche - se loggato, redirect a dashboard
  if (isPublicRoute && isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  
  // Route protette - se non loggato, redirect a login
  if (!isPublicRoute && !isLoggedIn) {
    const url = request.nextUrl.clone()
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(url)
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    // Proteggi tutto tranne file statici
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
