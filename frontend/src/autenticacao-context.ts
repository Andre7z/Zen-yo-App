import { createContext, useContext } from 'react'
import type { Usuario } from './api'

export type ContextoAutenticacao = {
  usuario: Usuario | null
  carregando: boolean
  entrar(email: string, senha: string): Promise<void>
  cadastrar(nome: string, email: string, senha: string): Promise<void>
  sair(): void
}

export const AutenticacaoContext = createContext<ContextoAutenticacao | null>(null)

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContext)
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de AutenticacaoProvider.')
  return contexto
}