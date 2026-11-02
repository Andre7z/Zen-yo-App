export function cpfValido(texto: string): boolean {
  const numeros = texto.replace(/[.\-\s]/g, '')
  if (!/^\d{11}$/.test(numeros) || /^(\d)\1{10}$/.test(numeros)) return false
  const digito = (base: string) => {
    const soma = [...base].reduce((total, d, i) => total + Number(d) * (base.length + 1 - i), 0)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  const primeiro = digito(numeros.slice(0, 9))
  return numeros.slice(9) === `${primeiro}${digito(numeros.slice(0, 9) + primeiro)}`
}

export function formatarCpf(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 11)
  return n.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
}
