export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim()
}
