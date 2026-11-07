import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { ExportarFrequencia, RegistroFrequencia } from '../components/FrequenciaTurmas'
import { HistoricoFrequencia } from '../components/HistoricoFrequencia'
import { useRecurso } from '../hooks/use-recurso'
import { alunosApi, turmasApi, type Aluno, type Turma } from '../servicos/dominio'
import { normalizarBusca } from '../servicos/busca'
import { ROTAS } from '../routes'

const vazio = { nome: '', nucleo: '' }
type DadosTurma = typeof vazio

export function TurmasPage() {
  const recurso = useRecurso(turmasApi)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [erroAlunos, setErroAlunos] = useState('')
  const [dados, setDados] = useState<DadosTurma>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [visualizando, setVisualizando] = useState<Turma | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [frequencia, setFrequencia] = useState<{ turma: Turma; data?: string } | null>(null)
  const [exportando, setExportando] = useState(false)
  const [busca, setBusca] = useState('')
  const termoBusca = normalizarBusca(busca)
  const turmasListadas = recurso.itens.filter((turma) =>
    normalizarBusca(turma.nome).includes(termoBusca) || normalizarBusca(turma.nucleo ?? '').includes(termoBusca))

  useEffect(() => {
    void alunosApi.listar().then(setAlunos).catch((falha: unknown) => {
      setErroAlunos(falha instanceof Error ? falha.message : 'Não foi possível carregar os alunos.')
    })
  }, [])

  function iniciarEdicao(turma: Turma) {
    setDados({ nome: turma.nome, nucleo: turma.nucleo ?? '' })
    setEditando(turma.id)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = { nome: dados.nome.trim(), nucleo: dados.nucleo.trim() }
    const sucesso = await recurso.executar(() => editando
      ? turmasApi.atualizar(editando, payload)
      : turmasApi.criar(payload))
    if (sucesso) {
      setDados(vazio)
      setEditando(null)
      setFormAberto(false)
    }
  }

  async function apagar(turma: Turma) {
    const possuiAlunos = alunos.some((aluno) => aluno.turma_ids.includes(turma.id))
    if (!possuiAlunos && window.confirm(`Excluir a turma ${turma.nome}? As chamadas desta turma também serão excluídas.`)) await recurso.executar(() => turmasApi.apagar(turma.id), 'Turma excluída com sucesso.')
  }

  return (
    <PaginaModulo kicker="ORGANIZAÇÃO" titulo="Turmas" descricao="Organize os alunos por turma." carregando={recurso.carregando} erro={recurso.erro || erroAlunos} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar turmas-toolbar"><p>{recurso.itens.length} turmas</p><div className="turmas-acoes"><button className="module-primary" type="button" onClick={() => { setDados(vazio); setEditando(null); setFormAberto(true) }}><Plus size={16} />Nova turma</button><button className="module-secondary" type="button" onClick={() => setExportando(true)}><FileText size={16} aria-hidden="true" />Gerar planilha de frequência das turmas</button></div></div>
      <div className="module-filters" aria-label="Filtros de turmas"><CampoModulo rotulo="Buscar turma"><input type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome ou núcleo" /></CampoModulo></div>
      {formAberto && <ModalDetalhes contexto="CADASTRO" titulo={editando ? 'Editar turma' : 'Nova turma'} aoFechar={() => setFormAberto(false)}><form className="module-form" onSubmit={salvar}><div className="module-form-grid">
        <CampoModulo rotulo="Nome da turma"><input required minLength={2} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
        <CampoModulo rotulo="Núcleo"><input required minLength={2} maxLength={120} value={dados.nucleo} onChange={(event) => setDados({ ...dados, nucleo: event.target.value })} /></CampoModulo>
      </div><div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : 'Salvar turma'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div></form></ModalDetalhes>}
      {visualizando && <ModalDetalhes titulo={visualizando.nome} aoFechar={() => setVisualizando(null)}>
        <dl className="module-details"><div><dt>Núcleo</dt><dd>{visualizando.nucleo || 'Não informado'}</dd></div><div><dt>Alunos</dt><dd>{alunos.filter((aluno) => aluno.turma_ids.includes(visualizando.id)).length}</dd></div></dl>
        <div className="turma-detalhes-acoes"><Link className="module-primary" to={ROTAS.turmaAlunos.replace(':turmaId', String(visualizando.id))}>Gerenciar alunos</Link><button className="module-secondary" type="button" onClick={() => { setFrequencia({ turma: visualizando }); setVisualizando(null) }}>Registro de frequência</button></div>
        <HistoricoFrequencia turma={visualizando} editar={(data) => { setFrequencia({ turma: visualizando, data }); setVisualizando(null) }} />
      </ModalDetalhes>}
      {frequencia && <RegistroFrequencia turma={frequencia.turma} dataInicial={frequencia.data} aoFechar={() => setFrequencia(null)} />}
      {exportando && <ExportarFrequencia turmas={recurso.itens} aoFechar={() => setExportando(false)} />}
      <div className="module-list" aria-label="Lista de turmas">{turmasListadas.map((turma) => {
        const totalAlunos = alunos.filter((aluno) => aluno.turma_ids.includes(turma.id)).length
        return <article className="module-record" key={turma.id}><button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${turma.nome}`} onClick={() => setVisualizando(turma)}><strong>{turma.nome}</strong><span>{turma.nucleo ? `Núcleo: ${turma.nucleo} · ` : ''}{totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'}</span></button><div className="record-actions turma-record-actions"><div className="turma-record-links"><Link className="module-secondary" to={ROTAS.turmaAlunos.replace(':turmaId', String(turma.id))}>Gerenciar alunos</Link><button className="module-secondary" type="button" onClick={() => setFrequencia({ turma })}>Registro de frequência</button></div><div className="turma-record-icones"><BotaoIcone label={`Editar ${turma.nome}`} onClick={() => iniciarEdicao(turma)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={totalAlunos ? `Exclua os alunos antes de excluir ${turma.nome}` : `Excluir ${turma.nome}`} disabled={totalAlunos > 0} onClick={() => void apagar(turma)}><Trash2 size={16} /></BotaoIcone></div></div></article>
      })}{!turmasListadas.length && <p className="module-empty">{recurso.itens.length ? 'Nenhuma turma encontrada.' : 'Nenhuma turma cadastrada.'}</p>}</div>
    </PaginaModulo>
  )
}
