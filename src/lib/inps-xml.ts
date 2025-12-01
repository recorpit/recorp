import { XMLBuilder } from 'fast-xml-parser'

interface DatiAgibilita {
  artista: {
    codiceFiscale: string
    cognome: string
    nome: string
    dataNascita: Date | null
    comuneNascita: string | null
  }
  evento: {
    data: Date
    luogo: string
    tipoAttivita: string
    compenso: number
  }
}

function formatDateIT(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function generaXMLINPS(dati: DatiAgibilita): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true
  })

  const xmlObj = {
    Comunicazione: {
      Mittente: {
        CodiceFiscale: process.env.AZIENDA_CF || '',
        Denominazione: process.env.AZIENDA_NOME || 'OKL SRL'
      },
      Lavoratore: {
        CodiceFiscale: dati.artista.codiceFiscale,
        Cognome: dati.artista.cognome,
        Nome: dati.artista.nome,
        DataNascita: dati.artista.dataNascita ? formatDateIT(dati.artista.dataNascita) : '',
        ComuneNascita: dati.artista.comuneNascita || ''
      },
      Prestazione: {
        DataInizio: formatDateIT(dati.evento.data),
        DataFine: formatDateIT(dati.evento.data),
        LuogoPrestazione: dati.evento.luogo,
        TipoAttivita: dati.evento.tipoAttivita,
        CompensoPrevisto: dati.evento.compenso.toFixed(2)
      }
    }
  }

  const xmlContent = builder.build(xmlObj)
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlContent
}