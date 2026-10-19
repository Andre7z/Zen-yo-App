import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

type Props = {
  kicker: string
  titulo: string
  descricao: string
  carregando?: boolean
  erro?: string
  recarregar?: () => void
  children: ReactNode
}

export function PaginaModulo({ kicker, titulo, descricao, carregando, erro, recarregar, children }: Props) {
  return (
    <main className="module-page">
      <header className="module-heading">
        <div className="home-kicker"><i />{kicker}</div>
        <h1>{titulo}</h1>
        <p className="home-intro">{descricao}</p>
      </header>
      {erro && (
        <div className="module-error" role="alert">
          <AlertCircle size={18} />
          <span>{erro}</span>
          {recarregar && <button type="button" onClick={recarregar} aria-label="Tentar novamente" title="Tentar novamente"><RefreshCw size={16} /></button>}
        </div>
      )}
      {carregando ? <p className="module-state" role="status">Carregando...</p> : children}
    </main>
  )
}

export function CampoModulo({ rotulo, children, dica }: { rotulo: string; children: ReactNode; dica?: string }) {
  return (
    <label className="module-field">
      <span>{rotulo}</span>
      {children}
      {dica && <small>{dica}</small>}
    </label>
  )
}

export function BotaoIcone({ children, label, onClick, disabled }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button className="icon-action" type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>
}
