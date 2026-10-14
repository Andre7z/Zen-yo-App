import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppHeader } from "@/components/app-header"
import { AppProvider } from "@/components/app-provider"
import { ProtectedShell } from "@/components/protected-shell"
import { useApp } from "@/components/app-provider"
import { limparToken, obterToken } from "@/lib/autenticacao"
import CadastroPage from "@/app/cadastro/page"
import LoginPage from "@/app/page"

const { push, replace, pathname } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: vi.fn(() => "/alunos"),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: pathname,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const usuario = { id: 17, nome: "Ana Silva", email: "ana@example.com", dojo_id: null }
const requisicao = vi.fn<typeof fetch>()

function configurarApi() {
  requisicao.mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.endsWith("/usuarios/") && init?.method === "POST") {
      return Response.json(usuario, { status: 201 })
    }
    if (url.endsWith("/usuarios/login") && init?.method === "POST") {
      return Response.json({ access_token: "token-de-teste", token_type: "bearer" })
    }
    if (url.endsWith("/usuarios/eu")) return Response.json(usuario)
    return Response.json({ detail: "Não encontrado" }, { status: 404 })
  })
  vi.stubGlobal("fetch", requisicao)
}

function FluxoCadastro() {
  const { autenticado } = useApp()
  return autenticado
    ? <ProtectedShell><p>Área autenticada</p></ProtectedShell>
    : <CadastroPage />
}

describe("autenticação com a API", () => {
  beforeEach(() => {
    limparToken()
    localStorage.clear()
    push.mockReset()
    replace.mockReset()
    requisicao.mockReset()
    configurarApi()
  })

  afterEach(() => {
    cleanup()
    limparToken()
    vi.unstubAllGlobals()
  })

  it("cria a conta no backend, autentica e navega após confirmação", async () => {
    render(<AppProvider><FluxoCadastro /></AppProvider>)

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: usuario.nome } })
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/alunos"))
    expect((await screen.findByRole("status")).textContent).toContain("Conta criada com sucesso")
    expect(JSON.parse(String(requisicao.mock.calls[0][1]?.body))).toEqual({
      nome: usuario.nome,
      email: usuario.email,
      senha: "senha-segura",
    })
    expect(requisicao.mock.calls[0][0]).toContain("/usuarios/")
    expect(requisicao.mock.calls[1][0]).toContain("/usuarios/login")
    expect(obterToken()).toBe("token-de-teste")
  })

  it("impede dados inválidos antes de enviar ao backend", async () => {
    render(<AppProvider><CadastroPage /></AppProvider>)

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "A" } })
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "email-invalido" } })
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "123" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    expect(await screen.findByText("Informe um nome com ao menos 2 caracteres.")).toBeTruthy()
    expect(screen.getByText("E-mail em formato inválido.")).toBeTruthy()
    expect(screen.getByText("A senha deve ter ao menos 6 caracteres.")).toBeTruthy()
    expect(requisicao).not.toHaveBeenCalled()
  })

  it("exibe recusas do backend e falhas de conexão sem simular sucesso", async () => {
    requisicao.mockResolvedValueOnce(Response.json(
      { detail: "Já existe uma conta com esse e-mail" },
      { status: 409 },
    ))
    const { unmount } = render(<AppProvider><CadastroPage /></AppProvider>)
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: usuario.nome } })
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))
    expect((await screen.findByRole("alert")).textContent).toContain("Já existe uma conta")
    expect(obterToken()).toBeNull()

    unmount()
    requisicao.mockRejectedValueOnce(new TypeError("offline"))
    render(<AppProvider><CadastroPage /></AppProvider>)
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: usuario.nome } })
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))
    expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível conectar à API")
    expect(obterToken()).toBeNull()
  })

  it("mantém o login após recarregar e valida o token ao restaurar o provider", async () => {
    const { unmount } = render(<AppProvider><LoginPage /></AppProvider>)
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } })
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }))
    await waitFor(() => expect(push).toHaveBeenCalledWith("/alunos"))
    expect(obterToken()).toBe("token-de-teste")

    unmount()
    render(<AppProvider><ProtectedShell><p>Conteúdo protegido</p></ProtectedShell></AppProvider>)
    expect(await screen.findByText("Conteúdo protegido")).toBeTruthy()
    const consultaPerfil = requisicao.mock.calls.find(([url]) => String(url).endsWith("/usuarios/eu"))
    expect((consultaPerfil?.[1]?.headers as Headers).get("Authorization")).toBe("Bearer token-de-teste")
  })

  it("redireciona um visitante sem sessão para a tela pública", async () => {
    render(<AppProvider><ProtectedShell><p>Conteúdo protegido</p></ProtectedShell></AppProvider>)

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"))
    expect(screen.queryByText("Conteúdo protegido")).toBeNull()
    expect(requisicao).not.toHaveBeenCalled()
  })

  it("não redireciona nem apaga uma sessão válida se a API estiver indisponível", async () => {
    localStorage.setItem("zenyo_access_token", "token-de-teste")
    requisicao.mockRejectedValueOnce(new TypeError("offline"))
    render(<AppProvider><ProtectedShell><p>Conteúdo protegido</p></ProtectedShell></AppProvider>)

    expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível conectar à API")
    expect(obterToken()).toBe("token-de-teste")
    expect(replace).not.toHaveBeenCalled()
  })

  it("redireciona uma sessão restaurada para fora da tela de login", async () => {
    localStorage.setItem("zenyo_access_token", "token-de-teste")
    render(<AppProvider><LoginPage /></AppProvider>)

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/alunos"))
  })

  it("encerra a sessão e remove o token persistido", async () => {
    localStorage.setItem("zenyo_access_token", "token-de-teste")
    render(<AppProvider><AppHeader /></AppProvider>)

    fireEvent.click(screen.getByRole("button", { name: "Sair" }))

    expect(obterToken()).toBeNull()
    expect(push).toHaveBeenCalledWith("/")
  })

  it("descarta token expirado e redireciona a rota protegida", async () => {
    localStorage.setItem("zenyo_access_token", "token-expirado")
    requisicao.mockImplementation(async () => Response.json(
      { detail: "Token invalido ou vencido" },
      { status: 401 },
    ))
    render(<AppProvider><ProtectedShell><p>Conteúdo protegido</p></ProtectedShell></AppProvider>)

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"))
    expect(obterToken()).toBeNull()
    expect(screen.queryByText("Conteúdo protegido")).toBeNull()
  })
})