export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (!digitos) return ''
  if (digitos.length <= 2) return `(${digitos}`
  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  if (numero.length <= 4) return `(${ddd})${numero}`
  const inicio = numero.length > 8 ? 5 : 4
  return `(${ddd})${numero.slice(0, inicio)}-${numero.slice(inicio)}`
}

export function exibirTelefone(valor: string | null | undefined): string {
  if (!valor) return ''
  const digitos = valor.replace(/\D/g, '')
  return /^[\d\s()+-]+$/.test(valor) && (digitos.length === 10 || digitos.length === 11)
    ? formatarTelefone(valor)
    : valor
}
