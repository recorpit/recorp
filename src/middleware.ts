// src/middleware.ts
// Middleware per protezione route

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Route pubbliche (non richiedono autenticazione)
const publicRoutes = [
  '/login',
  '/registrazione',
  '/forgot-password',
  '/reset-password',
]

// Route API pubbliche
const publicApiRoutes = [
  '/api/auth',
]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
  )
  
  const isPublicApiRoute = publicApiRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )
  
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  
  // API pubbliche - lascia passare
  if (isPublicApiRoute) {
    return NextResponse.next()
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
    return NextResponse.redirect(new URL('/', nextUrl))
  }
  
  // Route protette - se non loggato, redirect a login
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Proteggi tutto tranne file statici
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
