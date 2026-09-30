export type Usuario = { id: number; nome: string; email: string; dojo_id: number | null }

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'zenyo_access_token'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function saveToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

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