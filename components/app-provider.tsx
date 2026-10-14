"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { autenticacaoService, ErroAutenticacao, limparToken, obterToken, salvarToken } from "@/lib/autenticacao"
import { ALUNOS_INICIAIS, type Aluno } from "@/lib/alunos"
import {
  dataHojeISO,
  type Atividade,
  type NovaAtividade,
  type Participante,
  type TipoAtividade,
} from "@/lib/atividades"
import type { Anexo, NovoAnexo } from "@/lib/anexos"

type NovoAluno = Omit<Aluno, "id">

// Cria um participante a partir de um aluno (capturando um instantâneo dos dados)
function participanteDeAluno(aluno: Aluno): Participante {
  return {
    alunoId: aluno.id,
    nome: aluno.nome_aluno,
    turma: aluno.turma,
    faixa: aluno.faixa,
    tamanho_kimono: aluno.tamanho_kimono,
    tamanho_faixa: aluno.tamanho_faixa,
    status: false,
    observacao: "",
  }
}

// Dados de exemplo de atividades
const ATIVIDADES_INICIAIS: Atividade[] = [
  {
    id: "a1",
    tipo: "presenca",
    titulo: "Treino de terça — Infantil",
    data: dataHojeISO(),
    local: "Tatame principal",
    descricao: "Aquecimento, ukemi e randori leve.",
    participantes: [
      { alunoId: "1", nome: "Ana Beatriz Costa", turma: "Infantil A", faixa: "Amarela", tamanho_kimono: "M2", tamanho_faixa: "1", status: true, observacao: "" },
      { alunoId: "5", nome: "Eduarda Rocha Nunes", turma: "Infantil B", faixa: "Branca", tamanho_kimono: "M1", tamanho_faixa: "0", status: false, observacao: "Avisou que faltaria." },
    ],
  },
  {
    id: "a2",
    tipo: "kimono",
    titulo: "Entrega de kimonos novos",
    data: dataHojeISO(),
    local: "Recepção",
    descricao: "Distribuição do lote de kimonos encomendados.",
    participantes: [
      { alunoId: "2", nome: "Bruno Henrique Lima", turma: "Juvenil", faixa: "Verde", tamanho_kimono: "A1", tamanho_faixa: "3", status: true, observacao: "" },
      { alunoId: "6", nome: "Felipe Araújo Souza", turma: "Adulto", faixa: "Azul", tamanho_kimono: "A2", tamanho_faixa: "4", status: false, observacao: "" },
    ],
  },
  {
    id: "a3",
    tipo: "faixa",
    titulo: "Exame de faixa — 1º semestre",
    data: dataHojeISO(),
    local: "Dojo central",
    descricao: "Avaliação técnica para graduação.",
    participantes: [
      { alunoId: "3", nome: "Carla Mendes Oliveira", turma: "Adulto", faixa: "Roxa", tamanho_kimono: "A2", tamanho_faixa: "4", status: true, observacao: "Aprovada para marrom." },
      { alunoId: "4", nome: "Diego Santos Ferreira", turma: "Master", faixa: "Preta", tamanho_kimono: "A3", tamanho_faixa: "5", status: false, observacao: "" },
    ],
  },
]

