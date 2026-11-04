import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { NotificacaoContext, type TipoNotificacao } from './notificacoes-context'

type Notificacao = { id: number; tipo: TipoNotificacao; mensagem: string }

const DURACAO_MS: Record<TipoNotificacao, number> = { sucesso: 4000, erro: 7000 }

export function NotificacaoProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const proximoId = useRef(0)

  const remover = useCallback((id: number) => {
    setNotificacoes((atuais) => atuais.filter((item) => item.id !== id))
  }, [])

  const notificar = useCallback((tipo: TipoNotificacao, mensagem: string) => {
    const id = ++proximoId.current
    setNotificacoes((atuais) => [...atuais.slice(-2), { id, tipo, mensagem }])
    window.setTimeout(() => remover(id), DURACAO_MS[tipo])
  }, [remover])

  const valor = useMemo(() => ({
    sucesso: (mensagem: string) => notificar('sucesso', mensagem),
    erro: (mensagem: string) => notificar('erro', mensagem),
  }), [notificar])

  return (
    <NotificacaoContext.Provider value={valor}>
      {children}
      <div className="toast-region" aria-live="polite">
        {notificacoes.map((item) => (
          <div className={`toast toast-${item.tipo}`} key={item.id}>
            {item.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{item.mensagem}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => remover(item.id)}><X size={14} /></button>
          </div>
        ))}
      </div>
    </NotificacaoContext.Provider>
  )
}
