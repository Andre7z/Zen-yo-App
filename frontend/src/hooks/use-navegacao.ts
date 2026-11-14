import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook que rastreia o histórico de navegação do usuário
 * Útil para retornar para a página anterior corretamente
 */
export function useNavegacao() {
  const location = useLocation()
  const historicoRef = useRef<string[]>([])

  useEffect(() => {
    // Adiciona a rota atual ao histórico
    if (!historicoRef.current.includes(location.pathname)) {
      historicoRef.current.push(location.pathname)
    }
  }, [location.pathname])

  function obterRotaAnterior(): string | null {
    if (historicoRef.current.length < 2) return null
    const indiceAtual = historicoRef.current.length - 1
    return historicoRef.current[indiceAtual - 1]
  }

  function limparHistorico() {
    historicoRef.current = [location.pathname]
  }

  return {
    rotaAnterior: obterRotaAnterior(),
    historico: historicoRef.current,
    limparHistorico,
  }
}