type AppContextType = {
  autenticado: boolean
  autenticacaoCarregando: boolean
  erroAutenticacao: string | null
  mensagemSucessoCadastro: string | null
  limparMensagemSucessoCadastro: () => void
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => void
  // Alunos
  alunos: Aluno[]
  obterAluno: (id: string) => Aluno | undefined
  criarAluno: (dados: NovoAluno) => Aluno
  atualizarAluno: (id: string, dados: NovoAluno) => void
  excluirAluno: (id: string) => void
  // Atividades
  atividades: Atividade[]
  obterAtividade: (id: string) => Atividade | undefined
  criarAtividade: (dados: NovaAtividade) => Atividade
  atualizarAtividade: (id: string, dados: NovaAtividade) => void
  excluirAtividade: (id: string) => void
  adicionarParticipantes: (atividadeId: string, alunoIds: string[]) => void
  removerParticipante: (atividadeId: string, alunoId: string) => void
  alternarStatusParticipante: (atividadeId: string, alunoId: string) => void
  atualizarObservacaoParticipante: (atividadeId: string, alunoId: string, observacao: string) => void
  // Anexos
  anexos: Anexo[]
  criarAnexo: (dados: NovoAnexo) => Anexo
  excluirAnexo: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false)
  const [autenticacaoCarregando, setAutenticacaoCarregando] = useState(true)
  const [erroAutenticacao, setErroAutenticacao] = useState<string | null>(null)
  const [mensagemSucessoCadastro, setMensagemSucessoCadastro] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>(ALUNOS_INICIAIS)
  const [atividades, setAtividades] = useState<Atividade[]>(ATIVIDADES_INICIAIS)
  const [anexos, setAnexos] = useState<Anexo[]>([])

  useEffect(() => {
    let ativo = true
    const token = obterToken()

    if (!token) {
      setAutenticacaoCarregando(false)
      return () => { ativo = false }
    }

    void autenticacaoService.obterPerfil(token)
      .then(() => {
        if (ativo) setAutenticado(true)
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        if (erro instanceof ErroAutenticacao && (erro.status === 401 || erro.status === 403)) {
          limparToken()
          setAutenticado(false)
          return
        }
        setErroAutenticacao(erro instanceof Error ? erro.message : "Não foi possível verificar sua sessão.")
      })
      .finally(() => {
        if (ativo) setAutenticacaoCarregando(false)
      })

    return () => { ativo = false }
  }, [])

  async function entrar(email: string, senha: string) {
    setErroAutenticacao(null)
    setMensagemSucessoCadastro(null)
    const { access_token: token } = await autenticacaoService.entrar(email, senha)
    try {
      salvarToken(token)
      await autenticacaoService.obterPerfil(token)
      setAutenticado(true)
    } catch (erro) {
      limparToken()
      setAutenticado(false)
      throw erro
    }
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    await autenticacaoService.cadastrar(nome, email, senha)
    await entrar(email, senha)
    setMensagemSucessoCadastro("Conta criada com sucesso. Você já está conectado.")
  }

  function sair() {
    limparToken()
    setErroAutenticacao(null)
    setMensagemSucessoCadastro(null)
    setAutenticado(false)
  }

  const value = useMemo<AppContextType>(
    () => ({
      autenticado,
      autenticacaoCarregando,
      erroAutenticacao,
      mensagemSucessoCadastro,
      limparMensagemSucessoCadastro: () => setMensagemSucessoCadastro(null),
      entrar,
      cadastrar,
      sair,

      alunos,
      obterAluno: (id) => alunos.find((a) => a.id === id),
      criarAluno: (dados) => {
        const novo: Aluno = { id: crypto.randomUUID(), ...dados }
        setAlunos((atuais) => [novo, ...atuais])
        return novo
      },
      atualizarAluno: (id, dados) => {
        setAlunos((atuais) => atuais.map((a) => (a.id === id ? { ...a, ...dados } : a)))
      },
      excluirAluno: (id) => {
        setAlunos((atuais) => atuais.filter((a) => a.id !== id))
      },

      atividades,
      obterAtividade: (id) => atividades.find((a) => a.id === id),
      criarAtividade: (dados) => {
        const nova: Atividade = { id: crypto.randomUUID(), participantes: [], ...dados }
        setAtividades((atuais) => [nova, ...atuais])
        return nova
      },
      atualizarAtividade: (id, dados) => {
        setAtividades((atuais) => atuais.map((a) => (a.id === id ? { ...a, ...dados } : a)))
      },
      excluirAtividade: (id) => {
        setAtividades((atuais) => atuais.filter((a) => a.id !== id))
      },
      adicionarParticipantes: (atividadeId, alunoIds) => {
        setAtividades((atuais) =>
          atuais.map((a) => {
            if (a.id !== atividadeId) return a
            const jaExistem = new Set(a.participantes.map((p) => p.alunoId))
            const novos = alunoIds
              .filter((id) => !jaExistem.has(id))
              .map((id) => alunos.find((al) => al.id === id))
              .filter((al): al is Aluno => Boolean(al))
              .map(participanteDeAluno)
            return { ...a, participantes: [...a.participantes, ...novos] }
          }),
        )
      },
      removerParticipante: (atividadeId, alunoId) => {
        setAtividades((atuais) =>
          atuais.map((a) =>
            a.id === atividadeId
              ? { ...a, participantes: a.participantes.filter((p) => p.alunoId !== alunoId) }
              : a,
          ),
        )
      },
      alternarStatusParticipante: (atividadeId, alunoId) => {
        setAtividades((atuais) =>
          atuais.map((a) =>
            a.id === atividadeId
              ? {
                  ...a,
                  participantes: a.participantes.map((p) =>
                    p.alunoId === alunoId ? { ...p, status: !p.status } : p,
                  ),
                }
              : a,
          ),
        )
      },
      atualizarObservacaoParticipante: (atividadeId, alunoId, observacao) => {
        setAtividades((atuais) =>
          atuais.map((a) =>
            a.id === atividadeId
              ? {
                  ...a,
                  participantes: a.participantes.map((p) =>
                    p.alunoId === alunoId ? { ...p, observacao } : p,
                  ),
                }
              : a,
          ),
        )
      },

      anexos,
      criarAnexo: (dados) => {
        const novo: Anexo = { id: crypto.randomUUID(), criadoEm: dataHojeISO(), ...dados }
        setAnexos((atuais) => [novo, ...atuais])
        return novo
      },
      excluirAnexo: (id) => {
        setAnexos((atuais) => atuais.filter((a) => a.id !== id))
      },
    }),
    [autenticado, autenticacaoCarregando, erroAutenticacao, mensagemSucessoCadastro, alunos, atividades, anexos],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider")
  return ctx
}

// Reexport para uso conveniente
export type { TipoAtividade }
