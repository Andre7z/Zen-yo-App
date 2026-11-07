import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2, UserMinus } from 'lucide-react'
import { alunosApi, faixasApi, ordenarAlunosPorNome, rotuloFaixa, turmasApi, type Aluno, type Faixa, type Turma } from '../servicos/dominio'
import { opcoesDeTamanho, useTamanhos } from '../hooks/use-tamanhos'
import { useRecurso } from '../hooks/use-recurso'
import { useNotificacao } from '../notificacoes-context'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { EntradaData } from '../components/EntradaData'
import { CampoBusca } from '../components/CampoBusca'
import { calcularIdade, converterDataParaIso, formatarDataParaEntrada, validarDataNascimento } from '../servicos/datas'
import { cpfValido, formatarCpf } from '../servicos/cpf'
import { exibirTelefone, formatarTelefone } from '../servicos/telefone'
import { formatarCodigoZempo } from '../servicos/zempo'
import { normalizarBusca } from '../servicos/busca'

const vazio = {
  nome: '', cpf: '', data_nascimento: '', genero: '', faixa_id: '', proxima_faixa: '',
  celular: '',
  tamanho_kimono: '', tamanho_faixa: '', codigo_zempo: '', peso: '',
  responsavel_nome: '', responsavel_cpf: '', responsavel_celular: '', responsavel_parentesco: '',
}
type DadosAluno = typeof vazio

