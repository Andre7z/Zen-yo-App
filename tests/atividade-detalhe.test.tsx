import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppProvider } from "@/components/app-provider"
import DetalheAtividadePage from "@/app/atividades/[id]/page"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "a1" }),
  useRouter: () => ({ push }),
}))

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

function renderDetalheAtividade() {
  return render(
    <AppProvider>
      <DetalheAtividadePage />
    </AppProvider>,
  )
}

function resumoVisivel() {
  return screen.getByText((_, elemento) => {
    return elemento?.tagName === "P" && /^\d+\/\d+/.test(elemento.textContent ?? "")
  })
}

describe("detalhe da atividade", () => {
  beforeEach(() => push.mockReset())
  afterEach(() => cleanup())

  it("exibe os dados e permite alterar status, observação e participante", () => {
    renderDetalheAtividade()

    expect(screen.getByRole("heading", { name: "Treino de terça — Infantil" })).toBeTruthy()
    expect(screen.getByText("Ana Beatriz Costa")).toBeTruthy()
    expect(screen.getByText("Eduarda Rocha Nunes")).toBeTruthy()

    const status = screen.getByRole("button", {
      name: "Marcar Ana Beatriz Costa como presente",
    })
    expect(status.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(status)
    expect(status.getAttribute("aria-pressed")).toBe("false")
    expect(resumoVisivel().textContent).toBe("0/2 presente")

    const observacao = screen.getByRole("textbox", {
      name: "Observação para Ana Beatriz Costa",
    }) as HTMLInputElement
    fireEvent.change(observacao, { target: { value: "Chegou atrasada" } })
    expect(observacao.value).toBe("Chegou atrasada")

    fireEvent.click(screen.getByRole("button", { name: "Remover Ana Beatriz Costa" }))
    expect(screen.queryByText("Ana Beatriz Costa")).toBeNull()
    expect(resumoVisivel().textContent).toBe("0/1 presente")
  })

  it("adiciona ao treino um aluno selecionado", () => {
    renderDetalheAtividade()

    fireEvent.click(screen.getByRole("button", { name: "Adicionar alunos" }))
    fireEvent.click(screen.getByRole("button", { name: /Bruno Henrique Lima/ }))
    fireEvent.click(screen.getByRole("button", { name: /^Adicionar$/ }))

    expect(screen.getByText("Bruno Henrique Lima")).toBeTruthy()
    expect(resumoVisivel().textContent).toBe("1/3 presente")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("preserva a atividade ao cancelar e a exclui após confirmação", () => {
    renderDetalheAtividade()

    fireEvent.click(screen.getByRole("button", { name: "Excluir atividade" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(screen.getByRole("heading", { name: "Treino de terça — Infantil" })).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Excluir atividade" }))
    fireEvent.click(screen.getByRole("button", { name: "Sim, excluir" }))

    expect(screen.getByText("Atividade não encontrada.")).toBeTruthy()
    expect(push).toHaveBeenCalledWith("/atividades")
  })
})