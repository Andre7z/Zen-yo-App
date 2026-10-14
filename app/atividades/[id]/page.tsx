"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  UserPlus,
  X,
  FileDown,
  Printer,
  CalendarDays,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ParticipantesAtividade } from "@/components/participantes-atividade"
import { TipoAtividadeBadge } from "@/components/tipo-atividade-badge"
import { useApp } from "@/components/app-provider"
import { TIPOS_ATIVIDADE, formatarData, resumoStatus } from "@/lib/atividades"
import { baixarRelatorioCsv, imprimirRelatorio } from "@/lib/relatorio"

export default function DetalheAtividadePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const {
    obterAtividade,
    excluirAtividade,
    alunos,
    adicionarParticipantes,
    removerParticipante,
    alternarStatusParticipante,
    atualizarObservacaoParticipante,
  } = useApp()

  const [confirmando, setConfirmando] = useState(false)

  const atividade = obterAtividade(params.id)

  if (!atividade) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-muted-foreground">Atividade não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/atividades")}>
          Voltar para atividades
        </Button>
      </div>
    )
  }

  const meta = TIPOS_ATIVIDADE[atividade.tipo]
  const { total, confirmados } = resumoStatus(atividade)

  function handleExcluir() {
    excluirAtividade(atividade!.id)
    router.push("/atividades")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/atividades"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para atividades
      </Link>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <TipoAtividadeBadge tipo={atividade.tipo} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmando(true)}
              aria-label="Excluir atividade"
            >
              <Trash2 />
            </Button>
          </div>
          <h1 className="mt-3 text-xl font-semibold text-foreground text-balance">{atividade.titulo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatarData(atividade.data)}
            </span>
            {atividade.local && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {atividade.local}
              </span>
            )}
          </div>
          {atividade.descricao && (
            <p className="mt-3 text-sm text-foreground/80 text-pretty">{atividade.descricao}</p>
          )}
        </div>

        {/* Barra de resumo e relatório */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{confirmados}</strong>/{total}{" "}
            {meta.rotuloStatus.toLowerCase()}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => imprimirRelatorio(atividade)}
              disabled={total === 0}
            >
              <Printer />
              Gerar relatório
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => baixarRelatorioCsv(atividade)}
              disabled={total === 0}
            >
              <FileDown />
              Exportar CSV
            </Button>
          </div>
        </div>

        <ParticipantesAtividade
          atividade={atividade}
          alunos={alunos}
          onAdicionar={(ids) => adicionarParticipantes(atividade.id, ids)}
          onRemover={(alunoId) => removerParticipante(atividade.id, alunoId)}
          onAlternarStatus={(alunoId) => alternarStatusParticipante(atividade.id, alunoId)}
          onAtualizarObservacao={(alunoId, observacao) =>
            atualizarObservacaoParticipante(atividade.id, alunoId, observacao)
          }
        />
      </div>

      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmando(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Excluir atividade</h2>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  Tem certeza que deseja excluir{" "}
                  <strong className="text-foreground">{atividade.titulo}</strong>? Esta ação não pode
                  ser desfeita.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" size="lg" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="lg" onClick={handleExcluir}>
                Sim, excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
