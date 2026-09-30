export type EventoAutenticacao = 'cadastro' | 'login' | 'restauracao' | 'logout'

type RegistroAutenticacao = {
  evento: EventoAutenticacao
  data: string
}

const CHAVE_HISTORICO = 'zenyo_auth_history'

export const historicoAutenticacao = {
  registrar(evento: EventoAutenticacao) {
    let registros: RegistroAutenticacao[] = []

    try {
      const salvo: unknown = JSON.parse(localStorage.getItem(CHAVE_HISTORICO) ?? '[]')
      if (Array.isArray(salvo)) registros = salvo as RegistroAutenticacao[]
      registros.push({ evento, data: new Date().toISOString() })
      localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(registros.slice(-20)))
    } catch {
      return
    }
  },
}