import { apiRequest, nomeArquivoSeguro } from '../api'
import { primeiroEUltimoNome } from './nomes'

export type Identificado = { id: number }

export type Faixa = Identificado & { nome: string; tipo: 'Iniciante' | 'Kyu' | 'Dan'; grau: number | null; ordem: number }
export const formatarGrau = (grau: number) => String(grau).replace('.', ',')
export const rotuloFaixa = (faixa: Faixa) => faixa.grau ? `${faixa.nome} - ${formatarGrau(faixa.grau)}º ${faixa.tipo}` : faixa.nome
export type Turma = Identificado & { nome: string; nucleo: string | null }
export type ChamadaTurma = {
  data: string
  registrada: boolean
  alunos: { aluno_id: number; nome: string; presente: boolean }[]
}
export type Aluno = Identificado & {
  nome: string
  cpf: string | null
  data_nascimento: string | null
  genero?: 'Masculino' | 'Feminino' | null
  faixa_id: number
  proxima_faixa: string | null
  turma_ids: number[]
  celular: string | null
  tamanho_kimono: string | null
  tamanho_faixa: string | null
  faixa_grossa: boolean
  codigo_zempo: string | null
  peso: number | null
  responsavel_nome: string | null
  responsavel_cpf: string | null
  responsavel_celular: string | null
  responsavel_parentesco: string | null
}
export function ordenarAlunosPorNome(alunos: Aluno[]) {
  return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
}
export const TAMANHOS_KIMONO = ['M00', 'M0', 'M1', 'M2', 'M3', 'A0', 'A1', 'A2', 'A4', 'A5']
export const TAMANHOS_FAIXA = ['PP', 'P', 'N2', 'M', 'G', 'N4', 'GG']
export type Tamanho = Identificado & { tipo: 'kimono' | 'faixa'; nome: string; ordem: number }
export type Atividade = Identificado & {
  tipo: 'frequencia' | 'entrega_de_kimono' | 'troca_de_faixa' | 'campeonato'
  nome: string
  data: string
  local: string | null
  descricao: string | null
  aluno_ids: number[]
  aluno_ids_confirmados: number[]
  nova_faixa: string | null
}
export type Anexo = Identificado & {
  titulo: string
  categoria: 'Calendarios' | 'Panilhas' | 'Fichas' | 'Apostilas' | 'Apostila' | 'Regulamento' | 'Regulamentos' | 'Outro'
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
export const atividadesApi = {
  ...recurso<Atividade>('/atividades/'),
  graduar: (id: number, alunos: { aluno_id: number; faixa_id: number; tamanho_faixa: string | null; faixa_grossa: boolean }[]) =>
    apiRequest<Aluno[]>(`/atividades/${id}/graduacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunos }),
    }),
}
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
export const turmasApi = {
  ...recurso<Turma>('/turmas/'),
  adicionarAlunos: (turmaId: number, alunoIds: number[]) => apiRequest<void>(`/turmas/${turmaId}/alunos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aluno_ids: alunoIds }),
  }),
  removerAluno: (turmaId: number, alunoId: number) => apiRequest<void>(`/turmas/${turmaId}/alunos/${alunoId}`, {
    method: 'DELETE',
  }),
  listarFrequencias: (turmaId: number) => apiRequest<string[]>(`/turmas/${turmaId}/frequencias`),
  consultarFrequencia: (turmaId: number, data: string) => apiRequest<ChamadaTurma>(`/turmas/${turmaId}/frequencias/${data}`),
  salvarFrequencia: (turmaId: number, data: string, alunos: { aluno_id: number; presente: boolean }[]) =>
    apiRequest<ChamadaTurma>(`/turmas/${turmaId}/frequencias/${data}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunos }),
    }),
}
export const tamanhosApi = recurso<Tamanho>('/tamanhos/')

const PLANILHAS_XLSX_POR_TIPO: Record<string, string> = {
  troca_de_faixa: 'controle-de-faixas',
  entrega_de_kimono: 'controle-de-kimonos',
  frequencia: 'controle-de-frequencia',
  campeonato: 'controle-de-campeonato',
}

export function caminhoPlanilhaXlsx(tipo: string, id: number) {
  const nome = PLANILHAS_XLSX_POR_TIPO[tipo]
  return nome ? `/atividades/${id}/planilha/${nome}.xlsx` : null
}

export function nomeArquivoPlanilhaXlsx(nome: string, professor: string) {
  const atividade = nomeArquivoSeguro(nome).trim().toUpperCase() || 'PLANILHA'
  return nomeArquivoSeguro(`${atividade} - SENSEI ${primeiroEUltimoNome(professor).toUpperCase()}.xlsx`)
}

export const rotuloTipoAtividade = (tipo: string) => tipo === 'entrega_de_kimono' ? 'entrega de judogi' : tipo.replaceAll('_', ' ')
