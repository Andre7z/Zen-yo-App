import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearToken, getToken, saveToken } from './api'
import { ROTAS } from './routes'

const usuario = {
  id: 7,
  nome: 'Ana Silva',
  email: 'ana@example.com',
  dojo_id: null,
}

function configurarApi() {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const endereco = String(input)
    if (endereco.endsWith('/usuarios/login') && init?.method === 'POST') {
      return Response.json({ access_token: 'token-de-teste' })
    }
    if (endereco.endsWith('/usuarios/eu')) return Response.json(usuario)
    return Response.json({ detail: 'Não encontrado' }, { status: 404 })
  }))
}

describe('sessão e navegação protegida', () => {
  beforeEach(() => {
    clearToken()
    window.history.replaceState({}, '', ROTAS.atividades)
    configurarApi()
  })

  afterEach(() => {
    cleanup()
    clearToken()
    vi.unstubAllGlobals()
  })

  it('redireciona para login ao abrir uma rota protegida sem sessão', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy()
    expect(window.location.pathname).toBe(ROTAS.login)
  })

  it('mostra nome e e-mail no menu e encerra a sessão ao sair', async () => {
    saveToken('token-inicial')
    window.history.replaceState({}, '', ROTAS.inicio)
    render(<App />)

    expect(await screen.findByRole('navigation', { name: 'Navegação principal' })).toBeTruthy()
    expect(screen.getAllByText(usuario.nome).length).toBeGreaterThan(0)
    expect(screen.getAllByText(usuario.email).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('link', { name: 'Atividades' }))
    expect(await screen.findByRole('heading', { name: 'Atividades' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy()
    expect(getToken()).toBeNull()
  })

  it('atualiza as telas consumidoras do Provider após autenticar', async () => {
    window.history.replaceState({}, '', ROTAS.login)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-segura' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeTruthy())
    expect(screen.getAllByText(usuario.nome).length).toBeGreaterThan(0)
    expect(getToken()).toBe('token-de-teste')
  })

  it('mantém o token somente na memória', () => {
    saveToken('token-efemero')

    expect(getToken()).toBe('token-efemero')
    expect(localStorage.getItem('zenyo_access_token')).toBeNull()
  })
})