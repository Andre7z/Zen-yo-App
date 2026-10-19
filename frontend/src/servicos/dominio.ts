import { apiRequest } from '../api'

export type Identificado = { id: number }

export type Faixa = Identificado & { nome: string; tipo: 'Kyu' | 'Dan'; ordem: number }
export type Turma = Identificado & { nome: string }
export type Aluno = Identificado & {
  nome: string
  cpf: string | null
  data_nascimento: string | null
  faixa_id: number
  proxima_faixa: string | null
  turma_id: number | null
  turma: string | null
  tamanho_kimono: string | null
  tamanho_faixa: string | null
  codigo_zempo: string | null
}
export type Atividade = Identificado & {
  tipo: 'frequencia' | 'entrega_de_kimono' | 'troca_de_faixa'
  nome: string
  data: string
  local: string | null
  descricao: string | null
  aluno_ids: number[]
  aluno_ids_pagos: number[]
  nova_faixa: string | null
  presenca: boolean | null
}
export type Anexo = Identificado & {
  titulo: string
  categoria: 'Calendarios' | 'Panilhas' | 'Fichas' | 'Regulamento' | 'Regulamentos' | 'Outro'
  descricao: string | null
  nome_arquivo: string | null
  arquivo_url: string | null
  link: string | null
  criado_em: string
}

function recurso<T extends Identificado>(rota: string) {
  return {
    listar: () => apiRequest<T[]>(rota),
    criar: (dados: object) => apiRequest<T>(rota, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    }),
    atualizar: (id: number, dados: object) => apiRequest<T>(`${rota}${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    }),
    apagar: (id: number) => apiRequest<void>(`${rota}${id}`, { method: 'DELETE' }),
  }
}

export const alunosApi = recurso<Aluno>('/aluno/')
export const atividadesApi = recurso<Atividade>('/atividades/')
export const anexosApi = {
  ...recurso<Anexo>('/anexos/'),
  enviarArquivo: (dados: object, arquivo: File) => {
    const formulario = new FormData()
    Object.entries(dados).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined) formulario.append(chave, String(valor))
    })
    formulario.append('arquivo', arquivo)
    return apiRequest<Anexo>('/anexos/upload', { method: 'POST', body: formulario })
  },
  substituirArquivo: (id: number, dados: object, arquivo: File) => {
    const formulario = new FormData()
    Object.entries(dados).forEach(([chave, valor]) => {
      if (valor !== null && valor !== undefined) formulario.append(chave, String(valor))
    })
    formulario.append('arquivo', arquivo)
    return apiRequest<Anexo>(`/anexos/${id}/upload`, { method: 'POST', body: formulario })
  },
}
export const faixasApi = recurso<Faixa>('/faixas/')
export const turmasApi = recurso<Turma>('/turmas/')

export function relatorioAtividade(id: number) {
  return apiRequest<Array<Record<string, string | boolean | null>>>(`/atividades/${id}/relatorio`)
}
