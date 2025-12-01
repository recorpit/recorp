// src/app/api/auth/[...nextauth]/route.ts
// API Route per NextAuth.js

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
