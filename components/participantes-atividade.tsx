"use client"

import { useMemo, useState } from "react"
import { Check, Shirt, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/form-controls"
import { FaixaBadge } from "@/components/faixa-badge"
import { TIPOS_ATIVIDADE, type Atividade } from "@/lib/atividades"
import type { Aluno } from "@/lib/alunos"
import { cn } from "@/lib/utils"

export function ParticipantesAtividade({
  atividade,
  alunos,
  onAdicionar,
  onRemover,
  onAlternarStatus,
  onAtualizarObservacao,
}: {
  atividade: Atividade
  alunos: Aluno[]
  onAdicionar: (alunoIds: string[]) => void
  onRemover: (alunoId: string) => void
  onAlternarStatus: (alunoId: string) => void
  onAtualizarObservacao: (alunoId: string, observacao: string) => void
}) {
  const [adicionando, setAdicionando] = useState(false)
  const meta = TIPOS_ATIVIDADE[atividade.tipo]
  const alunosDisponiveis = alunos.filter(
    (aluno) => !atividade.participantes.some((participante) => participante.alunoId === aluno.id),
  )

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Alunos</h2>
        <Button size="sm" onClick={() => setAdicionando(true)}>
          <UserPlus />
          Adicionar alunos
        </Button>
      </div>

      {atividade.participantes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground text-balance">
            Nenhum aluno adicionado ainda. Clique em &quot;Adicionar alunos&quot; para incluir
            participantes.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {atividade.participantes.map((participante) => (
            <li
              key={participante.alunoId}
              className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-start"
            >
              <button
                type="button"
                onClick={() => onAlternarStatus(participante.alunoId)}
                aria-pressed={participante.status}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  participante.status
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:border-primary/50",
                )}
                aria-label={`Marcar ${participante.nome} como ${meta.rotuloStatus.toLowerCase()}`}
              >
                {participante.status && <Check className="size-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{participante.nome}</span>
                  <span className="text-xs text-muted-foreground">{participante.turma}</span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {atividade.tipo === "kimono" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Shirt className="size-3" />
                      Kimono {participante.tamanho_kimono || "—"}
                    </span>
                  )}
                  {atividade.tipo === "faixa" && (
                    <>
                      <FaixaBadge faixa={participante.faixa} />
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        Tamanho {participante.tamanho_faixa || "—"}
                      </span>
                    </>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      participante.status ? "text-green-700" : "text-muted-foreground",
                    )}
                  >
                    {participante.status
                      ? meta.rotuloStatus
                      : `Não ${meta.rotuloStatus.toLowerCase()}`}
                  </span>
                </div>

                <Input
                  value={participante.observacao}
                  onChange={(event) =>
                    onAtualizarObservacao(participante.alunoId, event.target.value)
                  }
                  placeholder="Observação (opcional)"
                  className="mt-2 h-8 text-xs"
                  aria-label={`Observação para ${participante.nome}`}
                />
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemover(participante.alunoId)}
                aria-label={`Remover ${participante.nome}`}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {adicionando && (
        <ModalAdicionarAlunos
          alunosDisponiveis={alunosDisponiveis}
          onFechar={() => setAdicionando(false)}
          onConfirmar={(alunoIds) => {
            onAdicionar(alunoIds)
            setAdicionando(false)
          }}
        />
      )}
    </div>
  )
}

function ModalAdicionarAlunos({
  alunosDisponiveis,
  onFechar,
  onConfirmar,
}: {
  alunosDisponiveis: Aluno[]
  onFechar: () => void
  onConfirmar: (ids: string[]) => void
}) {
  const [busca, setBusca] = useState("")
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return alunosDisponiveis
    return alunosDisponiveis.filter((aluno) => aluno.nome_aluno.toLowerCase().includes(termo))
  }, [alunosDisponiveis, busca])

  function alternar(id: string) {
    setSelecionados((atuais) => {
      const proximo = new Set(atuais)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-adicionar"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-xl border border-border bg-card shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 id="titulo-adicionar" className="text-base font-semibold text-foreground">
            Adicionar alunos
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onFechar} aria-label="Fechar">
            <X />
          </Button>
        </div>

        <div className="border-b border-border p-4">
          <Input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar aluno..."
            aria-label="Buscar aluno"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {alunosDisponiveis.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground text-balance">
              Todos os alunos já foram adicionados a esta atividade.
            </p>
          ) : filtrados.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Nenhum aluno encontrado.
            </p>
          ) : (
            <ul className="space-y-1">
              {filtrados.map((aluno) => {
                const marcado = selecionados.has(aluno.id)
                return (
                  <li key={aluno.id}>
                    <button
                      type="button"
                      onClick={() => alternar(aluno.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        marcado ? "bg-primary/10" : "hover:bg-accent/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                          marcado
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background",
                        )}
                      >
                        {marcado && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {aluno.nome_aluno}
                        </span>
                        <span className="block text-xs text-muted-foreground">{aluno.turma}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <span className="text-sm text-muted-foreground">
            {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
          </span>
          <Button
            size="lg"
            disabled={selecionados.size === 0}
            onClick={() => onConfirmar(Array.from(selecionados))}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  )
}