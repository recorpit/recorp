// src/lib/auth.ts
// Configurazione NextAuth.js v5

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { RuoloUtente } from '@prisma/client'

// Estendi i tipi di NextAuth
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    nome: string
    cognome: string
    ruolo: RuoloUtente
  }
  
  interface Session {
    user: {
      id: string
      email: string
      nome: string
      cognome: string
      ruolo: RuoloUtente
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔍 === INIZIO AUTHORIZE ===')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenziali mancanti')
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        console.log('📧 Email inserita:', email)

        // Cerca utente
        const user = await prisma.user.findUnique({
          where: { email },
        })

        console.log('👤 Utente trovato:', user ? 'SI' : 'NO')
        
        if (!user) {
          console.log('❌ Utente non trovato nel DB')
          return null
        }
        
        console.log('📧 Email nel DB:', user.email)
        console.log('🔐 Hash password (primi 30 char):', user.password.substring(0, 30))
        console.log('✅ Attivo:', user.attivo)

        if (!user.attivo) {
          console.log('❌ Utente non attivo')
          return null
        }

        // Verifica password
        const passwordMatch = await bcrypt.compare(password, user.password)
        console.log('🔑 Password match:', passwordMatch)

        if (!passwordMatch) {
          console.log('❌ Password NON corrisponde')
          return null
        }

        console.log('✅ Login OK!')

        // Aggiorna ultimo login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          ruolo: user.ruolo,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.email = user.email as string
        token.nome = (user as any).nome as string
        token.cognome = (user as any).cognome as string
        token.ruolo = (user as any).ruolo as RuoloUtente
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        nome: token.nome as string,
        cognome: token.cognome as string,
        ruolo: token.ruolo as RuoloUtente,
        emailVerified: null,
      } as any
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
})