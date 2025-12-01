// scripts/hash-passwords.ts
// Script per hashare le password esistenti nel database
// Esegui con: npx ts-node scripts/hash-passwords.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashExistingPasswords() {
  console.log('Inizio hash password esistenti...\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      password: true,
    }
  })
  
  let updated = 0
  let skipped = 0
  
  for (const user of users) {
    // Le password bcrypt iniziano con $2a$, $2b$ o $2y$
    if (user.password.startsWith('$2')) {
      console.log(`⏭️  ${user.email} - Password già hashata`)
      skipped++
      continue
    }
    
    const hashedPassword = await bcrypt.hash(user.password, 12)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    
    console.log(`✅ ${user.email} - Password hashata`)
    updated++
  }
  
  console.log('\n--- Riepilogo ---')
  console.log(`Totale utenti: ${users.length}`)
  console.log(`Aggiornati: ${updated}`)
  console.log(`Già hashati: ${skipped}`)
  console.log('\nFatto!')
}

hashExistingPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
