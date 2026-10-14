import { useEffect, useState, type ReactNode } from 'react'
import type { Usuario } from './api'
import { autenticacaoFacade } from './autenticacao-dependencias'
import { AutenticacaoContext } from './autenticacao-context'

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    void autenticacaoFacade.restaurarSessao().then((perfil) => {
      if (ativo) setUsuario(perfil)
    }).finally(() => {
      if (ativo) setCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  async function entrar(email: string, senha: string) {
    setUsuario(await autenticacaoFacade.entrar(email, senha))
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    setUsuario(await autenticacaoFacade.cadastrar(nome, email, senha))
  }

  function sair() {
    autenticacaoFacade.sair()
    setUsuario(null)
  }

  return (
    <AutenticacaoContext.Provider value={{ usuario, carregando, entrar, cadastrar, sair }}>
      {children}
    </AutenticacaoContext.Provider>
  )
}