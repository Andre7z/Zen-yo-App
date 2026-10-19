import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearToken, saveToken } from './api'
import { ROTAS } from './routes'

const usuario = { id: 4, nome: 'Ana Professora', email: 'ana@example.com' }
const faixa = { id: 2, nome: 'Amarela', tipo: 'Kyu', ordem: 4 }
const faixaSeguinte = { id: 3, nome: 'Laranja', tipo: 'Kyu', ordem: 5 }
const aluno = {
  id: 7,
  nome: 'Caio Silva',
  cpf: '12345678901',
  data_nascimento: null,
  faixa_id: 2,
  proxima_faixa: null,
  turma_id: 5,
  turma: 'Infantil',
  tamanho_kimono: 'M2',
  tamanho_faixa: '2',
  codigo_zempo: 'ZP001',
}
const alunoOutraTurma = { ...aluno, id: 8, nome: 'Lia Santos', turma_id: 6, turma: 'Adultos' }
const atividade = {
  id: 9,
  tipo: 'frequencia',
  nome: 'Treino infantil',
  data: '2026-10-13',
  local: 'Tatame 1',
  descricao: null,
  aluno_ids: [7],
  aluno_ids_pagos: [],
  nova_faixa: null,
  presenca: true,
}
const atividadeFaixa = { ...atividade, id: 10, tipo: 'troca_de_faixa', nome: 'Exame de graduação', presenca: null }
const anexo = {
  id: 3,
  titulo: 'Calendário anual',
  categoria: 'Calendarios',
  descricao: null,
  nome_arquivo: 'calendario.pdf',
  arquivo_url: null,
  link: 'https://example.com/calendario',
  criado_em: '2026-10-13',
}
const turma = { id: 5, nome: 'Infantil A' }
const turmaOutra = { id: 6, nome: 'Adultos' }
const requisicao = vi.fn<typeof fetch>()

function configurarApi() {
  requisicao.mockImplementation(async (input, init) => {
    const caminho = new URL(String(input)).pathname
    const metodo = init?.method ?? 'GET'
    if (caminho === '/usuarios/eu') return Response.json(usuario)
    if (metodo === 'POST' || metodo === 'PATCH') {
      const corpo = init?.body
      const dados = corpo instanceof FormData
        ? Object.fromEntries(Array.from(corpo.entries()).map(([chave, valor]) => [chave, valor instanceof File ? valor.name : valor]))
        : JSON.parse(String(corpo ?? '{}')) as Record<string, unknown>
      const id = Number(caminho.match(/\/(\d+)$/)?.[1] ?? 101)
      return Response.json({ id, ...dados }, { status: metodo === 'POST' ? 201 : 200 })
    }
    if (metodo === 'DELETE') return new Response(null, { status: 204 })
    if (caminho === '/aluno/') return Response.json([aluno, alunoOutraTurma])
    if (caminho === '/faixas/') return Response.json([faixa, faixaSeguinte])
    if (caminho === '/turmas/') return Response.json([turma, turmaOutra])
    if (caminho === '/atividades/') return Response.json([atividade, atividadeFaixa])
    if (caminho === '/anexos/') return Response.json([anexo])
    if (/^\/atividades\/\d+\/relatorio$/.test(caminho)) return Response.json([])
    return Response.json({ detail: `Rota não encontrada: ${caminho}` }, { status: 404 })
  })
  vi.stubGlobal('fetch', requisicao)
}

function abrir(path: string) {
  saveToken('token-de-teste')
  window.history.replaceState({}, '', path)
  return render(<App />)
}

beforeEach(() => {
  clearToken()
  localStorage.clear()
  requisicao.mockReset()
  configurarApi()
})

afterEach(() => {
  cleanup()
  clearToken()
  vi.unstubAllGlobals()
})

