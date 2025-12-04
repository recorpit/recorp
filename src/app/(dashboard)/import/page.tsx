// /src/app/(dashboard)/import/page.tsx
import { Metadata } from 'next'
import { ImportLocaliSection } from './ImportLocaliSection'

export const metadata: Metadata = {
  title: 'Import Locali | RECORP',
  description: 'Importa locali con codice Belfiore',
}

export default function ImportPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Locali</h1>
        <p className="text-muted-foreground mt-1">
          Aggiorna i dati dei locali con indirizzo completo e codice Belfiore per le agibilità INPS
        </p>
      </div>
      
      <ImportLocaliSection />
    </div>
  )
}
