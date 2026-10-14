export type UsuarioAutenticado = {
  id: number
  nome: string
  email: string
  dojo_id: number | null
}

type TokenResposta = { access_token: string; token_type: string }

const URL_API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")
const CHAVE_TOKEN = "zenyo_access_token"

export class ErroAutenticacao extends Error {
  status: number | null

  constructor(mensagem: string, status: number | null = null) {
    super(mensagem)
    this.name = "ErroAutenticacao"
    this.status = status
  }
}

export function obterToken(): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token: string): void {
  window.localStorage.setItem(CHAVE_TOKEN, token)
}

export function limparToken(): void {
  try {
    window.localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // O estado em memória ainda será encerrado se o navegador bloquear o armazenamento.
  }
}

async function requisitar<T>(caminho: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let resposta: Response
  try {
    resposta = await fetch(`${URL_API}${caminho}`, { ...init, headers })
  } catch {
    throw new ErroAutenticacao(`Não foi possível conectar à API em ${URL_API}. Verifique se o backend está iniciado.`)
  }

  const conteudo: unknown = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new ErroAutenticacao(mensagemErro(conteudo, resposta.status), resposta.status)
  }
  return conteudo as T
}

function mensagemErro(conteudo: unknown, status: number): string {
  if (conteudo && typeof conteudo === "object" && "detail" in conteudo) {
    const detalhe = conteudo.detail
    if (typeof detalhe === "string") return detalhe
    if (Array.isArray(detalhe)) {
      const mensagens = detalhe
        .map((item) => item && typeof item === "object" && "msg" in item ? String(item.msg) : "")
        .filter(Boolean)
      if (mensagens.length) return mensagens.join(" ")
    }
  }
  if (status === 401) return "E-mail ou senha incorretos."
  if (status === 409) return "Já existe uma conta com esse e-mail."
  if (status === 422) return "Confira os dados informados e tente novamente."
  return "Não foi possível concluir sua solicitação. Tente novamente."
}

export const autenticacaoService = {
  cadastrar(nome: string, email: string, senha: string) {
    return requisitar<UsuarioAutenticado>("/usuarios/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    })
  },

  entrar(email: string, senha: string) {
    return requisitar<TokenResposta>("/usuarios/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password: senha }).toString(),
    })
  },

  obterPerfil(token: string) {
    return requisitar<UsuarioAutenticado>("/usuarios/eu", {}, token)
  },
}