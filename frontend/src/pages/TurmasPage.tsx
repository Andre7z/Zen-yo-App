import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import { alunosApi, turmasApi, type Aluno, type Turma } from '../servicos/dominio'
import { ROTAS } from '../routes'

const vazio = { nome: '' }
type DadosTurma = typeof vazio

export function TurmasPage() {
  const recurso = useRecurso(turmasApi)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [erroAlunos, setErroAlunos] = useState('')
  const [dados, setDados] = useState<DadosTurma>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)

  useEffect(() => {
    void alunosApi.listar().then(setAlunos).catch((falha: unknown) => {
      setErroAlunos(falha instanceof Error ? falha.message : 'Não foi possível carregar os alunos.')
    })
  }, [])

  function iniciarEdicao(turma: Turma) {
    setDados({ nome: turma.nome })
    setEditando(turma.id)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = { nome: dados.nome.trim() }
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
    const possuiAlunos = alunos.some((aluno) => aluno.turma_id === turma.id)
    if (!possuiAlunos && window.confirm(`Excluir a turma ${turma.nome}?`)) await recurso.executar(() => turmasApi.apagar(turma.id))
  }

  return (
    <PaginaModulo kicker="ORGANIZAÇÃO" titulo="Turmas" descricao="Organize os alunos por turma." carregando={recurso.carregando} erro={recurso.erro || erroAlunos} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} turmas</p><button className="module-primary" type="button" onClick={() => { setDados(vazio); setEditando(null); setFormAberto((atual) => !atual) }}>{formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar formulário' : 'Nova turma'}</button></div>
      {formAberto && <form className="module-form" onSubmit={salvar}><div className="module-form-heading"><h2>{editando ? 'Editar turma' : 'Nova turma'}</h2></div><div className="module-form-grid">
        <CampoModulo rotulo="Nome da turma"><input required minLength={2} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
      </div><div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : 'Salvar turma'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div></form>}
      <div className="module-list" aria-label="Lista de turmas">{recurso.itens.map((turma) => {
        const totalAlunos = alunos.filter((aluno) => aluno.turma_id === turma.id || (aluno.turma_id === null && aluno.turma === turma.nome)).length
        return <article className="module-record" key={turma.id}><div className="record-main"><strong>{turma.nome}</strong><span>{totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'}</span></div><div className="record-actions"><Link className="module-secondary" to={ROTAS.turmaAlunos.replace(':turmaId', String(turma.id))}>Gerenciar alunos</Link><BotaoIcone label={`Editar ${turma.nome}`} onClick={() => iniciarEdicao(turma)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={totalAlunos ? `Exclua os alunos antes de excluir ${turma.nome}` : `Excluir ${turma.nome}`} disabled={totalAlunos > 0} onClick={() => void apagar(turma)}><Trash2 size={16} /></BotaoIcone></div></article>
      })}{!recurso.itens.length && <p className="module-empty">Nenhuma turma cadastrada.</p>}</div>
    </PaginaModulo>
  )
}
