// Placeholder per generazione PDF
// Verrà implementato con @react-pdf/renderer

export async function generaPDFArtista(data: {
  artista: { nome: string; cognome: string; codiceFiscale: string }
  evento: { nome: string | null; data: Date; luogo: string }
  agibilita: { compensoLordo: number; compensoNetto: number | null; contributi: number | null }
}): Promise<Buffer> {
  // TODO: Implementare con @react-pdf/renderer
  // Per ora restituisce un buffer vuoto
  return Buffer.from('')
}