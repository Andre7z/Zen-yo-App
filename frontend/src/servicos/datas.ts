export function formatarDataParaEntrada(value: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : value
}

export function converterDataParaIso(value: string) {
  if (!value.trim()) return null
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!partes) return null

  const dia = Number(partes[1])
  const mes = Number(partes[2])
  const ano = Number(partes[3])
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null

  return `${partes[3]}-${partes[2]}-${partes[1]}`
}

export function calcularIdade(dataNascimento: string | null) {
  const partes = dataNascimento ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataNascimento) : null
  if (!partes) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - Number(partes[1])
  if (hoje.getMonth() + 1 < Number(partes[2]) || (hoje.getMonth() + 1 === Number(partes[2]) && hoje.getDate() < Number(partes[3]))) idade -= 1
  return idade
}

export function validarDataNascimento(dataNascimento: string) {
  const hoje = dataAtualIso()
  const [ano, mes, dia] = hoje.split('-').map(Number)
  const anoLimite = ano - 122
  const ultimoDiaDoMes = new Date(Date.UTC(anoLimite, mes, 0)).getUTCDate()
  const dataLimite = `${anoLimite}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, ultimoDiaDoMes)).padStart(2, '0')}`

  if (dataNascimento > hoje) return 'A data de nascimento não pode ser futura.'
  if (dataNascimento < dataLimite) return 'A data de nascimento deve estar dentro dos últimos 122 anos.'
  return null
}

export function dataAtividadeValida(data: string) {
  const ano = Number(data.slice(0, 4))
  return ano >= 2000 && ano <= 2150
}

export function dataAtualIso() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
