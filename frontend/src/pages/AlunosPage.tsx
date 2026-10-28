import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2, UserMinus, X } from 'lucide-react'
import { alunosApi, faixasApi, rotuloFaixa, turmasApi, TAMANHOS_FAIXA, TAMANHOS_KIMONO, type Aluno, type Faixa, type Turma } from '../servicos/dominio'
import { useRecurso } from '../hooks/use-recurso'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { EntradaData } from '../components/EntradaData'
import { converterDataParaIso, formatarDataParaEntrada } from '../servicos/datas'
import { ROTAS } from '../routes'

const vazio = {
  nome: '', cpf: '', data_nascimento: '', faixa_id: '', proxima_faixa: '', turma_id: '',
  tamanho_kimono: '', tamanho_faixa: '', codigo_zempo: '',
  responsavel_nome: '', responsavel_cpf: '', responsavel_celular: '',
}
type DadosAluno = typeof vazio

export function AlunosPage() {
  const { turmaId = '' } = useParams()
  const [turmaFiltro, setTurmaFiltro] = useState(turmaId)
  const [selecionando, setSelecionando] = useState(false)
  const [idsSelecionados, setIdsSelecionados] = useState<number[]>([])
  const [buscaAluno, setBuscaAluno] = useState('')
  const modoTurma = Boolean(turmaId)
  const recurso = useRecurso(alunosApi)
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [erroFaixas, setErroFaixas] = useState('')
  const [erroTurmas, setErroTurmas] = useState('')
  const [dados, setDados] = useState<DadosAluno>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [visualizando, setVisualizando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [erroData, setErroData] = useState('')

  useEffect(() => {
    void faixasApi.listar().then(setFaixas).catch((falha: unknown) => {
      setErroFaixas(falha instanceof Error ? falha.message : 'Não foi possível carregar as faixas.')
    })
    void turmasApi.listar().then(setTurmas).catch((falha: unknown) => {
      setErroTurmas(falha instanceof Error ? falha.message : 'Não foi possível carregar as turmas.')
    })
  }, [])

  const turmaAtual = turmas.find((turma) => turma.id === Number(turmaFiltro))
  const alunosListados = turmaFiltro
    ? recurso.itens.filter((aluno) => aluno.turma_id === Number(turmaFiltro) || (aluno.turma_id === null && aluno.turma === turmaAtual?.nome))
    : recurso.itens
  const nomeTurma = (aluno: Aluno) => turmas.find((turma) => turma.id === aluno.turma_id)?.nome ?? aluno.turma

  function iniciarEdicao(aluno: Aluno) {
    setDados({
      nome: aluno.nome,
      cpf: aluno.cpf ?? '',
      data_nascimento: aluno.data_nascimento ? formatarDataParaEntrada(aluno.data_nascimento) : '',
      faixa_id: String(aluno.faixa_id),
      proxima_faixa: aluno.proxima_faixa ?? '',
      turma_id: aluno.turma_id ? String(aluno.turma_id) : '',
      tamanho_kimono: aluno.tamanho_kimono ?? '',
      tamanho_faixa: aluno.tamanho_faixa ?? '',
      codigo_zempo: aluno.codigo_zempo ?? '',
      responsavel_nome: aluno.responsavel_nome ?? '',
      responsavel_cpf: aluno.responsavel_cpf ?? '',
      responsavel_celular: aluno.responsavel_celular ?? '',
    })
    setEditando(aluno.id)
    setVisualizando(null)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dataNascimento = dados.data_nascimento ? converterDataParaIso(dados.data_nascimento) : null
    if (dados.data_nascimento && !dataNascimento) {
      setErroData('Informe uma data válida no formato dd/mm/aaaa.')
      return
    }
    setErroData('')
    const payload = {
      nome: dados.nome.trim(),
      cpf: dados.cpf.trim() || null,
      data_nascimento: dataNascimento,
      faixa_id: Number(dados.faixa_id),
      proxima_faixa: dados.proxima_faixa || null,
      turma_id: dados.turma_id ? Number(dados.turma_id) : null,
      turma: turmas.find((turma) => turma.id === Number(dados.turma_id))?.nome ?? null,
      tamanho_kimono: dados.tamanho_kimono || null,
      tamanho_faixa: dados.tamanho_faixa || null,
      codigo_zempo: dados.codigo_zempo.trim() || null,
      responsavel_nome: dados.responsavel_nome.trim() || null,
      responsavel_cpf: dados.responsavel_cpf.trim() || null,
      responsavel_celular: dados.responsavel_celular.trim() || null,
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

  async function incluirNaTurma() {
    if (!idsSelecionados.length || !turmaAtual) return
    const turma = turmaAtual
    const sucesso = await recurso.executar(() => Promise.all(idsSelecionados.map((id) => alunosApi.atualizar(id, { turma_id: turma.id, turma: turma.nome }))))
    if (sucesso) { setIdsSelecionados([]); setSelecionando(false) }
  }

  async function removerDaTurma(aluno: Aluno) {
    if (window.confirm(`Remover ${aluno.nome} da turma ${turmaAtual?.nome ?? ''}?`)) {
      await recurso.executar(() => alunosApi.atualizar(aluno.id, { turma_id: null, turma: null }))
    }
  }

  async function apagar(aluno: Aluno) {
    if (window.confirm(`Excluir o cadastro de ${aluno.nome}?`)) {
      await recurso.executar(() => alunosApi.apagar(aluno.id))
    }
  }

  return (
    <PaginaModulo kicker="CADASTROS" titulo={turmaAtual ? `Alunos · ${turmaAtual.nome}` : 'Alunos'} descricao="Cadastro dos alunos, com ou sem turma." carregando={recurso.carregando} erro={recurso.erro || erroFaixas || erroTurmas} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar">
        <p>{alunosListados.length} {alunosListados.length === 1 ? 'aluno' : 'alunos'}</p>
                <Link className="module-secondary" to={ROTAS.turmas}>Turmas</Link>
                <button className="module-primary" type="button" onClick={() => { if (modoTurma) { setIdsSelecionados([]); setBuscaAluno(''); setFormAberto(false); setSelecionando(true); return } setDados({ ...vazio, turma_id: turmaFiltro });  setEditando(null); setVisualizando(null); setFormAberto((aberto) => !aberto) }}>
          {modoTurma ? <Plus size={16} /> : formAberto ? <X size={16} /> : <Plus size={16} />}{modoTurma ? 'Adicionar alunos' : formAberto ? 'Fechar formulário' : 'Novo aluno'}
        </button>
      </div>

      {modoTurma ? null : (
      <CampoModulo rotulo="Filtrar por turma"><select value={turmaFiltro} onChange={(event) => setTurmaFiltro(event.target.value)}><option value="">Todas as turmas</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></CampoModulo>
            )}

            {formAberto && (
        <form className="module-form" onSubmit={salvar}>
          <div className="module-form-heading"><h2>{editando ? 'Editar aluno' : 'Novo aluno'}</h2></div>
          <div className="module-form-grid">
            <CampoModulo rotulo="Nome completo"><input required minLength={2} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="CPF"><input value={dados.cpf} onChange={(event) => setDados({ ...dados, cpf: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Data de nascimento"><EntradaData invalid={Boolean(erroData)} value={dados.data_nascimento} onChange={(data_nascimento) => { setErroData(''); setDados({ ...dados, data_nascimento }) }} />{erroData && <small className="module-field-error" role="alert">{erroData}</small>}</CampoModulo>
            <CampoModulo rotulo="Faixa"><select required value={dados.faixa_id} onChange={(event) => setDados({ ...dados, faixa_id: event.target.value })}><option value="">Selecione</option>{faixas.map((faixa) => <option key={faixa.id} value={faixa.id}>{rotuloFaixa(faixa)}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Próxima faixa"><select value={dados.proxima_faixa} onChange={(event) => setDados({ ...dados, proxima_faixa: event.target.value })}><option value="">Não definida</option>{faixas.map((faixa) => <option key={faixa.id} value={rotuloFaixa(faixa)}>{rotuloFaixa(faixa)}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Turma"><select value={dados.turma_id} onChange={(event) => setDados({ ...dados, turma_id: event.target.value })}><option value="">Sem turma</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Tamanho do kimono"><select value={dados.tamanho_kimono} onChange={(event) => setDados({ ...dados, tamanho_kimono: event.target.value })}><option value="">Não definido</option>{TAMANHOS_KIMONO.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Tamanho da faixa"><select value={dados.tamanho_faixa} onChange={(event) => setDados({ ...dados, tamanho_faixa: event.target.value })}><option value="">Não definido</option>{TAMANHOS_FAIXA.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Código Zempo"><input value={dados.codigo_zempo} onChange={(event) => setDados({ ...dados, codigo_zempo: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Nome do responsável"><input value={dados.responsavel_nome} onChange={(event) => setDados({ ...dados, responsavel_nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="CPF do responsável"><input inputMode="numeric" value={dados.responsavel_cpf} onChange={(event) => setDados({ ...dados, responsavel_cpf: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Celular do responsável"><input type="tel" inputMode="tel" value={dados.responsavel_celular} onChange={(event) => setDados({ ...dados, responsavel_celular: event.target.value })} /></CampoModulo>
          </div>
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando || Boolean(erroFaixas || erroTurmas)}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar aluno'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
      )}

      {selecionando && turmaAtual && (() => {
        const termo = buscaAluno.trim().toLocaleLowerCase('pt-BR')
        const disponiveis = recurso.itens.filter((aluno) => aluno.turma_id !== turmaAtual.id && aluno.nome.toLocaleLowerCase('pt-BR').includes(termo))
        return (
          <ModalDetalhes titulo={`Adicionar alunos · ${turmaAtual.nome}`} aoFechar={() => setSelecionando(false)}>
            <div className="participant-picker-toolbar"><p>{idsSelecionados.length} {idsSelecionados.length === 1 ? 'selecionado' : 'selecionados'}</p></div>
            <div className="participant-picker-filters">
              <CampoModulo rotulo="Buscar aluno"><input type="search" value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Digite um nome" /></CampoModulo>
            </div>
            <div className="participant-picker-list" aria-label="Alunos disponíveis">
              {disponiveis.map((aluno) => {
                const marcado = idsSelecionados.includes(aluno.id)
                return <label className={`participant-picker-row${marcado ? ' is-selected' : ''}`} key={aluno.id}>
                  <input aria-label={`Adicionar ${aluno.nome}`} type="checkbox" checked={marcado} onChange={(event) => setIdsSelecionados((atuais) => event.target.checked ? [...atuais, aluno.id] : atuais.filter((id) => id !== aluno.id))} />
                  <span className="participant-picker-check" aria-hidden="true" />
                  <span className="participant-picker-identity"><strong>{aluno.nome}</strong><small>{nomeTurma(aluno) ?? 'Sem turma'} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}</small></span>
                </label>
              })}
              {!disponiveis.length && <p className="module-empty">Nenhum aluno disponível.</p>}
            </div>
            <div className="module-form-actions participant-picker-actions">
              <button className="module-primary" type="button" disabled={!idsSelecionados.length || recurso.salvando} onClick={() => void incluirNaTurma()}>{recurso.salvando ? 'Salvando...' : `Adicionar à turma (${idsSelecionados.length})`}</button>
              <button className="module-secondary" type="button" onClick={() => setSelecionando(false)}>Cancelar</button>
            </div>
          </ModalDetalhes>
        )
      })()}

      {visualizando !== null && (() => {
        const aluno = alunosListados.find((item) => item.id === visualizando)
        if (!aluno) return null
        return (
          <ModalDetalhes titulo={aluno.nome} aoFechar={() => setVisualizando(null)}>
            <dl className="module-details">
              <div><dt>CPF</dt><dd>{aluno.cpf ?? 'Não informado'}</dd></div>
              <div><dt>Data de nascimento</dt><dd>{aluno.data_nascimento ? formatarDataParaEntrada(aluno.data_nascimento) : 'Não informada'}</dd></div>
              <div><dt>Faixa</dt><dd>{faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Não informada'}</dd></div>
              <div><dt>Próxima faixa</dt><dd>{aluno.proxima_faixa ?? 'Não definida'}</dd></div>
              <div><dt>Turma</dt><dd>{nomeTurma(aluno) ?? 'Sem turma'}</dd></div>
              <div><dt>Tamanho do kimono</dt><dd>{aluno.tamanho_kimono ?? 'Não informado'}</dd></div>
              <div><dt>Tamanho da faixa</dt><dd>{aluno.tamanho_faixa ?? 'Não informado'}</dd></div>
              <div><dt>Código Zempo</dt><dd>{aluno.codigo_zempo ?? 'Não informado'}</dd></div>
              <div><dt>Responsável</dt><dd>{aluno.responsavel_nome ?? 'Não informado'}</dd></div>
              <div><dt>CPF do responsável</dt><dd>{aluno.responsavel_cpf ?? 'Não informado'}</dd></div>
              <div><dt>Celular do responsável</dt><dd>{aluno.responsavel_celular ?? 'Não informado'}</dd></div>
            </dl>
            <div className="module-form-actions"><button className="module-primary" type="button" onClick={() => iniciarEdicao(aluno)}><Pencil size={16} />Editar</button></div>
          </ModalDetalhes>
        )
      })()}

      <div className="module-list" aria-label="Lista de alunos">
        {alunosListados.map((aluno) => (
          <article className="module-record" key={aluno.id}>
            <button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${aluno.nome}`} onClick={() => { setFormAberto(false); setEditando(null); setVisualizando(aluno.id) }}><strong>{aluno.nome}</strong><span>{aluno.cpf ? `CPF ${aluno.cpf}` : 'CPF não informado'} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}{aluno.proxima_faixa ? ` · Próxima: ${aluno.proxima_faixa}` : ''}</span></button>
            <div className="record-actions"><BotaoIcone label={`Editar ${aluno.nome}`} onClick={() => iniciarEdicao(aluno)}><Pencil size={16} /></BotaoIcone>{modoTurma ? <BotaoIcone label={`Remover ${aluno.nome} da turma`} onClick={() => void removerDaTurma(aluno)}><UserMinus size={16} /></BotaoIcone> : <BotaoIcone label={`Excluir ${aluno.nome}`} onClick={() => void apagar(aluno)}><Trash2 size={16} /></BotaoIcone>}</div>
          </article>
        ))}
        {!alunosListados.length && <p className="module-empty">Nenhum aluno encontrado.</p>}
      </div>
    </PaginaModulo>
  )
}
