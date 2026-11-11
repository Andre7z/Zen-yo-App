import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { clearToken, saveToken } from '../src/api'
import { ROTAS } from '../src/routes'

const usuario = { id: 4, nome: 'Ana Professora', email: 'ana@example.com' }
const faixa = { id: 2, nome: 'Amarela', tipo: 'Kyu', grau: 6, ordem: 994 }
const faixaSeguinte = { id: 3, nome: 'Laranja', tipo: 'Kyu', grau: 5, ordem: 995 }
const aluno = {
  id: 7,
  nome: 'Caio Silva',
  cpf: '52998224725',
  data_nascimento: null,
  faixa_id: 2,
  proxima_faixa: null,
  turma_ids: [5],
  celular: null,
  tamanho_kimono: 'M2',
  tamanho_faixa: '2',
  codigo_zempo: 'ZP001',
}
const alunoOutraTurma = { ...aluno, id: 8, nome: 'Lia Santos', turma_ids: [6] }
const atividade = {
  id: 9,
  tipo: 'frequencia',
  nome: 'Treino infantil',
  data: '2026-10-13',
  local: 'Tatame 1',
  descricao: null,
  aluno_ids: [7],
  aluno_ids_confirmados: [],
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
const turma = { id: 5, nome: 'Infantil A', nucleo: 'Centro' }
const turmaOutra = { id: 6, nome: 'Adultos', nucleo: 'Bairro' }
const requisicao = vi.fn<typeof fetch>()

function configurarApi() {
  requisicao.mockImplementation(async (input, init) => {
    const caminho = new URL(String(input)).pathname
    if (caminho === '/atividades/10/graduacoes' && init?.method === 'POST') {
      return Response.json([{ ...aluno, faixa_id: 3, proxima_faixa: null, tamanho_faixa: 'G' }])
    }
    const metodo = init?.method ?? 'GET'
    if (caminho === '/usuarios/eu' && metodo === 'GET') return Response.json(usuario)
    if (/^\/turmas\/\d+\/alunos$/.test(caminho) && metodo === 'POST') return new Response(null, { status: 204 })
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
    if (/^\/turmas\/\d+\/frequencias$/.test(caminho)) return Response.json([])
    if (caminho === '/atividades/') return Response.json([atividade, atividadeFaixa])
    if (caminho === '/anexos/') return Response.json([anexo])
    if (caminho === '/tamanhos/') return Response.json([])
    if (/^\/atividades\/\d+\/planilha\/controle-de-(faixas|kimonos|frequencia)\.xlsx$/.test(caminho)) {
      return new Response(new Blob(['conteudo']), { status: 200 })
    }
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
  it.each([
    [ROTAS.alunos, 'Buscar aluno'],
    [ROTAS.anexos, 'Buscar anexo'],
    [ROTAS.turmas, 'Buscar turma'],
    [ROTAS.atividades, 'Buscar atividade'],
  ])('mostra lupa decorativa no campo de busca em %s', async (rota, rotulo) => {
    abrir(rota)
    const busca = await screen.findByLabelText(rotulo)
    const icone = busca.parentElement?.querySelector('svg')
    expect(icone?.getAttribute('aria-hidden')).toBe('true')
    expect(icone?.classList.contains('lucide-search')).toBe(true)
  })

  it('mostra o primeiro e o último nome do sensei na tela inicial', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/usuarios/eu') return Response.json({ ...usuario, nome: 'Luiz Rocha Moraes' })
      return padrao(input, init)
    })
    abrir(ROTAS.inicio)
    expect(await screen.findByRole('heading', { name: 'Bem-vindo, Sensei Luiz Moraes.' })).toBeTruthy()
  })

  it('lista as chamadas da turma e abre a data selecionada para edição', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (caminho === '/turmas/5/frequencias') return Response.json(['2026-11-05', '2026-10-02'])
      if (caminho === '/turmas/5/frequencias/2026-10-02') {
        return Response.json({ data: '2026-10-02', registrada: true, alunos: [{ aluno_id: 7, nome: 'Caio Silva', presente: false }] })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    const detalhes = screen.getByRole('dialog', { name: 'Infantil A' })
    const historico = within(detalhes).getByRole('region', { name: 'Chamadas registradas' })
    const itens = await within(historico).findAllByRole('listitem')
    expect(itens.map((item) => item.querySelector('time')?.textContent)).toEqual(['05/11/2026', '02/10/2026'])
    fireEvent.click(within(historico).getByRole('button', { name: 'Editar registro de 02/10/2026' }))
    const chamada = await screen.findByRole('dialog', { name: 'Registro de frequência · Infantil A' })
    expect((within(chamada).getByLabelText('Data da aula') as HTMLInputElement).value).toBe('2026-10-02')
    expect(await within(chamada).findByRole('checkbox', { name: 'Caio Silva Faltou' })).toBeTruthy()
  })

  it('mostra erro no histórico e permite tentar novamente', async () => {
    const padrao = requisicao.getMockImplementation()!
    let tentativas = 0
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/turmas/5/frequencias') {
        tentativas += 1
        return tentativas === 1 ? Response.json({ detail: 'Falha ao carregar chamadas.' }, { status: 500 }) : Response.json([])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    const historico = within(screen.getByRole('dialog', { name: 'Infantil A' })).getByRole('region', { name: 'Chamadas registradas' })
    expect(await within(historico).findByText('Falha ao carregar chamadas.')).toBeTruthy()
    fireEvent.click(within(historico).getByRole('button', { name: 'Tentar novamente' }))
    expect(await within(historico).findByText('Nenhuma chamada registrada.')).toBeTruthy()
  })

  it('inicia com todos presentes e registra falta ao desmarcar', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (/^\/turmas\/5\/frequencias\/\d{4}-\d{2}-\d{2}$/.test(caminho)) {
        const alunos = [{ aluno_id: 7, nome: 'Caio Silva', presente: true }, { aluno_id: 8, nome: 'Lia Santos', presente: true }]
        if (init?.method === 'PUT') return Response.json({ data: caminho.slice(-10), registrada: true, alunos: [{ ...alunos[0], presente: false }, alunos[1]] })
        return Response.json({ data: caminho.slice(-10), registrada: false, alunos })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Infantil A' })).getByRole('button', { name: 'Registro de frequência' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registro de frequência · Infantil A' })
    await within(dialogo).findByText('Caio Silva')
    const presencas = within(dialogo).getAllByRole('checkbox', { name: /Presente/ }) as HTMLInputElement[]
    expect(presencas.map((checkbox) => checkbox.checked)).toEqual([true, true])
    expect(presencas[0].parentElement?.classList.contains('activity-confirmation')).toBe(true)
    fireEvent.click(presencas[0])
    expect(presencas[0].checked).toBe(false)
    expect(within(dialogo).getByRole('checkbox', { name: 'Caio Silva Faltou' })).toBeTruthy()
    expect(within(dialogo).getAllByText('Presente')).toHaveLength(1)
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar frequência' }))
    await waitFor(() => {
      const envio = requisicao.mock.calls.find(([url, init]) => String(url).includes('/turmas/5/frequencias/') && init?.method === 'PUT')
      expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ alunos: [{ aluno_id: 7, presente: false }, { aluno_id: 8, presente: true }] })
    })
    expect(await within(dialogo).findByText('Chamada registrada. Você pode alterar as marcações.')).toBeTruthy()
    expect((within(dialogo).getByRole('checkbox', { name: 'Caio Silva Faltou' }) as HTMLInputElement).checked).toBe(false)
    expect((within(dialogo).getByRole('checkbox', { name: 'Lia Santos Presente' }) as HTMLInputElement).checked).toBe(true)
  })

  it('permite alterar e salvar uma chamada com muitos alunos', async () => {
    const padrao = requisicao.getMockImplementation()!
    const alunos = Array.from({ length: 30 }, (_, indice) => ({ aluno_id: indice + 1, nome: `Aluno ${indice + 1}`, presente: true }))
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (/^\/turmas\/5\/frequencias\/\d{4}-\d{2}-\d{2}$/.test(caminho)) {
        return Response.json({ data: caminho.slice(-10), registrada: init?.method === 'PUT', alunos })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    const turma = (await screen.findByText('Infantil A')).closest('article')!
    fireEvent.click(within(turma).getByRole('button', { name: 'Registro de frequência' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registro de frequência · Infantil A' })
    const ultimoAluno = await within(dialogo).findByRole('checkbox', { name: 'Aluno 30 Presente' })
    expect(dialogo.classList.contains('detail-dialog-wide')).toBe(false)
    expect(ultimoAluno.closest('.detail-dialog-content')).toBeTruthy()
    fireEvent.click(ultimoAluno)
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar frequência' }))
    await waitFor(() => {
      const envio = requisicao.mock.calls.find(([url, init]) => String(url).includes('/turmas/5/frequencias/') && init?.method === 'PUT')
      const corpo = JSON.parse(String(envio?.[1]?.body)) as { alunos: { aluno_id: number; presente: boolean }[] }
      expect(corpo.alunos).toHaveLength(30)
      expect(corpo.alunos[29]).toEqual({ aluno_id: 30, presente: false })
    })
  })

  it('explica quando a rota de chamada não existe no backend publicado', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (/\/turmas\/5\/frequencias\/\d{4}-\d{2}-\d{2}$/.test(new URL(String(input)).pathname)) {
        return Response.json({ detail: 'Not Found' }, { status: 404 })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Infantil A' })).getByRole('button', { name: 'Registro de frequência' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registro de frequência · Infantil A' })
    expect(await within(dialogo).findByText('Rota não encontrada na API. Verifique se o backend está atualizado.')).toBeTruthy()
    expect(within(dialogo).getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  })

  it('mantém a falta ao abrir uma chamada já registrada', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (/^\/turmas\/5\/frequencias\/\d{4}-\d{2}-\d{2}$/.test(caminho)) {
        return Response.json({ data: caminho.slice(-10), registrada: true, alunos: [{ aluno_id: 7, nome: 'Caio Silva', presente: false }] })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Infantil A' })).getByRole('button', { name: 'Registro de frequência' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registro de frequência · Infantil A' })
    expect(await within(dialogo).findByText('Faltou')).toBeTruthy()
    expect((within(dialogo).getByRole('checkbox', { name: 'Caio Silva Faltou' }) as HTMLInputElement).checked).toBe(false)
    fireEvent.click(within(dialogo).getByRole('checkbox', { name: 'Caio Silva Faltou' }))
    expect((within(dialogo).getByRole('checkbox', { name: 'Caio Silva Presente' }) as HTMLInputElement).checked).toBe(true)
  })

  it('abre registro de frequência diretamente na turma escolhida', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (/^\/turmas\/6\/frequencias\/\d{4}-\d{2}-\d{2}$/.test(caminho)) {
        return Response.json({ data: caminho.slice(-10), registrada: false, alunos: [{ aluno_id: 8, nome: 'Lia Santos', presente: true }] })
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    const nomeTurma = await screen.findByText('Adultos')
    const turma = nomeTurma.closest('article')
    expect(turma).not.toBeNull()
    fireEvent.click(within(turma!).getByRole('button', { name: 'Registro de frequência' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registro de frequência · Adultos' })
    expect(await within(dialogo).findByText('Lia Santos')).toBeTruthy()
  })

  it('exporta a frequência de várias turmas no mês escolhido', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/usuarios/eu') return Response.json({ ...usuario, nome: 'Luiz Rocha Moraes' })
      if (new URL(String(input)).pathname === '/turmas/planilha-de-frequencia.xlsx') return new Response(new Blob(['xlsx']))
      return padrao(input, init)
    })
    URL.createObjectURL = vi.fn(() => 'blob:frequencia')
    URL.revokeObjectURL = vi.fn()
    let nomeArquivo = ''
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nomeArquivo = this.download
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Gerar planilha de frequência das turmas' }))
    const dialogo = screen.getByRole('dialog', { name: 'Planilha de frequência das turmas' })
    fireEvent.change(within(dialogo).getByLabelText('Mês'), { target: { value: '2026-11' } })
    fireEvent.click(within(dialogo).getByLabelText('Infantil A'))
    fireEvent.click(within(dialogo).getByLabelText('Adultos'))
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Gerar planilha' }))
    await waitFor(() => {
      const chamada = requisicao.mock.calls.find(([url]) => String(url).includes('/turmas/planilha-de-frequencia.xlsx?'))
      expect(chamada).toBeDefined()
      const parametros = new URL(String(chamada?.[0])).searchParams
      expect(parametros.get('ano')).toBe('2026')
      expect(parametros.get('mes')).toBe('11')
      expect(parametros.getAll('turma_ids')).toEqual(['5', '6'])
    })
    expect(clique).toHaveBeenCalled()
    expect(nomeArquivo).toBe('FREQUÊNCIA DE NOVEMBRO 2026 - SENSEI LUIZ MORAES.xlsx')
    clique.mockRestore()
  })

  it('abre os alunos da turma e cria cadastro com a faixa selecionada em /alunos', async () => {
    abrir(ROTAS.turmas)
    await screen.findByText('Infantil A')
    fireEvent.click(screen.getAllByRole('link', { name: 'Gerenciar alunos' })[0])
    await screen.findByRole('heading', { name: 'Alunos · Infantil A' })
    expect(await screen.findByText('Caio Silva')).toBeTruthy()
    expect(screen.queryByText('Lia Santos')).toBeNull()
    cleanup()
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '15052010' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Bruna Costa', data_nascimento: '2010-05-15', faixa_id: 2, celular: null, cpf: null, tamanho_kimono: null, tamanho_faixa: null, codigo_zempo: null })
  })

  it('bloqueia CPF inválido ao cadastrar aluno e aceita CPF válido com máscara', async () => {
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '12345678901' } })
    expect((screen.getByLabelText('CPF') as HTMLInputElement).value).toBe('123.456.789-01')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    expect((await screen.findAllByText('CPF inválido. Confira os números digitados.')).length).toBe(1)
    expect(await screen.findByText('CPF do aluno inválido. Confira os números digitados.')).toBeTruthy()
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')).toBe(false)

    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '52998224725' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    await waitFor(() => {
      const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
      expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ cpf: '529.982.247-25' })
    })
  })

  it('abre os detalhes do aluno em um popup e fecha com Escape', async () => {
    abrir('/turmas/5/alunos')
    await screen.findByText('Caio Silva')

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Caio Silva' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Caio Silva' })
    expect(within(dialogo).getByText('52998224725')).toBeTruthy()
    expect(within(dialogo).getByText('Data de nascimento', { selector: 'dt' }).nextElementSibling?.textContent).toBe('Não informada')
    expect(within(dialogo).getByText('Idade', { selector: 'dt' }).nextElementSibling?.textContent).toBe('Não informada')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Caio Silva' }))
    await screen.findByRole('dialog', { name: 'Caio Silva' })
    fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhes' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('exibe a data de nascimento e a idade nos detalhes do aluno', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/aluno/' && !init?.method) {
        return Response.json([{ ...aluno, data_nascimento: '2000-01-01' }, alunoOutraTurma])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.alunos)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Caio Silva' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Caio Silva' })

    expect(within(dialogo).getByText('01/01/2000')).toBeTruthy()
    expect(within(dialogo).getByText(/^\d+ anos$/)).toBeTruthy()
  })

  it('rejeita nascimento futuro ou anterior ao limite de 122 anos', async () => {
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    const nascimento = screen.getByLabelText('Data de nascimento')

    fireEvent.change(nascimento, { target: { value: '31129999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    expect(await screen.findByText('A data de nascimento não pode ser futura.')).toBeTruthy()
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')).toBe(false)

    fireEvent.change(nascimento, { target: { value: '01011800' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    expect(await screen.findByText('A data de nascimento deve estar dentro dos últimos 122 anos.')).toBeTruthy()
  })

  it('cria atividades sem alunos e permite gerenciar participantes nos detalhes', async () => {
    abrir(ROTAS.atividades)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    expect(screen.getAllByText(/13\/10\/2026/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    expect(await screen.findByRole('dialog', { name: 'Nova atividade' })).toBeTruthy()
    expect(screen.getByText('CADASTRO')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino de sábado' } })
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '13102026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Treino de sábado', tipo: 'frequencia', data: '2026-10-13' })
    expect(JSON.parse(String(envio?.[1]?.body))).not.toHaveProperty('aluno_ids')
    expect(JSON.parse(String(envio?.[1]?.body))).not.toHaveProperty('presenca')

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Treino infantil' }))
    await screen.findByRole('dialog', { name: 'Treino infantil' })
    expect(screen.queryByText('Presença', { selector: 'dt' })).toBeNull()
    expect(screen.getByLabelText('Presença de Caio Silva')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar alunos' }))
    expect(await screen.findByRole('dialog', { name: 'Alunos · Treino infantil' })).toBeTruthy()
    expect(screen.getByLabelText('Adicionar Lia Santos')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Adicionar Lia Santos'))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar participantes (2)' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/9'), expect.objectContaining({ method: 'PATCH' })))
    const atualizacao = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/9') && init?.method === 'PATCH')
    expect(JSON.parse(String(atualizacao?.[1]?.body))).toMatchObject({ aluno_ids: [7, 8], aluno_ids_confirmados: [] })
  })

  it('ordena alfabeticamente os alunos ao abrir o seletor de participantes', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/aluno/' && !init?.method) {
        return Response.json([
          { ...aluno, nome: 'Zeca' },
          { ...alunoOutraTurma, nome: 'Álvaro' },
          { ...aluno, id: 9, nome: 'Ana' },
        ])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.atividades)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Treino infantil' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Gerenciar alunos' }))
    const lista = await screen.findByLabelText('Lista de alunos disponíveis')

    expect(Array.from(lista.querySelectorAll('.participant-picker-identity strong')).map((item) => item.textContent))
      .toEqual(['Álvaro', 'Ana', 'Zeca'])
  })

  it('salva a presença individual do aluno na atividade', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Treino infantil' }))

    fireEvent.click(await screen.findByLabelText('Presença de Caio Silva'))
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/atividades/9') && init?.method === 'PATCH')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações dos alunos' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/9'), expect.objectContaining({ method: 'PATCH' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/9') && init?.method === 'PATCH')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ aluno_ids: [7], aluno_ids_confirmados: [7] })
    expect(JSON.parse(String(envio?.[1]?.body))).not.toHaveProperty('presenca')
  })

  it('cria atividade sem participantes', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino livre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Treino livre', tipo: 'frequencia' })
    expect(JSON.parse(String(envio?.[1]?.body))).not.toHaveProperty('aluno_ids')
  })

  it.each(['01011999', '31122151'])('rejeita atividade fora do período permitido (%s)', async (data) => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Nova atividade' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Treino fora do período' } })
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: data } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar atividade' }))

    expect(await screen.findByText('A data da atividade deve estar entre 2000 e 2150.')).toBeTruthy()
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/atividades/') && init?.method === 'POST')).toBe(false)
  })

  it('filtra a lista de alunos por turma ao gerenciar uma atividade', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Treino infantil' }))
    await screen.findByRole('dialog', { name: 'Treino infantil' })
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar alunos' }))

    fireEvent.change(screen.getByLabelText('Filtrar por turma'), { target: { value: '6' } })
    expect(screen.queryByLabelText('Adicionar Caio Silva')).toBeNull()
    expect(screen.getByLabelText('Adicionar Lia Santos')).toBeTruthy()
  })

  it('gradua o participante para a faixa seguinte pelo catálogo', async () => {
    abrir(ROTAS.atividades)
    await screen.findByText('Treino infantil')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Exame de graduação' }))
    expect(await screen.findByRole('dialog', { name: 'Exame de graduação' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Próxima faixa de Caio Silva'), { target: { value: 'Laranja - 5º Kyu' } })
    fireEvent.change(screen.getByLabelText('Tamanho da faixa de Caio Silva'), { target: { value: 'G' } })
    expect(screen.queryByRole('button', { name: 'Graduar Caio Silva' })).toBeNull()

    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const padrao = requisicao.getMockImplementation()!
    let marcado = false
    requisicao.mockImplementation(async (input, init) => {
      const caminho = new URL(String(input)).pathname
      if (caminho === '/atividades/10' && init?.method === 'PATCH') {
        marcado = true
        return Response.json({ ...atividadeFaixa, aluno_ids_confirmados: [7] })
      }
      if (caminho === '/atividades/' && !init?.method) return Response.json([atividade, { ...atividadeFaixa, aluno_ids_confirmados: marcado ? [7] : [] }])
      return padrao(input, init)
    })
    expect((screen.getByRole('button', { name: /Graduar selecionados/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('Confirmação de Caio Silva'))
    const botao = await waitFor(() => {
      const atual = screen.getByRole('button', { name: /Graduar selecionados \(1\)/ }) as HTMLButtonElement
      expect(atual.disabled).toBe(false)
      return atual
    })
    fireEvent.click(botao)
    expect(requisicao.mock.calls.some(([url, init]) => String(url).endsWith('/aluno/7') && init?.method === 'PATCH')).toBe(false)
    fireEvent.click(botao)
    expect(confirmar).toHaveBeenCalledTimes(2)

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/10/graduacoes'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/atividades/10/graduacoes') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ alunos: [{ aluno_id: 7, faixa_id: 3, tamanho_faixa: 'G' }] })
  })

  it('lista todos os alunos em /alunos sem depender de turma', async () => {
    abrir(ROTAS.alunos)
    await screen.findByRole('heading', { name: 'Alunos' })
    expect(within(screen.getByRole('main')).queryByRole('link', { name: 'Turmas' })).toBeNull()
    expect(await screen.findByText('Caio Silva')).toBeTruthy()
    expect(screen.getByText('Lia Santos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Nome do responsável'), { target: { value: 'Maria Costa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Bruna Costa', celular: null, responsavel_nome: 'Maria Costa', responsavel_cpf: null, responsavel_parentesco: null })
  })

  it('busca alunos sem diferenciar acentos ou maiúsculas e combina com o filtro de turma', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/aluno/') return Response.json([{ ...aluno, nome: 'João Silva' }, alunoOutraTurma])
      return padrao(input, init)
    })
    abrir(ROTAS.alunos)
    await screen.findByText('João Silva')
    const busca = screen.getByLabelText('Buscar aluno')
    fireEvent.change(busca, { target: { value: '  JOAO  ' } })
    expect(screen.getByText('João Silva')).toBeTruthy()
    expect(screen.queryByText('Lia Santos')).toBeNull()
    fireEvent.change(screen.getByLabelText('Filtrar por turma'), { target: { value: '6' } })
    expect(screen.getByText('Nenhum aluno encontrado.')).toBeTruthy()
    fireEvent.change(busca, { target: { value: '' } })
    expect(screen.getByText('Lia Santos')).toBeTruthy()
  })

  it('busca na lista de alunos de uma turma sem alterar a seleção de novos alunos', async () => {
    abrir('/turmas/5/alunos')
    await screen.findByText('Caio Silva')
    fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'inexistente' } })
    expect(screen.getByText('Nenhum aluno encontrado.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar alunos' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Adicionar alunos · Infantil A' })
    expect(within(dialogo).getByLabelText('Adicionar Lia Santos')).toBeTruthy()
  })

  it('restringe o nome a letras e formata os telefones do aluno e responsável', async () => {
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    const nome = screen.getByLabelText('Nome completo') as HTMLInputElement
    const celular = screen.getByLabelText('Celular do aluno') as HTMLInputElement
    const responsavel = screen.getByLabelText('Celular do responsável') as HTMLInputElement
    fireEvent.change(nome, { target: { value: 'João 12-Érica!' } })
    expect(nome.value).toBe('João Érica')
    fireEvent.change(celular, { target: { value: '64999887766' } })
    fireEvent.change(responsavel, { target: { value: '6499887766' } })
    expect(celular.value).toBe('(64)99988-7766')
    expect(responsavel.value).toBe('(64)9988-7766')
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'João Érica', celular: '(64)99988-7766', responsavel_celular: '(64)9988-7766' })
  })

  it('adiciona JU ao código Zempo sem exigir seis dígitos', async () => {
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))
    const codigo = screen.getByLabelText('Código Zempo') as HTMLInputElement
    expect(codigo.placeholder).toBe('JU000000')
    expect((screen.getByLabelText('Celular do aluno') as HTMLInputElement).placeholder).toBe('(00)00000-0000')
    expect((screen.getByLabelText('Celular do responsável') as HTMLInputElement).placeholder).toBe('(00)00000-0000')
    fireEvent.change(codigo, { target: { value: '003' } })
    expect(codigo.value).toBe('JU003')
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Bruna Costa' } })
    fireEvent.change(screen.getByLabelText('Faixa'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ codigo_zempo: 'JU003' })
  })

  it('preserva código Zempo antigo ao editar outros campos', async () => {
    abrir(ROTAS.alunos)
    await screen.findByText('Caio Silva')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Caio Silva' }))
    expect((screen.getByLabelText('Código Zempo') as HTMLInputElement).value).toBe('ZP001')
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Caio Silva Neto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'PATCH' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/7') && init?.method === 'PATCH')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ codigo_zempo: 'ZP001' })
  })

  it('edita o peso do aluno na atividade de campeonato', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/atividades/' && !init?.method) {
        return Response.json([{ ...atividade, id: 11, tipo: 'campeonato', nome: 'Copa Zen' }])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.atividades)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Copa Zen' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Copa Zen' })
    expect(within(dialogo).getByLabelText('Idade de Caio Silva').textContent).toBe('Não informada')
    fireEvent.change(within(dialogo).getByLabelText('Peso de Caio Silva'), { target: { value: '38,5' } })
    fireEvent.change(within(dialogo).getByLabelText('Data de nascimento de Caio Silva'), { target: { value: '10/03/2015' } })
    fireEvent.change(within(dialogo).getByLabelText('Gênero de Caio Silva'), { target: { value: 'Feminino' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar alterações dos alunos' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'PATCH' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/aluno/7') && init?.method === 'PATCH')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ peso: 38.5, data_nascimento: '2015-03-10', genero: 'Feminino' })
    expect(await screen.findByText('Dados dos alunos salvos com sucesso.')).toBeTruthy()
  })

  it('na turma não exclui aluno, adiciona por seleção e remove da turma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    abrir('/turmas/5/alunos')
    await screen.findByText('Caio Silva')
    expect(screen.queryByRole('button', { name: 'Excluir Caio Silva' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar alunos' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Adicionar alunos · Infantil A' })
    expect(within(dialogo).queryByLabelText('Adicionar Caio Silva')).toBeNull()
    fireEvent.click(within(dialogo).getByLabelText('Adicionar Lia Santos'))
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Adicionar à turma (1)' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/turmas/5/alunos'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/turmas/5/alunos') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ aluno_ids: [8] })

    fireEvent.click(await screen.findByRole('button', { name: 'Remover Caio Silva da turma' }))
    await waitFor(() => {
      const remocao = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/turmas/5/alunos/7') && init?.method === 'DELETE')
      expect(remocao).toBeTruthy()
    })
  })

  it('filtra anexos por categoria começando em Todos', async () => {
    abrir(ROTAS.anexos)
    await screen.findByText('Calendário anual')
    expect(screen.getByText('Calendarios · calendario.pdf · 13/10/2026')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Calendário anual' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Calendário anual' })
    expect(within(dialogo).getByText('13/10/2026')).toBeTruthy()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Fechar detalhes' }))
    const filtro = screen.getByLabelText('Filtrar por categoria') as HTMLSelectElement
    expect(filtro.value).toBe('')
    fireEvent.change(filtro, { target: { value: 'Fichas' } })
    expect(screen.queryByText('Calendário anual')).toBeNull()
  })

  it('ordena anexos por título e número, inclusive ao filtrar por categoria', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/anexos/' && !init?.method) {
        return Response.json([
          { ...anexo, id: 1, titulo: 'Apostila 10', categoria: 'Apostilas' },
          { ...anexo, id: 2, titulo: 'Ética', categoria: 'Fichas' },
          { ...anexo, id: 3, titulo: 'apostila 2', categoria: 'Apostila' },
          { ...anexo, id: 4, titulo: 'Apostila 1', categoria: 'Apostilas' },
          { ...anexo, id: 5, titulo: 'Documento', categoria: 'Fichas' },
        ])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.anexos)
    await screen.findByText('Apostila 10')
    const titulos = () => within(screen.getByLabelText('Lista de anexos')).getAllByRole('button', { name: /^Ver detalhes de / }).map((botao) => botao.querySelector('strong')?.textContent)
    expect(titulos()).toEqual(['Apostila 1', 'apostila 2', 'Apostila 10', 'Documento', 'Ética'])
    fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'Apostilas' } })
    expect(titulos()).toEqual(['Apostila 1', 'apostila 2', 'Apostila 10'])
  })

  it('busca anexos pelo título com filtro de categoria', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/anexos/' && !init?.method) {
        return Response.json([anexo, { ...anexo, id: 8, titulo: 'Apostila 10', categoria: 'Apostilas' }])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.anexos)
    await screen.findByText('Calendário anual')
    const busca = screen.getByLabelText('Buscar anexo')
    fireEvent.change(busca, { target: { value: 'CALENDARIO' } })
    expect(screen.getByText('Calendário anual')).toBeTruthy()
    expect(screen.queryByText('Apostila 10')).toBeNull()
    fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'Apostilas' } })
    expect(screen.getByText('Nenhum anexo encontrado.')).toBeTruthy()
    fireEvent.change(busca, { target: { value: '10' } })
    expect(screen.getByText('Apostila 10')).toBeTruthy()
  })

  it('busca turmas por nome ou núcleo e preserva todas na exportação', async () => {
    abrir(ROTAS.turmas)
    await screen.findByText('Infantil A')
    const busca = screen.getByLabelText('Buscar turma')
    fireEvent.change(busca, { target: { value: 'baiRRo' } })
    expect(screen.getByText('Adultos')).toBeTruthy()
    expect(screen.queryByText('Infantil A')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Gerar planilha de frequência das turmas' }))
    const dialogo = screen.getByRole('dialog', { name: 'Planilha de frequência das turmas' })
    expect(within(dialogo).getByLabelText('Infantil A')).toBeTruthy()
    expect(within(dialogo).getByLabelText('Adultos')).toBeTruthy()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Fechar formulário' }))
    fireEvent.change(busca, { target: { value: 'nao existe' } })
    expect(screen.getByText('Nenhuma turma encontrada.')).toBeTruthy()
    fireEvent.change(busca, { target: { value: 'INFANTIL' } })
    expect(screen.getByText('Infantil A')).toBeTruthy()
    expect(screen.queryByText('Adultos')).toBeNull()
  })

  it('informa o arquivo já anexado ao editar um anexo', async () => {
    requisicao.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/anexos/')) return Response.json([{ ...anexo, arquivo_url: '/anexos/arquivos/abc', link: null }])
      return Response.json([])
    })
    abrir(ROTAS.anexos)
    await screen.findByText('Calendário anual')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Calendário anual' }))
    expect(await screen.findByText('Arquivo já anexado: calendario.pdf. Para substituí-lo, selecione um novo arquivo.')).toBeTruthy()
  })

  it('exige arquivo ou link externo ao cadastrar anexo', async () => {
    abrir(ROTAS.anexos)
    await screen.findByText('Calendário anual')
    fireEvent.click(screen.getByRole('button', { name: 'Novo anexo' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guia de faixas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar anexo' }))

    expect((await screen.findAllByText('Informe um arquivo ou um link externo.')).length).toBe(2)
    expect(requisicao.mock.calls.some(([url, init]) => String(url).includes('/anexos/') && init?.method === 'POST')).toBe(false)
  })

  it('usa a categoria Apostilas ao criar anexos', async () => {
    abrir(ROTAS.anexos)
    await screen.findByText('Calendário anual')
    fireEvent.click(screen.getByRole('button', { name: 'Novo anexo' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Apostila 10' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Apostilas' } })
    fireEvent.change(screen.getByLabelText('Link externo'), { target: { value: 'https://exemplo.com/guia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar anexo' }))

    await waitFor(() => {
      const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/anexos/') && init?.method === 'POST')
      expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ titulo: 'Apostila 10', categoria: 'Apostilas' })
    })
  })

  it('mantém atalhos mobile e deixa turmas no menu principal', async () => {
    abrir(ROTAS.turmas)
    await screen.findByRole('navigation', { name: 'Navegação principal' })
    const atalhos = screen.getByRole('navigation', { name: 'Acesso rápido' })
    for (const pagina of ['Início', 'Atividades', 'Alunos', 'Turmas', 'Anexos']) {
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
    abrir(ROTAS.alunos)
    await screen.findByRole('heading', { name: 'Alunos' })
    expect(await screen.findByText('Caio Silva')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Caio Silva' }))
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Caio Silva Neto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'PATCH' })))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Caio Silva' }))
    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/aluno/7'), expect.objectContaining({ method: 'DELETE' })))
  })

  it('exporta a planilha de uma atividade em xlsx sem pré-visualização', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/usuarios/eu') return Response.json({ ...usuario, nome: 'Luiz Rocha Moraes' })
      return padrao(input, init)
    })
    const criarObjectURL = vi.fn(() => 'blob:mock')
    const revogarObjectURL = vi.fn()
    URL.createObjectURL = criarObjectURL
    URL.revokeObjectURL = revogarObjectURL
    let nomeArquivo = ''
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      nomeArquivo = this.download
    })

    abrir(ROTAS.atividades)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Planilha de Treino infantil' }))
    expect(confirmar).toHaveBeenLastCalledWith('Deseja gerar a planilha de Treino infantil?')
    expect(requisicao.mock.calls.some(([url]) => String(url).includes('/planilha/controle-de-frequencia.xlsx'))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Planilha de Treino infantil' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/atividades/9/planilha/controle-de-frequencia.xlsx'), expect.anything()))
    expect(criarObjectURL).toHaveBeenCalled()
    expect(nomeArquivo).toBe('TREINO INFANTIL - SENSEI LUIZ MORAES.xlsx')
    expect(screen.queryByRole('region', { name: 'Planilha da atividade' })).toBeNull()
    confirmar.mockRestore()
    clique.mockRestore()
  })

  it('pede confirmação antes de baixar qualquer anexo pelo ícone', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/anexos/') {
        return Response.json([{ ...anexo, arquivo_url: '/anexos/arquivos/3' }])
      }
      if (new URL(String(input)).pathname === '/anexos/arquivos/3') return new Response(new Blob(['arquivo']))
      return padrao(input, init)
    })
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    URL.createObjectURL = vi.fn(() => 'blob:anexo')
    URL.revokeObjectURL = vi.fn()
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    abrir(ROTAS.anexos)
    const botao = await screen.findByRole('button', { name: 'Baixar Calendário anual' })
    fireEvent.click(botao)
    expect(confirmar).toHaveBeenCalledWith('Deseja baixar o arquivo Calendário anual?')
    expect(requisicao.mock.calls.some(([url]) => String(url).includes('/anexos/arquivos/3'))).toBe(false)
    fireEvent.click(botao)
    await waitFor(() => expect(requisicao.mock.calls.some(([url]) => String(url).endsWith('/anexos/arquivos/3'))).toBe(true))
    await waitFor(() => expect(clique).toHaveBeenCalledOnce())
    confirmar.mockRestore()
    clique.mockRestore()
  })

  it('pede confirmação ao baixar pela prévia e pelos detalhes do anexo', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/anexos/') return Response.json([{ ...anexo, arquivo_url: '/anexos/arquivos/3' }])
      if (url.pathname === '/anexos/arquivos/3' && url.searchParams.has('inline')) return new Response(new Blob(['arquivo'], { type: 'application/pdf' }))
      return padrao(input, init)
    })
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    URL.createObjectURL = vi.fn(() => 'blob:previa')
    URL.revokeObjectURL = vi.fn()
    abrir(ROTAS.anexos)
    fireEvent.click(await screen.findByRole('button', { name: 'Visualizar Calendário anual' }))
    const previa = await screen.findByRole('dialog', { name: 'Calendário anual' })
    fireEvent.click(within(previa).getByRole('button', { name: 'Baixar arquivo' }))
    fireEvent.click(within(previa).getByRole('button', { name: 'Detalhes' }))
    const detalhes = await screen.findByRole('dialog', { name: 'Calendário anual' })
    fireEvent.click(within(detalhes).getByRole('button', { name: 'Baixar arquivo' }))
    expect(confirmar).toHaveBeenCalledTimes(2)
    expect(requisicao.mock.calls.some(([url]) => String(url).endsWith('/anexos/arquivos/3'))).toBe(false)
    confirmar.mockRestore()
  })

  it('envia arquivo e metadados de anexo em multipart', async () => {
    abrir(ROTAS.anexos)
    expect(await screen.findByText('Calendário anual')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Novo anexo' }))
    expect(await screen.findByRole('dialog', { name: 'Novo anexo' })).toBeTruthy()
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

  it('lista e cria faixas com tipo e número do Kyu/Dan', async () => {
    abrir(ROTAS.faixas)
    expect(await screen.findByText('Amarela')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nova faixa' }))
    expect(await screen.findByRole('dialog', { name: 'Nova faixa' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nome da faixa'), { target: { value: 'Laranja' } })
    fireEvent.change(screen.getByLabelText('Classificação'), { target: { value: 'Kyu' } })
    fireEvent.change(screen.getByLabelText('Número do Kyu/Dan'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/faixas/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/faixas/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Laranja', tipo: 'Kyu', grau: 5 })
  })

  it('cria turma com núcleo obrigatório', async () => {
    abrir(ROTAS.turmas)
    expect(await screen.findByText('Infantil A')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nova turma' }))
    expect(await screen.findByRole('dialog', { name: 'Nova turma' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nome da turma'), { target: { value: 'Juvenil' } })
    expect((screen.getByLabelText('Núcleo') as HTMLInputElement).required).toBe(true)
    fireEvent.change(screen.getByLabelText('Núcleo'), { target: { value: 'Centro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar turma' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/turmas/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/turmas/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ nome: 'Juvenil', nucleo: 'Centro' })
  })

  it('exibe o núcleo e permite preencher o de uma turma antiga', async () => {
    const padrao = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/turmas/' && !init?.method) {
        return Response.json([{ ...turma, nucleo: null }, turmaOutra])
      }
      return padrao(input, init)
    })
    abrir(ROTAS.turmas)
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Infantil A' }))
    const detalhes = screen.getByRole('dialog', { name: 'Infantil A' })
    expect(within(detalhes).getByText('Não informado')).toBeTruthy()
    fireEvent.click(within(detalhes).getByRole('button', { name: 'Fechar detalhes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar Infantil A' }))
    const campo = screen.getByLabelText('Núcleo') as HTMLInputElement
    expect(campo.value).toBe('')
    expect(campo.required).toBe(true)
    fireEvent.change(campo, { target: { value: ' Centro ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar turma' }))
    await waitFor(() => {
      const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/turmas/5') && init?.method === 'PATCH')
      expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ nome: 'Infantil A', nucleo: 'Centro' })
    })
  })

  it('cadastra tamanho em popup', async () => {
    abrir(ROTAS.tamanhos)
    await screen.findByRole('heading', { name: 'Tamanhos' })
    await waitFor(() => expect(screen.getAllByText('Nenhum tamanho cadastrado.')).toHaveLength(2))
    fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar' })[0])
    const dialogo = await screen.findByRole('dialog', { name:     'Novo tamanho de judogi' })
        fireEvent.change(screen.getByLabelText('Tamanho de judogi'), { target: { value: 'M3' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Adicionar' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/tamanhos/'), expect.objectContaining({ method: 'POST' })))
    const envio = requisicao.mock.calls.find(([url, init]) => String(url).endsWith('/tamanhos/') && init?.method === 'POST')
    expect(JSON.parse(String(envio?.[1]?.body))).toEqual({ tipo: 'kimono', nome: 'M3' })
  })

  it('mostra no calendário apenas as atividades futuras', async () => {
    const base = requisicao.getMockImplementation()!
    requisicao.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname === '/atividades/' && (init?.method ?? 'GET') === 'GET') {
        return Response.json([atividade, { ...atividade, id: 20, nome: 'Treino futuro', data: '2999-01-05' }])
      }
      return base(input, init)
    })
    abrir(ROTAS.inicio)
    expect(await screen.findByText('Treino futuro')).toBeTruthy()
    expect(screen.getByText('05/01/2999')).toBeTruthy()
    expect(screen.queryByText('Treino infantil')).toBeNull()
  })

  it('filtra atividades por tipo e por texto', async () => {
    abrir(ROTAS.atividades)
    expect(await screen.findByText('Treino infantil')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Tipo de atividade'), { target: { value: 'troca_de_faixa' } })
    expect(screen.queryByText('Treino infantil')).toBeNull()
    expect(screen.getByText('Exame de graduação')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Tipo de atividade'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Buscar atividade'), { target: { value: 'inexistente' } })
    expect(screen.getByText('Nenhuma atividade encontrada com esses filtros.')).toBeTruthy()
  })

  it('edita o perfil em popup', async () => {
    abrir(ROTAS.perfil)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Editar perfil' })
    fireEvent.change(within(dialogo).getByLabelText('Nome'), { target: { value: 'Ana Sensei' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salvar perfil' }))

    await waitFor(() => expect(requisicao).toHaveBeenCalledWith(expect.stringContaining('/usuarios/eu'), expect.objectContaining({ method: 'PATCH' })))
    const envio = requisicao.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(String(envio?.[1]?.body))).toMatchObject({ nome: 'Ana Sensei', email: 'ana@example.com' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar perfil' })).toBeNull())
    expect(await screen.findByRole('heading', { name: 'Sensei Ana Sensei' })).toBeTruthy()
  })
})
