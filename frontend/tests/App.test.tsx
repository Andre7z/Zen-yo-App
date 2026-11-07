import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { clearToken, getToken, saveToken } from '../src/api'
import { ROTAS } from '../src/routes'

const usuario = {
  id: 7,
  nome: 'Ana Silva',
  email: 'ana@example.com',
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
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Atividades' }))
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

  it('permite mostrar e ocultar a senha no login e no cadastro', async () => {
    window.history.replaceState({}, '', ROTAS.login)
    render(<App />)
    await screen.findByRole('heading', { name: 'Login' })
    const senha = screen.getByLabelText('Senha') as HTMLInputElement
    fireEvent.change(senha, { target: { value: 'senha-segura' } })
    expect(senha.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(senha.type).toBe('text')
    expect(senha.value).toBe('senha-segura')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(senha.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cadastre-se' }))
    await screen.findByRole('heading', { name: 'Cadastro' })
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect((screen.getByLabelText('Senha') as HTMLInputElement).type).toBe('text')
  })

  it('mostra cada senha do perfil separadamente e volta a ocultá-las ao reabrir', async () => {
    saveToken('token-inicial')
    window.history.replaceState({}, '', ROTAS.perfil)
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
    const atual = screen.getByLabelText('Senha atual') as HTMLInputElement
    const nova = screen.getByLabelText('Nova senha') as HTMLInputElement
    const confirmar = screen.getByLabelText('Confirmar nova senha') as HTMLInputElement
    fireEvent.change(nova, { target: { value: 'senha-segura' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nova senha' }))
    expect([atual.type, nova.type, confirmar.type]).toEqual(['password', 'text', 'password'])
    expect(nova.value).toBe('senha-segura')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar nova senha' }))
    expect(nova.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha atual' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmar nova senha' }))
    expect([atual.type, nova.type, confirmar.type]).toEqual(['text', 'password', 'text'])
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    expect((screen.getByLabelText('Senha atual') as HTMLInputElement).type).toBe('password')
    expect((screen.getByLabelText('Confirmar nova senha') as HTMLInputElement).type).toBe('password')
  })

  it('restaura a sessão persistida ao carregar o aplicativo', async () => {
    localStorage.setItem('zenyo_access_token', 'token-persistido')

    render(<App />)

    expect(await screen.findByRole('navigation', { name: 'Navegação principal' })).toBeTruthy()
    expect(screen.getAllByText(usuario.nome).length).toBeGreaterThan(0)
    expect(getToken()).toBe('token-persistido')
  })

  it('armazena o token no localStorage', () => {
    saveToken('token-persistido')

    expect(getToken()).toBe('token-persistido')
    expect(localStorage.getItem('zenyo_access_token')).toBe('token-persistido')
  })
})