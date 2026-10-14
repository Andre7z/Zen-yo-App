"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { BeltIcon } from "@/components/belt-icon"
import { Button } from "@/components/ui/button"
import { Campo, ErroCampo, Input, Label } from "@/components/form-controls"
import { useApp } from "@/components/app-provider"

type Erros = { nome?: string; email?: string; senha?: string }

export default function CadastroPage() {
  const router = useRouter()
  const { entrar, cadastrar, autenticado, autenticacaoCarregando } = useApp()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [erroApi, setErroApi] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!autenticacaoCarregando && autenticado) router.replace("/alunos")
  }, [autenticado, autenticacaoCarregando, router])

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const novos: Erros = {}
    if (nome.trim().length < 2) novos.nome = "Informe um nome com ao menos 2 caracteres."
    if (!email.trim()) novos.email = "Informe um e-mail válido."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) novos.email = "E-mail em formato inválido."
    if (!senha) novos.senha = "Crie uma senha."
    else if (senha.length < 6) novos.senha = "A senha deve ter ao menos 6 caracteres."

    if (Object.keys(novos).length > 0) {
      setErros(novos)
      return
    }
    setErros({})
    setErroApi("")
    setEnviando(true)
    try {
      await cadastrar(nome.trim(), email.trim(), senha)
      router.push("/alunos")
    } catch (falha) {
      setErroApi(falha instanceof Error ? falha.message : "Não foi possível criar sua conta.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            className="mb-4 flex size-12 items-center justify-center rounded-xl border"
            style={{ backgroundColor: "#f4f4f5", borderColor: "rgba(0,0,0,0.1)", color: "#0a0a0a" }}
          >
            <BeltIcon className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold text-foreground">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground text-balance">
            Cadastre-se para gerenciar seus alunos de judô
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {erroApi && <p role="alert" className="text-sm text-destructive">{erroApi}</p>}
            <Campo>
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                autoComplete="name"
                minLength={2}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setErros((x) => ({ ...x, nome: undefined }))
                }}
                placeholder="Ex.: Prof. Ricardo Tanaka"
                aria-invalid={!!erros.nome}
              />
              <ErroCampo>{erros.nome}</ErroCampo>
            </Campo>

            <Campo>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErros((x) => ({ ...x, email: undefined }))
                }}
                placeholder="voce@exemplo.com"
                aria-invalid={!!erros.email}
              />
              <ErroCampo>{erros.email}</ErroCampo>
            </Campo>

            <Campo>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setErros((x) => ({ ...x, senha: undefined }))
                }}
                placeholder="Mínimo de 6 caracteres"
                aria-invalid={!!erros.senha}
              />
              <ErroCampo>{erros.senha}</ErroCampo>
            </Campo>

            {erroApi && <div className="flex items-start gap-2 rounded-lg bg-accent/60 px-3 py-2.5 text-xs text-muted-foreground"><AlertCircle className="mt-0.5 size-3.5 shrink-0" /><span>A conta só é criada quando o backend confirma o cadastro.</span></div>}

            <Button type="submit" size="lg" className="w-full" disabled={enviando}>
              {enviando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para o login
        </Link>
      </div>
    </main>
  )
}
