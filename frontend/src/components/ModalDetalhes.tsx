import { useEffect, useRef, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

type Props = {
  titulo: string
  aoFechar: () => void
  children: ReactNode
  grande?: boolean
  contexto?: string
}

export function ModalDetalhes({ titulo, aoFechar, children, grande = false, contexto = 'VISUALIZAÇÃO' }: Props) {
  const idTitulo = useId()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLElement>(null)
  const aoFecharRef = useRef(aoFechar)
  const locationRef = useRef(location)
  const fecharRef = useRef<() => void>(() => {})
  const entradaHistoricoRef = useRef(false)
  const hashAnteriorRef = useRef(location.hash)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    fecharRef.current = () => {
      const rotaAtual = locationRef.current
      if (rotaAtual.hash === '#modal') {
        navigate(`${rotaAtual.pathname}${rotaAtual.search}`, { replace: true })
      }
      aoFecharRef.current()
    }
  }, [location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    if (location.hash === '#modal') {
      entradaHistoricoRef.current = true
      return
    }
    if (entradaHistoricoRef.current) return
    entradaHistoricoRef.current = true
    navigate(`${location.pathname}${location.search}#modal`)
  }, [location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    if (hashAnteriorRef.current !== location.hash) {
      hashAnteriorRef.current = location.hash
      if (location.hash !== '#modal') aoFecharRef.current()
    }
  }, [location.hash])

  function fechar() {
    fecharRef.current()
  }

  useEffect(() => {
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') fecharRef.current()
    }

    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.removeEventListener('keydown', fecharComEscape)
      document.body.style.overflow = overflowAnterior
      focoAnterior?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="detail-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) fechar()
      }}
    >
      <section
        ref={dialogRef}
        className={grande ? 'detail-dialog detail-dialog-wide' : 'detail-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
      >
        <header className="detail-dialog-heading">
          <div className="detail-dialog-title">
            <span>{contexto}</span>
            <h2 id={idTitulo}>{titulo}</h2>
          </div>
          <button className="detail-dialog-close" type="button" aria-label={contexto === 'VISUALIZAÇÃO' ? 'Fechar detalhes' : 'Fechar formulário'} onClick={fechar}>
            <X size={18} />
          </button>
        </header>
        <div className="detail-dialog-content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
