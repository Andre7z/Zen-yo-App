export function primeiroEUltimoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0] ?? ''
}
