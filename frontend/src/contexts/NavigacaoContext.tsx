import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface NavigacaoContexto {
  rotaAnterior: string | null
  historicoCompleto: string[]
  voltarParaAnterior: () => string | null
}

const NavigacaoContext = createContext<NavigacaoContexto | undefined>(undefined)

export function NavigacaoProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const historicoRef = useRef<string[]>([])

  useEffect(() => {
    // Atualiza o histórico quando a localização muda
    if (!historicoRef.current.includes(location.pathname)) {
      historicoRef.current.push(location.pathname)
    }
  }, [location.pathname])

  const rotaAnterior = historicoRef.current.length > 1 
    ? historicoRef.current[historicoRef.current.length - 2] 
    : null

  function voltarParaAnterior(): string | null {
    if (historicoRef.current.length > 1) {
      historicoRef.current.pop()
      return historicoRef.current[historicoRef.current.length - 1]
    }
    return null
  }

  const valor: NavigacaoContexto = {
    rotaAnterior,
    historicoCompleto: historicoRef.current,
    voltarParaAnterior,
  }

  return (
    <NavigacaoContext.Provider value={valor}>
      {children}
    </NavigacaoContext.Provider>
  )
}

export function useNavegacaoHistorico() {
  const contexto = useContext(NavigacaoContext)
  if (!contexto) {
    throw new Error('useNavegacaoHistorico deve ser usado dentro de NavigacaoProvider')
  }
  return contexto
}
