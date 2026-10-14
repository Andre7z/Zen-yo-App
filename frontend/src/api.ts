export type Usuario = { id: number; nome: string; email: string; dojo_id: number | null }

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const CHAVE_TOKEN = 'zenyo_access_token'
let tokenEmMemoria: string | null = null

export function getToken() {
  try {
    return typeof window === 'undefined' ? tokenEmMemoria : window.localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return tokenEmMemoria
  }
}

export function saveToken(token: string) {
  tokenEmMemoria = token
  try {
    window.localStorage.setItem(CHAVE_TOKEN, token)
  } catch {
    // Mantém a sessão durante esta execução se o navegador bloquear o storage.
  }
}

export function clearToken() {
  tokenEmMemoria = null
  try {
    window.localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // O token em memória já foi removido.
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, autenticada = true): Promise<T> {
  const headers = new Headers(init.headers)
  const token = autenticada ? getToken() : null
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new Error(`Não foi possível conectar à API em ${API_URL}. Verifique se o backend está iniciado.`)
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(mensagemErro(payload, response.status))
  return payload as T
}

function mensagemErro(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = payload.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const mensagens = detail.map((item) => item && typeof item === 'object' && 'msg' in item ? String(item.msg) : '').filter(Boolean)
      if (mensagens.length) return mensagens.join(' ')
    }
  }
  return status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível concluir sua solicitação. Tente novamente.'
}