describe('telas conectadas aos recursos FastAPI', () => {
  it('lista alunos e cria um cadastro com a faixa selecionada', async () => {
    abrir(ROTAS.turmas)
    await screen.findByText('Infantil A')
    fireEvent.click(screen.getAllByRole('link', { name: 'Gerenciar alunos' })[0])
    await screen.findByRole('heading', { name: 'Alunos · Infantil A' })
    expect(await screen.findByText('Caio Silva')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Bruna Costa', faixa_id: 2, turma_id: 5, cpf: null, tamanho_kimono: null, tamanho_faixa: null, codigo_zempo: null })
  })

  it('cria atividade com participantes pelos IDs exigidos pelo backend', async () => {
    abrir(ROTAS.atividades)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino de sábado' } })
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar aluno' }))
    fireEvent.click(screen.getByLabelText('Adicionar Caio Silva'))
    expect(screen.queryByLabelText('Adicionar Lia Santos')).toBeNull()
    fireEvent.click(screen.getByLabelText('Pagamento confirmado de Caio Silva'))
    expect(screen.queryByText('Pago')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Treino de sábado', tipo: 'frequencia', aluno_ids: [7], aluno_ids_pagos: [7] })
  })

  it('cria atividade sem participantes', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino livre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Treino livre', tipo: 'frequencia', aluno_ids: [], aluno_ids_pagos: [] })
  })

  it('remove alunos ocultos ao trocar a turma da atividade', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino de outra turma' } })
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar aluno' }))
    fireEvent.click(screen.getByLabelText('Adicionar Caio Silva'))
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: '6' } })
    expect(screen.queryByLabelText('Adicionar Caio Silva')).toBeNull()
    fireEvent.click(screen.getByLabelText('Adicionar Lia Santos'))
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ aluno_ids: [8] })
  })

  it('gradua o participante para a faixa seguinte pelo catálogo', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Exame de graduação' }))
    fireEvent.change(screen.getByLabelText('Próxima faixa de Caio Silva'), { target: { value: 'Laranja' } })
    fireEvent.change(screen.getByLabelText('Tamanho da faixa de Caio Silva'), { target: { value: '3' } })

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    fireEvent.click(screen.getByRole('button', { name: 'Graduar Caio Silva' }))
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/aluno/7') && init?.method === 'PATCH')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Graduar Caio Silva' }))
    expect(confirmar).toHaveBeenCalledTimes(2)

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'PATCH' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/7') && init?.method === 'PATCH')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ faixa_id: 3, proxima_faixa: null, tamanho_faixa: '3' })
  })

  it('mantém atalhos mobile e deixa turmas no menu principal', async () => {
    abrir(ROTAS.turmas)
    await screen.findByRole('navigation', { name: 'Navegação principal' })
    const atalhos = screen.getByRole('navigation', { name: 'Acesso rápido' })
    for (const pagina of ['Início', 'Atividades', 'Turmas', 'Anexos', 'Calendário']) {
      expect(within(atalhos).getByRole('link', { name: pagina })).toBeTruthy()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))
    expect(screen.getByRole('button', { name: 'Fechar menu' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', { name: 'Turmas' }))

    expect(await screen.findByRole('heading', { name: 'Turmas' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('edita e exclui aluno usando os endpoints correspondentes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    abrir('/turmas/5/alunos')
    await screen.findByRole('heading', { name: 'Alunos · Infantil A' })
    expect(await screen.findByText('Caio Silva')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Caio Silva' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Caio Silva Neto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'PATCH' })))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Caio Silva' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'DELETE' })))
  })

  it('consulta o relatório de uma atividade pela rota específica', async () => {
    abrir(ROTAS.atividades)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Relatório de Treino infantil' }))

    expect(await screen.findByRole('region', { name: 'Relatório da atividade' })).toBeTruthy()
    expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/9/relatorio'), expect.anything())
  })

  it('envia arquivo e metadados de anexo em multipart', async () => {
    abrir(ROTAS.anexos)
    expect(await screen.findByText('Calendário anual')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Novo anexo' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Regulamento 2027' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Regulamentos' } })
    fireEvent.change(screen.getByLabelText('Link externo'), { target: { value: 'https://example.com/regulamento' } })
    fireEvent.change(screen.getByLabelText('Arquivo'), { target: { files: [new File(['pdf'], 'regulamento.pdf', { type: 'application/pdf' })] } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar anexo' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/anexos/upload'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/anexos/upload') && init?.method === 'POST')
    const formulario = envio?.[1]?.body as FormData
    expect(formulario.get('titulo')).toBe('Regulamento 2027')
    expect(formulario.get('categoria')).toBe('Regulamentos')
    expect(formulario.get('arquivo')).toMatchObject({ name: 'regulamento.pdf' })
  })

  it('lista e cria faixas com tipo e ordem validados', async () => {
    abrir(ROTAS.faixas)
    expect(await screen.findByText('Amarela')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nova faixa' }))
    fireEvent.change(screen.getByLabelText('Nome da faixa'), { target: { value: 'Laranja' } })
    fireEvent.change(screen.getByLabelText('Classificação'), { target: { value: 'Kyu' } })
    fireEvent.change(screen.getByLabelText('Ordem'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/faixas/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/faixas/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Laranja', tipo: 'Kyu', ordem: 5 })
  })

  it('lista e cria turmas sem exigir dojo', async () => {
    abrir(ROTAS.turmas)
    expect(await screen.findByText('Infantil A')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nova turma' }))
    fireEvent.change(screen.getByLabelText('Nome da turma'), { target: { value: 'Juvenil' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar turma' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/turmas/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/turmas/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ nome: 'Juvenil' })
  })

  it('mostra a agenda derivada das atividades cadastradas', async () => {
    abrir(ROTAS.calendario)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    expect(screen.getByText(/13 de outubro de 2026/i)).toBeTruthy()
  })
})
