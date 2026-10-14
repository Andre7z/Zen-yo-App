import type { Usuario } from './api'
import type { EventoAutenticacao } from './historico-autenticacao'

type AutenticacaoService = {
  cadastrar(nome: string, email: string, senha: string): Promise<Usuario>
  entrar(email: string, senha: string): Promise<{ access_token: string }>
  obterPerfil(): Promise<Usuario>
}

type Sessao = {
  obterToken(): string | null
  salvarToken(token: string): void
  limparToken(): void
}

type Historico = {
  registrar(evento: EventoAutenticacao): void
}

export class AutenticacaoFacade {
  private readonly autenticacaoService: AutenticacaoService
  private readonly sessao: Sessao
  private readonly historico: Historico

  constructor(autenticacaoService: AutenticacaoService, sessao: Sessao, historico: Historico) {
    this.autenticacaoService = autenticacaoService
    this.sessao = sessao
    this.historico = historico
  }

  async restaurarSessao(): Promise<Usuario | null> {
    if (!this.sessao.obterToken()) return null

    try {
      const usuario = await this.autenticacaoService.obterPerfil()
      this.historico.registrar('restauracao')
      return usuario
    } catch {
      this.sessao.limparToken()
      return null
    }
  }

  async entrar(email: string, senha: string): Promise<Usuario> {
    const { access_token } = await this.autenticacaoService.entrar(email, senha)
    this.sessao.salvarToken(access_token)

    try {
      const usuario = await this.autenticacaoService.obterPerfil()
      this.historico.registrar('login')
      return usuario
    } catch (erro) {
      this.sessao.limparToken()
      throw erro
    }
  }

  async cadastrar(nome: string, email: string, senha: string): Promise<Usuario> {
    await this.autenticacaoService.cadastrar(nome, email, senha)
    const usuario = await this.entrar(email, senha)
    this.historico.registrar('cadastro')
    return usuario
  }

  sair() {
    this.sessao.limparToken()
    this.historico.registrar('logout')
  }
}