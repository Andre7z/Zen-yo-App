export function formatarCodigoZempo(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 12)
  return digitos ? `JU${digitos}` : ''
}
