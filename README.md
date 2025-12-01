# Setup Autenticazione RECORP

## 1. Installa dipendenze

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

## 2. Genera secret per NextAuth

```bash
npx auth secret
```

Poi aggiungi al `.env`:
```
AUTH_SECRET=il_secret_generato
```

## 3. File da creare/modificare

Vedi i file allegati nello zip.

## 4. Aggiorna schema Prisma (opzionale)

Se vuoi tracciare i token di reset password, aggiungi:

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())

  @@unique([email, token])
}
```

## 5. Hash password esistenti

Se hai utenti con password in chiaro, esegui questo script una tantum:

```typescript
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function hashExistingPasswords() {
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    // Salta se già hashata (le password bcrypt iniziano con $2)
    if (user.password.startsWith('$2')) continue
    
    const hashed = await bcrypt.hash(user.password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    })
    console.log(`Hashata password per: ${user.email}`)
  }
  
  console.log('Fatto!')
}

hashExistingPasswords()
```
