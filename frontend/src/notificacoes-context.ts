import { createContext, useContext } from 'react'

export type TipoNotificacao = 'sucesso' | 'erro'

export type ContextoNotificacao = {
  sucesso: (mensagem: string) => void
  erro: (mensagem: string) => void
}

const semNotificacao: ContextoNotificacao = { sucesso: () => {}, erro: () => {} }

export const NotificacaoContext = createContext<ContextoNotificacao>(semNotificacao)

export function useNotificacao() {
  return useContext(NotificacaoContext)
}