export function AlunosPage() {
  const { turmaId = '' } = useParams()
  const [turmaFiltro, setTurmaFiltro] = useState(turmaId)
  const [selecionando, setSelecionando] = useState(false)
  const [idsSelecionados, setIdsSelecionados] = useState<number[]>([])
  const [buscaAluno, setBuscaAluno] = useState('')
  const [buscaLista, setBuscaLista] = useState('')
  const modoTurma = Boolean(turmaId)
  const recurso = useRecurso(alunosApi)
  const notificacao = useNotificacao()
  const tamanhos = useTamanhos()
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [erroFaixas, setErroFaixas] = useState('')
  const [erroTurmas, setErroTurmas] = useState('')
  const [dados, setDados] = useState<DadosAluno>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [visualizando, setVisualizando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [erroData, setErroData] = useState('')
  const [erroPeso, setErroPeso] = useState('')
  const [erroCpf, setErroCpf] = useState('')
  const [erroCpfResponsavel, setErroCpfResponsavel] = useState('')

  useEffect(() => {
    void faixasApi.listar().then(setFaixas).catch((falha: unknown) => {
      setErroFaixas(falha instanceof Error ? falha.message : 'Não foi possível carregar as faixas.')
    })
    void turmasApi.listar().then(setTurmas).catch((falha: unknown) => {
      setErroTurmas(falha instanceof Error ? falha.message : 'Não foi possível carregar as turmas.')
    })
  }, [])

  const turmaAtual = turmas.find((turma) => turma.id === Number(turmaFiltro))
  const termoBusca = normalizarBusca(buscaLista)
  const alunosListados = ordenarAlunosPorNome(recurso.itens.filter((aluno) =>
    (!turmaFiltro || aluno.turma_ids.includes(Number(turmaFiltro)))
    && normalizarBusca(aluno.nome).includes(termoBusca)))
  const nomeTurma = (aluno: Aluno) => turmas
    .filter((turma) => aluno.turma_ids.includes(turma.id))
    .map((turma) => turma.nome)
    .join(', ')

  function iniciarEdicao(aluno: Aluno) {
    setDados({
      nome: aluno.nome,
      cpf: aluno.cpf ?? '',
      data_nascimento: aluno.data_nascimento ? formatarDataParaEntrada(aluno.data_nascimento) : '',
      genero: aluno.genero ?? '',
      faixa_id: String(aluno.faixa_id),
      proxima_faixa: aluno.proxima_faixa ?? '',
      celular: exibirTelefone(aluno.celular),
      tamanho_kimono: aluno.tamanho_kimono ?? '',
      peso: aluno.peso !== null && aluno.peso !== undefined ? String(aluno.peso).replace('.', ',') : '',
      tamanho_faixa: aluno.tamanho_faixa ?? '',
      codigo_zempo: aluno.codigo_zempo ?? '',
      responsavel_nome: aluno.responsavel_nome ?? '',
      responsavel_cpf: aluno.responsavel_cpf ?? '',
      responsavel_celular: exibirTelefone(aluno.responsavel_celular),
      responsavel_parentesco: aluno.responsavel_parentesco ?? '',
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
    if (dataNascimento) {
      const erroNascimento = validarDataNascimento(dataNascimento)
      if (erroNascimento) {
        setErroData(erroNascimento)
        return
      }
    }
    setErroData('')
    const textoPeso = dados.peso.trim().replace(',', '.')
    const peso = textoPeso ? Number(textoPeso) : null
    if (peso !== null && (!Number.isFinite(peso) || peso <= 0 || peso > 500)) {
      setErroPeso('Informe um peso válido entre 0 e 500 kg.')
      return
    }
    setErroPeso('')
    const cpfInvalido = dados.cpf.trim() !== '' && !cpfValido(dados.cpf)
    const cpfResponsavelInvalido = dados.responsavel_cpf.trim() !== '' && !cpfValido(dados.responsavel_cpf)
    setErroCpf(cpfInvalido ? 'CPF inválido. Confira os números digitados.' : '')
    setErroCpfResponsavel(cpfResponsavelInvalido ? 'CPF inválido. Confira os números digitados.' : '')
    if (cpfInvalido || cpfResponsavelInvalido) {
      notificacao.erro(cpfInvalido ? 'CPF do aluno inválido. Confira os números digitados.' : 'CPF do responsável inválido. Confira os números digitados.')
      return
    }
    const payload = {
      nome: dados.nome.trim(),
      cpf: dados.cpf.trim() || null,
      data_nascimento: dataNascimento,
      genero: dados.genero || null,
      faixa_id: Number(dados.faixa_id),
      proxima_faixa: dados.proxima_faixa || null,
      celular: dados.celular.trim() || null,
      tamanho_kimono: dados.tamanho_kimono || null,
      peso,
      tamanho_faixa: dados.tamanho_faixa || null,
      codigo_zempo: dados.codigo_zempo.trim() || null,
      responsavel_nome: dados.responsavel_nome.trim() || null,
      responsavel_cpf: dados.responsavel_cpf.trim() || null,
      responsavel_celular: dados.responsavel_celular.trim() || null,
      responsavel_parentesco: dados.responsavel_parentesco.trim() || null,
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
    const sucesso = await recurso.executar(() => turmasApi.adicionarAlunos(turmaAtual.id, idsSelecionados), 'Alunos adicionados à turma.')
    if (sucesso) { setIdsSelecionados([]); setSelecionando(false) }
  }

  async function removerDaTurma(aluno: Aluno) {
    if (window.confirm(`Remover ${aluno.nome} da turma ${turmaAtual?.nome ?? ''}?`)) {
      if (turmaAtual) await recurso.executar(() => turmasApi.removerAluno(turmaAtual.id, aluno.id), 'Aluno removido da turma.')
    }
  }

  async function apagar(aluno: Aluno) {
    if (window.confirm(`Excluir o cadastro de ${aluno.nome}? Seus registros de frequência nas turmas também serão excluídos.`)) {
      await recurso.executar(() => alunosApi.apagar(aluno.id), 'Aluno excluído com sucesso.')
    }
  }

  return (
    <PaginaModulo kicker="CADASTROS" titulo={turmaAtual ? `Alunos · ${turmaAtual.nome}` : 'Alunos'} descricao="Cadastro dos alunos, com ou sem turma." carregando={recurso.carregando} erro={recurso.erro || erroFaixas || erroTurmas} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar">
        <p>{alunosListados.length} {alunosListados.length === 1 ? 'aluno' : 'alunos'}</p>
                <button className="module-primary" type="button" onClick={() => { if (modoTurma) { setIdsSelecionados([]); setBuscaAluno(''); setFormAberto(false); setSelecionando(true); return } setDados(vazio); setEditando(null); setVisualizando(null); setFormAberto(true) }}>
          <Plus size={16} />{modoTurma ? 'Adicionar alunos' : 'Novo aluno'}
        </button>
      </div>

      <div className="module-filters" aria-label="Filtros de alunos">
        <CampoBusca rotulo="Buscar aluno" value={buscaLista} onChange={(event) => setBuscaLista(event.target.value)} placeholder="Nome do aluno" />
        {!modoTurma && <CampoModulo rotulo="Filtrar por turma"><select value={turmaFiltro} onChange={(event) => setTurmaFiltro(event.target.value)}><option value="">Todas as turmas</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></CampoModulo>}
      </div>

            {formAberto && (
              <ModalDetalhes contexto="CADASTRO" titulo={editando ? 'Editar aluno' : 'Novo aluno'} aoFechar={() => setFormAberto(false)}>
        <form className="module-form" onSubmit={salvar}>
          <div className="module-form-grid">
            <CampoModulo rotulo="Nome completo"><input required minLength={2} pattern="[\p{L}\p{M} ]{2,}" title="Use apenas letras e espaços." value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value.replace(/[^\p{L}\p{M} ]/gu, '') })} /></CampoModulo>
            <CampoModulo rotulo="CPF"><input aria-label="CPF" inputMode="numeric" aria-invalid={Boolean(erroCpf)} placeholder="000.000.000-00" value={dados.cpf} onChange={(event) => { setErroCpf(''); setDados({ ...dados, cpf: formatarCpf(event.target.value) }) }} />{erroCpf && <small className="module-field-error" role="alert">{erroCpf}</small>}</CampoModulo>
            <CampoModulo rotulo="Data de nascimento"><EntradaData invalid={Boolean(erroData)} value={dados.data_nascimento} onChange={(data_nascimento) => { setErroData(''); setDados({ ...dados, data_nascimento }) }} />{erroData && <small className="module-field-error" role="alert">{erroData}</small>}</CampoModulo>
            <CampoModulo rotulo="Gênero"><select value={dados.genero} onChange={(event) => setDados({ ...dados, genero: event.target.value })}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></CampoModulo>
            <CampoModulo rotulo="Faixa"><select required value={dados.faixa_id} onChange={(event) => setDados({ ...dados, faixa_id: event.target.value })}><option value="">Selecione</option>{faixas.map((faixa) => <option key={faixa.id} value={faixa.id}>{rotuloFaixa(faixa)}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Próxima faixa"><select value={dados.proxima_faixa} onChange={(event) => setDados({ ...dados, proxima_faixa: event.target.value })}><option value="">Não definida</option>{faixas.map((faixa) => <option key={faixa.id} value={rotuloFaixa(faixa)}>{rotuloFaixa(faixa)}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Celular do aluno"><input type="tel" inputMode="tel" placeholder="(00)00000-0000" value={dados.celular} onChange={(event) => setDados({ ...dados, celular: formatarTelefone(event.target.value) })} /></CampoModulo>
            <CampoModulo rotulo="Peso (kg)"><input inputMode="decimal" value={dados.peso} onChange={(event) => { setErroPeso(''); setDados({ ...dados, peso: event.target.value }) }} />{erroPeso && <small className="module-field-error" role="alert">{erroPeso}</small>}</CampoModulo>
            <CampoModulo rotulo="Tamanho do judogi"><select value={dados.tamanho_kimono} onChange={(event) => setDados({ ...dados, tamanho_kimono: event.target.value })}><option value="">Não definido</option>{opcoesDeTamanho(tamanhos.kimono, dados.tamanho_kimono).map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Tamanho da faixa"><select value={dados.tamanho_faixa} onChange={(event) => setDados({ ...dados, tamanho_faixa: event.target.value })}><option value="">Não definido</option>{opcoesDeTamanho(tamanhos.faixa, dados.tamanho_faixa).map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
            <CampoModulo rotulo="Código Zempo"><input inputMode="numeric" placeholder="JU000000" value={dados.codigo_zempo} onChange={(event) => setDados({ ...dados, codigo_zempo: formatarCodigoZempo(event.target.value) })} /></CampoModulo>
            <CampoModulo rotulo="Nome do responsável"><input value={dados.responsavel_nome} onChange={(event) => setDados({ ...dados, responsavel_nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="CPF do responsável"><input aria-label="CPF do responsável" inputMode="numeric" aria-invalid={Boolean(erroCpfResponsavel)} placeholder="000.000.000-00" value={dados.responsavel_cpf} onChange={(event) => { setErroCpfResponsavel(''); setDados({ ...dados, responsavel_cpf: formatarCpf(event.target.value) }) }} />{erroCpfResponsavel && <small className="module-field-error" role="alert">{erroCpfResponsavel}</small>}</CampoModulo>
            <CampoModulo rotulo="Celular do responsável"><input type="tel" inputMode="tel" placeholder="(00)00000-0000" value={dados.responsavel_celular} onChange={(event) => setDados({ ...dados, responsavel_celular: formatarTelefone(event.target.value) })} /></CampoModulo>
            <CampoModulo rotulo="Parentesco do responsável"><input value={dados.responsavel_parentesco} onChange={(event) => setDados({ ...dados, responsavel_parentesco: event.target.value })} /></CampoModulo>
          </div>
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando || Boolean(erroFaixas || erroTurmas)}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar aluno'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
              </ModalDetalhes>
      )}

      {selecionando && turmaAtual && (() => {
        const termo = buscaAluno.trim().toLocaleLowerCase('pt-BR')
        const disponiveis = ordenarAlunosPorNome(recurso.itens.filter((aluno) => !aluno.turma_ids.includes(turmaAtual.id) && aluno.nome.toLocaleLowerCase('pt-BR').includes(termo)))
        return (
          <ModalDetalhes titulo={`Adicionar alunos · ${turmaAtual.nome}`} aoFechar={() => setSelecionando(false)}>
            <div className="participant-picker-toolbar"><p>{idsSelecionados.length} {idsSelecionados.length === 1 ? 'selecionado' : 'selecionados'}</p></div>
            <div className="participant-picker-filters">
              <CampoBusca rotulo="Buscar aluno" value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Digite um nome" />
            </div>
            <div className="participant-picker-list" aria-label="Alunos disponíveis">
              {disponiveis.map((aluno) => {
                const marcado = idsSelecionados.includes(aluno.id)
                return <label className={`participant-picker-row${marcado ? ' is-selected' : ''}`} key={aluno.id}>
                  <input aria-label={`Adicionar ${aluno.nome}`} type="checkbox" checked={marcado} onChange={(event) => setIdsSelecionados((atuais) => event.target.checked ? [...atuais, aluno.id] : atuais.filter((id) => id !== aluno.id))} />
                  <span className="participant-picker-check" aria-hidden="true" />
                  <span className="participant-picker-identity"><strong>{aluno.nome}</strong><small>{nomeTurma(aluno) || 'Sem turma'} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}</small></span>
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
        const aluno = recurso.itens.find((item) => item.id === visualizando)
        if (!aluno) return null
        const idade = calcularIdade(aluno.data_nascimento)
        return (
          <ModalDetalhes titulo={aluno.nome} aoFechar={() => setVisualizando(null)}>
            <dl className="module-details">
              <div><dt>CPF</dt><dd>{aluno.cpf ?? 'Não informado'}</dd></div>
              <div><dt>Celular do aluno</dt><dd>{exibirTelefone(aluno.celular) || 'Não informado'}</dd></div>
              <div><dt>Data de nascimento</dt><dd>{aluno.data_nascimento ? formatarDataParaEntrada(aluno.data_nascimento) : 'Não informada'}</dd></div>
              <div><dt>Idade</dt><dd>{idade === null ? 'Não informada' : `${idade} anos`}</dd></div>
                            <div><dt>Gênero</dt><dd>{aluno.genero ?? 'Não informado'}</dd></div>
                            <div><dt>Faixa</dt><dd>{faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Não informada'}</dd></div>
              <div><dt>Próxima faixa</dt><dd>{aluno.proxima_faixa ?? 'Não definida'}</dd></div>
              <div><dt>Turmas</dt><dd>{nomeTurma(aluno) || 'Sem turma'}</dd></div>
              <div><dt>Peso</dt><dd>{aluno.peso ? `${String(aluno.peso).replace('.', ',')} kg` : 'Não informado'}</dd></div>
              <div><dt>Tamanho do judogi</dt><dd>{aluno.tamanho_kimono ?? 'Não informado'}</dd></div>
              <div><dt>Tamanho da faixa</dt><dd>{aluno.tamanho_faixa ?? 'Não informado'}</dd></div>
              <div><dt>Código Zempo</dt><dd>{aluno.codigo_zempo ?? 'Não informado'}</dd></div>
              <div><dt>Responsável</dt><dd>{aluno.responsavel_nome ?? 'Não informado'}</dd></div>
              <div><dt>CPF do responsável</dt><dd>{aluno.responsavel_cpf ?? 'Não informado'}</dd></div>
              <div><dt>Celular do responsável</dt><dd>{exibirTelefone(aluno.responsavel_celular) || 'Não informado'}</dd></div>
              <div><dt>Parentesco do responsável</dt><dd>{aluno.responsavel_parentesco ?? 'Não informado'}</dd></div>
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
