// /src/app/(dashboard)/import/page.tsx
// Pagina per import dati in RECORP (Format e Locali)

import { Metadata } from 'next'
import { ImportFormatsSection } from './ImportFormatsSection'
import { ImportLocaliSection } from './ImportLocaliSection'

export const metadata: Metadata = {
  title: 'Import Dati | RECORP',
  description: 'Importa format e locali nel sistema RECORP',
}

export default function ImportPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Dati</h1>
        <p className="text-muted-foreground mt-1">
          Importa format pubblici e aggiorna i dati dei locali con codice Belfiore
        </p>
      </div>
      
      {/* Statistiche generali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
          <div className="text-sm opacity-80">Format Pubblici</div>
          <div className="text-3xl font-bold">12</div>
          <div className="text-sm opacity-80 mt-1">Disponibili per import</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
          <div className="text-sm opacity-80">Locali Completi</div>
          <div className="text-3xl font-bold">34</div>
          <div className="text-sm opacity-80 mt-1">Con codice Belfiore</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
          <div className="text-sm opacity-80">Prestazioni Totali</div>
          <div className="text-3xl font-bold">4.201</div>
          <div className="text-sm opacity-80 mt-1">Nel database storico</div>
        </div>
      </div>
      
      {/* Sezione Import Locali */}
      <ImportLocaliSection />
      
      {/* Sezione Import Format */}
      <ImportFormatsSection />
    </div>
  )
}
