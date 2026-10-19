import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { alunosApi, faixasApi, turmasApi, type Aluno, type Faixa, type Turma } from '../servicos/dominio'
import { useRecurso } from '../hooks/use-recurso'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ROTAS } from '../routes'

const vazio = {
  nome: '', cpf: '', data_nascimento: '', faixa_id: '', proxima_faixa: '', turma_id: '',
  tamanho_kimono: '', tamanho_faixa: '', codigo_zempo: '',
}
type DadosAluno = typeof vazio

export function AlunosPage() {
  const { turmaId = '' } = useParams()
  const recurso = useRecurso(alunosApi)
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [erroFaixas, setErroFaixas] = useState('')
  const [erroTurmas, setErroTurmas] = useState('')
  const [dados, setDados] = useState<DadosAluno>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [visualizando, setVisualizando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)

  useEffect(() => {
    void faixasApi.listar().then(setFaixas).catch((falha: unknown) => {
      setErroFaixas(falha instanceof Error ? falha.message : 'Não foi possível carregar as faixas.')
    })
    void turmasApi.listar().then(setTurmas).catch((falha: unknown) => {
      setErroTurmas(falha instanceof Error ? falha.message : 'Não foi possível carregar as turmas.')
    })
  }, [])

  const turmaAtual = turmas.find((turma) => turma.id === Number(turmaId))
  const alunosDaTurma = recurso.itens.filter((aluno) => aluno.turma_id === Number(turmaId) || (aluno.turma_id === null && aluno.turma === turmaAtual?.nome))

  function iniciarEdicao(aluno: Aluno) {
    setDados({
      nome: aluno.nome,
      cpf: aluno.cpf ?? '',
      data_nascimento: aluno.data_nascimento ?? '',
      faixa_id: String(aluno.faixa_id),
      proxima_faixa: aluno.proxima_faixa ?? '',
      turma_id: String(turmaId),
      tamanho_kimono: aluno.tamanho_kimono ?? '',
      tamanho_faixa: aluno.tamanho_faixa ?? '',
      codigo_zempo: aluno.codigo_zempo ?? '',
    })
    setEditando(aluno.id)
    setVisualizando(null)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      nome: dados.nome.trim(),
      cpf: dados.cpf.trim() || null,
      data_nascimento: dados.data_nascimento || null,
      faixa_id: Number(dados.faixa_id),
      proxima_faixa: dados.proxima_faixa || null,
      turma_id: Number(turmaId),
      turma: turmaAtual?.nome ?? null,
      tamanho_kimono: dados.tamanho_kimono.trim() || null,
      tamanho_faixa: dados.tamanho_faixa.trim() || null,
      codigo_zempo: dados.codigo_zempo.trim() || null,
    }
    const sucesso = await recurso.executar(() => editando
      ? alunosApi.atualizar(editando, payload)
      : alunosApi.criar(payload))
    if (sucesso) {
      setDados(vazio)
      setEditando(null)
      setFormAberto(false)
    }
  }

  async function apagar(aluno: Aluno) {
    if (window.confirm(`Excluir o cadastro de ${aluno.nome}?`)) {
      await recurso.executar(() => alunosApi.apagar(aluno.id))
    }
  }

  return (
    <PaginaModulo kicker="TURMAS" titulo={turmaAtual ? `Alunos · ${turmaAtual.nome}` : 'Alunos da turma'} descricao="Cadastros e graduações dos alunos desta turma." carregando={recurso.carregando} erro={recurso.erro || erroFaixas || erroTurmas} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar">
        <p>{alunosDaTurma.length} {alunosDaTurma.length === 1 ? 'aluno' : 'alunos'}</p>
        <Link className="module-secondary" to={ROTAS.turmas}>Voltar para turmas</Link>
        <button className="module-primary" type="button" onClick={() => { setDados({ ...vazio, turma_id: turmaId }); setEditando(null); setVisualizando(null); setFormAberto((aberto) => !aberto) }}>
          {formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar formulário' : 'Novo aluno'}
        </button>
      </div>

      {formAberto && (
        <form className="module-form" onSubmit={salvar}>
          <div className="module-form-heading"><h2>{editando ? 'Editar aluno' : 'Novo aluno'}</h2></div>
          <div className="module-form-grid">
            <CampoModulo rotulo="Nome completo"><input required minLength={2} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="CPF"><input value={dados.cpf} onChange={(event) => setDados({ ...dados, cpf: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Data de nascimento"><input type="date" value={dados.data_nascimento} onChange={(event) => setDados({ ...dados, data_nascimento: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Faixa"><select required value={dados.faixa_id} onChange={(event) => setDados({ ...dados, faixa_id: event.target.value })}><option value="">Selecione</option>{faixas.map((faixa) => <option key={faixa.id} value={faixa.id}>{faixa.nome}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Próxima faixa"><select value={dados.proxima_faixa} onChange={(event) => setDados({ ...dados, proxima_faixa: event.target.value })}><option value="">Não definida</option>{faixas.map((faixa) => <option key={faixa.id} value={faixa.nome}>{faixa.nome}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Tamanho do kimono"><input value={dados.tamanho_kimono} onChange={(event) => setDados({ ...dados, tamanho_kimono: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Tamanho da faixa"><input value={dados.tamanho_faixa} onChange={(event) => setDados({ ...dados, tamanho_faixa: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Código Zempo"><input value={dados.codigo_zempo} onChange={(event) => setDados({ ...dados, codigo_zempo: event.target.value })} /></CampoModulo>
          </div>
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando || Boolean(erroFaixas || erroTurmas) || !turmaAtual}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar aluno'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
      )}

      {visualizando !== null && (() => {
        const aluno = alunosDaTurma.find((item) => item.id === visualizando)
        if (!aluno) return null
        return (
          <section className="module-form" aria-label="Detalhes do aluno">
            <div className="module-form-heading"><h2>{aluno.nome}</h2></div>
            <dl className="module-details">
              <div><dt>CPF</dt><dd>{aluno.cpf ?? 'Não informado'}</dd></div>
              <div><dt>Data de nascimento</dt><dd>{aluno.data_nascimento ?? 'Não informada'}</dd></div>
              <div><dt>Faixa</dt><dd>{faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Não informada'}</dd></div>
              <div><dt>Próxima faixa</dt><dd>{aluno.proxima_faixa ?? 'Não definida'}</dd></div>
              <div><dt>Turma</dt><dd>{turmaAtual?.nome ?? aluno.turma ?? 'Não informada'}</dd></div>
              <div><dt>Tamanho do kimono</dt><dd>{aluno.tamanho_kimono ?? 'Não informado'}</dd></div>
              <div><dt>Tamanho da faixa</dt><dd>{aluno.tamanho_faixa ?? 'Não informado'}</dd></div>
              <div><dt>Código Zempo</dt><dd>{aluno.codigo_zempo ?? 'Não informado'}</dd></div>
            </dl>
            <div className="module-form-actions"><button className="module-primary" type="button" onClick={() => iniciarEdicao(aluno)}><Pencil size={16} />Editar</button><button className="module-secondary" type="button" onClick={() => setVisualizando(null)}>Fechar</button></div>
          </section>
        )
      })()}

      <div className="module-list" aria-label="Lista de alunos">
        {alunosDaTurma.map((aluno) => (
          <article className="module-record" key={aluno.id}>
            <button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${aluno.nome}`} onClick={() => { setFormAberto(false); setEditando(null); setVisualizando(aluno.id) }}><strong>{aluno.nome}</strong><span>{aluno.cpf ? `CPF ${aluno.cpf}` : 'CPF não informado'} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}{aluno.proxima_faixa ? ` · Próxima: ${aluno.proxima_faixa}` : ''}</span></button>
            <div className="record-actions"><BotaoIcone label={`Editar ${aluno.nome}`} onClick={() => iniciarEdicao(aluno)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${aluno.nome}`} onClick={() => void apagar(aluno)}><Trash2 size={16} /></BotaoIcone></div>
          </article>
        ))}
        {!alunosDaTurma.length && <p className="module-empty">Nenhum aluno nesta turma.</p>}
      </div>
    </PaginaModulo>
  )
}
