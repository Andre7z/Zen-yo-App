import { useEffect, useRef, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  titulo: string
  aoFechar: () => void
  children: ReactNode
  grande?: boolean
}

export function ModalDetalhes({ titulo, aoFechar, children, grande = false }: Props) {
  const idTitulo = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') aoFecharRef.current()
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
        if (event.target === event.currentTarget) aoFechar()
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
            <span>VISUALIZAÇÃO</span>
            <h2 id={idTitulo}>{titulo}</h2>
          </div>
          <button className="detail-dialog-close" type="button" aria-label="Fechar detalhes" onClick={aoFechar}>
            <X size={18} />
          </button>
        </header>
        <div className="detail-dialog-content">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
