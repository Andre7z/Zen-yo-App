"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { useApp } from "@/components/app-provider"

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    autenticado,
    autenticacaoCarregando,
    erroAutenticacao,
    mensagemSucessoCadastro,
    limparMensagemSucessoCadastro,
  } = useApp()

  useEffect(() => {
    if (!autenticacaoCarregando && !autenticado && !erroAutenticacao) router.replace("/")
  }, [autenticado, autenticacaoCarregando, erroAutenticacao, router])

  if (autenticacaoCarregando) {
    return <main role="status" aria-label="Verificando sessão" className="min-h-dvh" />
  }
  if (erroAutenticacao) {
    return (
      <main role="alert" className="mx-auto max-w-lg px-4 py-12 text-center">
        <p>{erroAutenticacao}</p>
        <Link className="mt-4 inline-block underline" href="/">Voltar ao login</Link>
      </main>
    )
  }
  if (!autenticado) return null

  return (
    <div className="min-h-dvh bg-secondary/40">
      {mensagemSucessoCadastro && (
        <div role="status" className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 pt-4 text-sm">
          <p className="flex-1 rounded-lg border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-emerald-900">
            {mensagemSucessoCadastro}
          </p>
          <button className="shrink-0 underline" onClick={limparMensagemSucessoCadastro} type="button">
            Fechar
          </button>
        </div>
      )}
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  )
}
