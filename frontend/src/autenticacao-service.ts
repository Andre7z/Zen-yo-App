import { apiRequest, type Usuario } from './api'

export const autenticacaoService = {
  cadastrar(nome: string, email: string, senha: string) {
    return apiRequest<Usuario>('/usuarios/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    }, false)
  },

  entrar(email: string, senha: string) {
    return apiRequest<{ access_token: string }>('/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password: senha }),
    }, false)
  },

  obterPerfil() {
    return apiRequest<Usuario>('/usuarios/eu')
  },
}