// src/lib/tipi-pagamento.ts
// Tipi di pagamento allineati per tutto il sistema

// Mapping tipi pagamento
export const TIPI_PAGAMENTO = {
  'BONIFICO_VISTA': {
    label: 'Bonifico bancario vista fattura',
    easyfatt: 'Bonifico bancario',
    fatturapa: 'MP05', // Bonifico
  },
  'BONIFICO_30GG': {
    label: 'Bonifico bancario 30 gg F.M.',
    easyfatt: 'Bonifico bancario 30gg FM',
    fatturapa: 'MP05',
  },
  'BONIFICO_60GG': {
    label: 'Bonifico bancario 60 gg F.M.',
    easyfatt: 'Bonifico bancario 60gg FM',
    fatturapa: 'MP05',
  },
  'RIBA_30GG': {
    label: 'Ri.Ba. 30 gg F.M.',
    easyfatt: 'Ricevuta bancaria',
    fatturapa: 'MP12', // RIBA
  },
  'RIBA_60GG': {
    label: 'Ri.Ba. 60 gg F.M.',
    easyfatt: 'Ricevuta bancaria 60gg',
    fatturapa: 'MP12',
  },
  'CARTA_CREDITO': {
    label: 'Carta di credito',
    easyfatt: 'Carta di credito',
    fatturapa: 'MP08', // Carta di pagamento
  },
  'CONTANTI': {
    label: 'Contanti',
    easyfatt: 'Contanti',
    fatturapa: 'MP01', // Contanti
  },
  'ASSEGNO': {
    label: 'Assegno',
    easyfatt: 'Assegno',
    fatturapa: 'MP02', // Assegno
  },
} as const;

export type TipoPagamento = keyof typeof TIPI_PAGAMENTO;

// Helper per ottenere label
export function getLabelPagamento(tipo: string): string {
  return TIPI_PAGAMENTO[tipo as TipoPagamento]?.label || tipo;
}

// Helper per ottenere nome Easyfatt
export function getEasyfattPagamento(tipo: string): string {
  return TIPI_PAGAMENTO[tipo as TipoPagamento]?.easyfatt || 'Bonifico bancario';
}

// Helper per ottenere codice FatturaPA
export function getFatturaPAPagamento(tipo: string): string {
  return TIPI_PAGAMENTO[tipo as TipoPagamento]?.fatturapa || 'MP05';
}

// Array per select/dropdown
export const TIPI_PAGAMENTO_OPTIONS = Object.entries(TIPI_PAGAMENTO).map(([value, data]) => ({
  value,
  label: data.label,
}));
