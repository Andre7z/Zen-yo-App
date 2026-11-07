import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Award, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { EntradaData } from '../components/EntradaData'
import { calcularIdade, converterDataParaIso, dataAtividadeValida, dataAtualIso, formatarDataParaEntrada, validarDataNascimento } from '../servicos/datas'
import { useRecurso } from '../hooks/use-recurso'
import { useNotificacao } from '../notificacoes-context'
import { baixarArquivo } from '../api'
import { atividadesApi, alunosApi, caminhoPlanilhaXlsx, faixasApi, ordenarAlunosPorNome, rotuloFaixa, rotuloTipoAtividade, nomeArquivoPlanilhaXlsx, turmasApi, type Aluno, type Atividade, type Faixa, type Turma } from '../servicos/dominio'
import { opcoesDeTamanho, useTamanhos } from '../hooks/use-tamanhos'

const vazio = { tipo: 'frequencia' as Atividade['tipo'], nome: '', data: formatarDataParaEntrada(dataAtualIso()), local: '', descricao: '', nova_faixa: '' }
type DadosAtividade = typeof vazio
type Rascunho = { proxima_faixa: string; tamanho_faixa: string; tamanho_kimono: string; faixa_grossa: boolean; peso: string; data_nascimento: string; genero: string }

export function AtividadesPage() {
  const recurso = useRecurso(atividadesApi)
  const notificacao = useNotificacao()
  const tamanhos = useTamanhos()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [erroAlunos, setErroAlunos] = useState('')
  const [erroCadastros, setErroCadastros] = useState('')
  const [dados, setDados] = useState<DadosAtividade>(vazio)
  const [selecionandoAlunos, setSelecionandoAlunos] = useState(false)
  const [idsParticipantes, setIdsParticipantes] = useState<number[]>([])
  const [buscaAluno, setBuscaAluno] = useState('')
  const [turmaFiltro, setTurmaFiltro] = useState('')
  const [graduando, setGraduando] = useState<number | null>(null)
  const [erroGraduacao, setErroGraduacao] = useState('')
  const [erroData, setErroData] = useState('')
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({})
  const [marcacoes, setMarcacoes] = useState<Record<number, number[]>>({})
  const [visualizando, setVisualizando] = useState<number | null>(null)
  const [editando, setEditando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [erroPlanilha, setErroPlanilha] = useState('')
  const [buscaAtividade, setBuscaAtividade] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [situacaoFiltro, setSituacaoFiltro] = useState('')

  const hoje = dataAtualIso()
  const termoAtividade = buscaAtividade.trim().toLowerCase()
  const atividadesFiltradas = recurso.itens.filter((item) =>
    (!tipoFiltro || item.tipo === tipoFiltro)
    && (!situacaoFiltro || (situacaoFiltro === 'proximas' ? item.data >= hoje : item.data < hoje))
    && (!termoAtividade || `${item.nome} ${item.local ?? ''}`.toLowerCase().includes(termoAtividade)))

  useEffect(() => {
    void alunosApi.listar().then(setAlunos).catch((falha: unknown) => {
      setErroAlunos(falha instanceof Error ? falha.message : 'Não foi possível carregar os alunos.')
    })
    void turmasApi.listar().then(setTurmas).catch((falha: unknown) => {
      setErroCadastros(falha instanceof Error ? falha.message : 'Não foi possível carregar as turmas.')
    })
    void faixasApi.listar().then(setFaixas).catch((falha: unknown) => {
      setErroCadastros(falha instanceof Error ? falha.message : 'Não foi possível carregar as faixas.')
    })
  }, [])

  function iniciarEdicao(item: Atividade) {
    setDados({
      tipo: item.tipo,
      nome: item.nome,
      data: formatarDataParaEntrada(item.data),
      local: item.local ?? '',
      descricao: item.descricao ?? '',
      nova_faixa: item.nova_faixa ?? '',
    })
    setEditando(item.id)
    setVisualizando(null)
    setSelecionandoAlunos(false)
    setFormAberto(true)
  }

  function rascunhoDe(aluno: Aluno): Rascunho {
    return rascunhos[aluno.id] ?? { proxima_faixa: aluno.proxima_faixa ?? '', tamanho_faixa: aluno.tamanho_faixa ?? '', tamanho_kimono: aluno.tamanho_kimono ?? '', faixa_grossa: aluno.faixa_grossa ?? false, peso: aluno.peso !== null && aluno.peso !== undefined ? String(aluno.peso).replace('.', ',') : '', data_nascimento: aluno.data_nascimento ? formatarDataParaEntrada(aluno.data_nascimento) : '', genero: aluno.genero ?? '' }
  }

  function alterarRascunho(aluno: Aluno, parcial: Partial<Rascunho>) {
    setRascunhos((atuais) => ({ ...atuais, [aluno.id]: { ...rascunhoDe(aluno), ...parcial } }))
  }

  function pagosDe(item: Atividade) {
    return marcacoes[item.id] ?? item.aluno_ids_pagos
  }

  function marcacaoAlterada(item: Atividade) {
    const staged = marcacoes[item.id]
    return !!staged && (staged.length !== item.aluno_ids_pagos.length || staged.some((id) => !item.aluno_ids_pagos.includes(id)))
  }

  function limparMarcacao(itemId: number) {
    setMarcacoes((atuais) => { const { [itemId]: _descartado, ...restantes } = atuais; return restantes })
  }

  async function salvarAlteracoes(item: Atividade, participantes: Aluno[]) {
    const alterados = item.tipo === 'frequencia' ? [] : participantes.filter((aluno) => rascunhos[aluno.id])
    if (!alterados.length && !marcacaoAlterada(item)) return
    const envios: Array<{ aluno: Aluno; dados: Partial<Aluno> }> = []
    for (const aluno of alterados) {
      const rascunho = rascunhoDe(aluno)
      if (item.tipo === 'campeonato') {
        const texto = rascunho.peso.trim().replace(',', '.')
        const peso = texto ? Number(texto) : null
        if (peso !== null && (!Number.isFinite(peso) || peso <= 0 || peso > 500)) {
          setErroGraduacao(`Informe um peso válido para ${aluno.nome}.`)
          return
        }
        const dataNascimento = rascunho.data_nascimento ? converterDataParaIso(rascunho.data_nascimento) : null
        const erroNascimento = rascunho.data_nascimento ? (dataNascimento ? validarDataNascimento(dataNascimento) : 'Informe uma data válida no formato dd/mm/aaaa.') : ''
        if (erroNascimento) {
          setErroGraduacao(`${aluno.nome}: ${erroNascimento}`)
          return
        }
        envios.push({ aluno, dados: { peso, data_nascimento: dataNascimento, genero: (rascunho.genero || null) as Aluno['genero'] } })
      } else if (item.tipo === 'entrega_de_kimono') {
        envios.push({ aluno, dados: { tamanho_kimono: rascunho.tamanho_kimono || null } })
      } else if (item.tipo === 'troca_de_faixa') {
        envios.push({ aluno, dados: { proxima_faixa: rascunho.proxima_faixa || null, tamanho_faixa: rascunho.tamanho_faixa || null, faixa_grossa: rascunho.faixa_grossa } })
      }
    }
    setErroGraduacao('')
    if (marcacaoAlterada(item)) {
      const sucesso = await recurso.executar(() => atividadesApi.atualizar(item.id, { aluno_ids: item.aluno_ids, aluno_ids_pagos: pagosDe(item) }))
      if (!sucesso) return
      limparMarcacao(item.id)
    }
    setGraduando(-1)
    try {
      for (const { aluno, dados } of envios) {
        const atualizado = await alunosApi.atualizar(aluno.id, dados)
        setAlunos((atuais) => atuais.map((outro) => outro.id === atualizado.id ? { ...outro, ...atualizado } : outro))
        setRascunhos((atuais) => { const { [aluno.id]: _descartado, ...restantes } = atuais; return restantes })
      }
      notificacao.sucesso('Dados dos alunos salvos com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível salvar os dados dos alunos.'
      setErroGraduacao(mensagem)
      notificacao.erro(mensagem)
    } finally {
      setGraduando(null)
    }
  }

  function alternarMarcacao(item: Atividade, alunoId: number, marcado: boolean) {
    const atuais = pagosDe(item).filter((id) => id !== alunoId)
    setMarcacoes((anteriores) => ({ ...anteriores, [item.id]: marcado ? [...atuais, alunoId] : atuais }))
  }

  async function salvarParticipantes(item: Atividade) {
    const sucesso = await recurso.executar(() => atividadesApi.atualizar(item.id, {
      aluno_ids: idsParticipantes,
      aluno_ids_pagos: pagosDe(item).filter((id) => idsParticipantes.includes(id)),
    }))
    if (sucesso) {
      limparMarcacao(item.id)
      setSelecionandoAlunos(false)
    }
  }

  async function graduarSelecionados(item: Atividade, participantes: Aluno[]) {
    const selecionados = participantes.filter((aluno) => pagosDe(item).includes(aluno.id))
    if (!selecionados.length) {
      setErroGraduacao('Selecione ao menos um aluno para graduar.')
      return
    }
    const sem = selecionados.filter((aluno) => !faixas.some((faixa) => rotuloFaixa(faixa) === rascunhoDe(aluno).proxima_faixa))
    if (sem.length) {
      setErroGraduacao(`Defina a próxima faixa de ${sem.map((aluno) => aluno.nome).join(', ')} antes de graduar.`)
      return
    }
    if (!window.confirm(`Graduar ${selecionados.length} ${selecionados.length === 1 ? 'aluno selecionado' : 'alunos selecionados'}?`)) return
    setErroGraduacao('')
    setGraduando(-1)
    try {
      for (const aluno of selecionados) {
        const rascunho = rascunhoDe(aluno)
        const faixa = faixas.find((f) => rotuloFaixa(f) === rascunho.proxima_faixa)
        if (!faixa) continue
        const atualizado = await alunosApi.atualizar(aluno.id, { faixa_id: faixa.id, proxima_faixa: null, tamanho_faixa: rascunho.tamanho_faixa || null, faixa_grossa: rascunho.faixa_grossa })
        setAlunos((atuais) => atuais.map((outro) => outro.id === atualizado.id ? { ...outro, ...atualizado } : outro))
        setRascunhos((atuais) => { const { [aluno.id]: _descartado, ...restantes } = atuais; return restantes })
      }
      notificacao.sucesso(selecionados.length === 1 ? 'Aluno graduado com sucesso.' : 'Alunos graduados com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível graduar os alunos.'
      setErroGraduacao(mensagem)
      notificacao.erro(mensagem)
    } finally {
      setGraduando(null)
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dataIso = converterDataParaIso(dados.data)
    if (!dataIso) {
      setErroData('Informe uma data válida no formato dd/mm/aaaa.')
      return
    }
    if (!dataAtividadeValida(dataIso)) {
      setErroData('A data da atividade deve estar entre 2000 e 2150.')
      return
    }
    setErroData('')
    const payload = {
      ...dados,
      data: dataIso,
      nome: dados.nome.trim(),
      local: dados.local.trim() || null,
      descricao: dados.descricao.trim() || null,
      nova_faixa: dados.tipo === 'troca_de_faixa' ? dados.nova_faixa.trim() || null : null,
    }
    const sucesso = await recurso.executar(() => editando
      ? atividadesApi.atualizar(editando, payload)
      : atividadesApi.criar(payload))
    if (sucesso) {
      setDados(vazio)
      setEditando(null)
      setFormAberto(false)
    }
  }

  async function apagar(item: Atividade) {
    if (window.confirm(`Excluir a atividade ${item.nome}?`)) await recurso.executar(() => atividadesApi.apagar(item.id), 'Atividade excluída com sucesso.')
  }

  async function exportarPlanilha(item: Atividade) {
    setErroPlanilha('')
    const caminho = caminhoPlanilhaXlsx(item.tipo, item.id)
    if (!caminho) { setErroPlanilha('Não existe planilha para este tipo de atividade.'); return }
    try {
      const url = URL.createObjectURL(await baixarArquivo(caminho))
      const link = document.createElement('a')
      link.href = url
      link.download = nomeArquivoPlanilhaXlsx(item.nome)
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notificacao.sucesso('Planilha gerada com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível exportar a planilha.'
      setErroPlanilha(mensagem)
      notificacao.erro(mensagem)
    }
  }

  return (
    <PaginaModulo kicker="ROTINA" titulo="Atividades" descricao="Registre frequência, entrega de judogis e graduações." carregando={recurso.carregando} erro={recurso.erro || erroAlunos} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} {recurso.itens.length === 1 ? 'atividade' : 'atividades'}</p><button className="module-primary" type="button" onClick={() => { setDados(vazio); setEditando(null); setVisualizando(null); setSelecionandoAlunos(false); setFormAberto(true) }}><Plus size={16} />Nova atividade</button></div>

      <div className="module-filters" aria-label="Filtros de atividades">
        <CampoModulo rotulo="Buscar atividade"><input value={buscaAtividade} onChange={(event) => setBuscaAtividade(event.target.value)} placeholder="Nome ou local" /></CampoModulo>
        <CampoModulo rotulo="Tipo de atividade"><select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)}><option value="">Todos</option><option value="frequencia">Frequência</option><option value="entrega_de_kimono">Entrega de judogi</option><option value="troca_de_faixa">Troca de faixa</option><option value="campeonato">Campeonato</option></select></CampoModulo>
        <CampoModulo rotulo="Situação"><select value={situacaoFiltro} onChange={(event) => setSituacaoFiltro(event.target.value)}><option value="">Todas</option><option value="proximas">Próximas</option><option value="realizadas">Realizadas</option></select></CampoModulo>
      </div>

      {formAberto && (
        <ModalDetalhes contexto="CADASTRO" titulo={editando ? 'Editar atividade' : 'Nova atividade'} aoFechar={() => setFormAberto(false)}>
        <form className="module-form" onSubmit={salvar}>
          <div className="module-form-grid">
            <CampoModulo rotulo="Tipo"><select value={dados.tipo} onChange={(event) => setDados({ ...dados, tipo: event.target.value as Atividade['tipo'] })}><option value="frequencia">Frequência</option><option value="entrega_de_kimono">Entrega de judogi</option><option value="troca_de_faixa">Troca de faixa</option><option value="campeonato">Campeonato</option></select></CampoModulo>
            <CampoModulo rotulo="Nome"><input required maxLength={120} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Data"><EntradaData required invalid={Boolean(erroData)} value={dados.data} onChange={(data) => { setErroData(''); setDados({ ...dados, data }) }} />{erroData && <small className="module-field-error" role="alert">{erroData}</small>}</CampoModulo>
            <CampoModulo rotulo="Local"><input value={dados.local} onChange={(event) => setDados({ ...dados, local: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Descrição"><textarea rows={3} value={dados.descricao} onChange={(event) => setDados({ ...dados, descricao: event.target.value })} /></CampoModulo>
          </div>
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar atividade'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
        </ModalDetalhes>
      )}

      {erroPlanilha && <p className="module-error" role="alert">{erroPlanilha}</p>}

      {visualizando !== null && (() => {
        const item = recurso.itens.find((atividade) => atividade.id === visualizando)
        if (!item) return null
        const participantes = ordenarAlunosPorNome(alunos.filter((aluno) => item.aluno_ids.includes(aluno.id)))
        const alunosDisponiveis = ordenarAlunosPorNome(alunos.filter((aluno) => {
          const nome = aluno.nome.toLocaleLowerCase('pt-BR')
          const turma = turmas
            .filter((itemTurma) => aluno.turma_ids.includes(itemTurma.id))
            .map((itemTurma) => itemTurma.nome)
            .join(', ')
            .toLocaleLowerCase('pt-BR')
          const correspondeBusca = `${nome} ${turma}`.includes(buscaAluno.trim().toLocaleLowerCase('pt-BR'))
          const correspondeTurma = !turmaFiltro || aluno.turma_ids.includes(Number(turmaFiltro))
          return correspondeBusca && correspondeTurma
        }))
        return (
          <ModalDetalhes titulo={selecionandoAlunos ? `Alunos · ${item.nome}` : item.nome} aoFechar={() => { setVisualizando(null); setSelecionandoAlunos(false) }}>
            {selecionandoAlunos ? <>
              <div className="participant-picker-toolbar">
                <button className="module-secondary" type="button" onClick={() => setSelecionandoAlunos(false)}><ArrowLeft size={16} />Voltar à atividade</button>
                <p>{idsParticipantes.length} {idsParticipantes.length === 1 ? 'selecionado' : 'selecionados'}</p>
              </div>
              <div className="participant-picker-filters">
                <CampoModulo rotulo="Buscar aluno"><input type="search" value={buscaAluno} onChange={(event) => setBuscaAluno(event.target.value)} placeholder="Digite um nome ou turma" /></CampoModulo>
                <CampoModulo rotulo="Filtrar por turma"><select value={turmaFiltro} onChange={(event) => setTurmaFiltro(event.target.value)}><option value="">Todas as turmas</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></CampoModulo>
              </div>
              {erroCadastros && <p className="module-error" role="alert">{erroCadastros}</p>}
              <div className="participant-picker-list" aria-label="Lista de alunos disponíveis">
                {alunosDisponiveis.map((aluno) => {
                  const selecionado = idsParticipantes.includes(aluno.id)
                  const turmasAluno = turmas
                    .filter((itemTurma) => aluno.turma_ids.includes(itemTurma.id))
                    .map((itemTurma) => itemTurma.nome)
                    .join(', ')
                  return <label className={`participant-picker-row${selecionado ? ' is-selected' : ''}`} key={aluno.id}>
                    <input aria-label={`Adicionar ${aluno.nome}`} type="checkbox" checked={selecionado} onChange={(event) => setIdsParticipantes((atuais) => event.target.checked ? [...atuais, aluno.id] : atuais.filter((id) => id !== aluno.id))} />
                    <span className="participant-picker-check" aria-hidden="true" />
                    <span className="participant-picker-identity"><strong>{aluno.nome}</strong><small>{turmasAluno || 'Sem turma'} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}</small></span>
                  </label>
                })}
                {!alunosDisponiveis.length && <p className="module-empty">Nenhum aluno encontrado com esses filtros.</p>}
              </div>
              <div className="module-form-actions participant-picker-actions">
                <button className="module-primary" type="button" disabled={recurso.salvando || erroAlunos !== ''} onClick={() => void salvarParticipantes(item)}>{recurso.salvando ? 'Salvando...' : `Salvar participantes (${idsParticipantes.length})`}</button>
              </div>
            </> : <>
            <dl className="module-details activity-info-details">
              <div><dt>Tipo</dt><dd>{rotuloTipoAtividade(item.tipo)}</dd></div>
              <div><dt>Data</dt><dd>{formatarDataParaEntrada(item.data)}</dd></div>
              <div><dt>Local</dt><dd>{item.local ?? 'Não informado'}</dd></div>
              <div><dt>Descrição</dt><dd>{item.descricao ?? 'Sem descrição'}</dd></div>
            </dl>
            <fieldset className="module-checks activity-students"><legend>Alunos participantes ({participantes.length})</legend>
              <button className="module-primary participant-picker-open" type="button" onClick={() => { setIdsParticipantes(item.aluno_ids); setBuscaAluno(''); setTurmaFiltro(''); setSelecionandoAlunos(true) }}><Plus size={16} />{participantes.length ? 'Gerenciar alunos' : 'Adicionar alunos'}</button>
              <div className="activity-participant-list">
                {participantes.map((aluno) => {
                  const rascunho = rascunhoDe(aluno)
                  return <div className="activity-participant-row" key={aluno.id}>
                    <span className="activity-participant-name"><span>{aluno.nome} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}</span></span>
                    <label className="activity-payment"><input aria-label={item.tipo === 'frequencia' ? `Presença de ${aluno.nome}` : `Confirmação de ${aluno.nome}`} title={item.tipo === 'frequencia' ? 'Presença do aluno' : 'Confirmação do aluno'} type="checkbox" checked={pagosDe(item).includes(aluno.id)} onChange={(event) => alternarMarcacao(item, aluno.id, event.target.checked)} />                    {item.tipo === 'frequencia' ? 'Presente' : 'Confirmado'}</label>
                    {item.tipo === 'entrega_de_kimono' && <div className="activity-participant-fields">
                                          <CampoModulo rotulo="Tamanho do judogi"><select aria-label={`Tamanho do judogi de ${aluno.nome}`} value={rascunho.tamanho_kimono} onChange={(event) => alterarRascunho(aluno, { tamanho_kimono: event.target.value })}><option value="">Não definido</option>{opcoesDeTamanho(tamanhos.kimono, rascunho.tamanho_kimono).map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
                    </div>}
                                        {item.tipo === 'campeonato' && <div className="activity-participant-fields activity-participant-fields-grid">
                                          <CampoModulo rotulo="Data de nascimento"><EntradaData ariaLabel={`Data de nascimento de ${aluno.nome}`} value={rascunho.data_nascimento} onChange={(data_nascimento) => alterarRascunho(aluno, { data_nascimento })} /></CampoModulo>
                                          <div className="activity-participant-age"><span>Idade</span><strong aria-label={`Idade de ${aluno.nome}`}>{calcularIdade(converterDataParaIso(rascunho.data_nascimento)) ?? 'Não informada'}</strong></div>
                                          <CampoModulo rotulo="Gênero"><select aria-label={`Gênero de ${aluno.nome}`} value={rascunho.genero} onChange={(event) => alterarRascunho(aluno, { genero: event.target.value })}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></CampoModulo>
                                          <CampoModulo rotulo="Peso (kg)"><input aria-label={`Peso de ${aluno.nome}`} inputMode="decimal" value={rascunho.peso} onChange={(event) => alterarRascunho(aluno, { peso: event.target.value })} /></CampoModulo>
                                        </div>}
                                        {item.tipo === 'troca_de_faixa' && <div className="activity-participant-fields">
                                          <CampoModulo rotulo="Próxima faixa"><select aria-label={`Próxima faixa de ${aluno.nome}`} value={rascunho.proxima_faixa} onChange={(event) => alterarRascunho(aluno, { proxima_faixa: event.target.value })}><option value="">Não definida</option>{faixas.map((faixa) => <option key={faixa.id} value={rotuloFaixa(faixa)}>{rotuloFaixa(faixa)}</option>)}</select></CampoModulo>
                                          <CampoModulo rotulo="Tamanho da faixa"><select aria-label={`Tamanho da faixa de ${aluno.nome}`} value={rascunho.tamanho_faixa} onChange={(event) => alterarRascunho(aluno, { tamanho_faixa: event.target.value })}><option value="">Não definido</option>{opcoesDeTamanho(tamanhos.faixa, rascunho.tamanho_faixa).map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}</option>)}</select></CampoModulo>
                                          <label className="activity-payment"><input aria-label={`Faixa grossa de ${aluno.nome}`} type="checkbox" checked={rascunho.faixa_grossa} onChange={(event) => alterarRascunho(aluno, { faixa_grossa: event.target.checked })} />                                          Grossa</label>                                        </div>}
                                      </div>
                                    })}
                                    {!participantes.length && <small>Nenhum aluno associado à atividade.</small>}
                                  </div>
                                  {(participantes.length > 0 || item.tipo === 'troca_de_faixa') && <div className="activity-participant-actions">
                                                                      {participantes.length > 0 && <button className="module-primary" type="button" disabled={graduando !== null || recurso.salvando || !(marcacaoAlterada(item) || (item.tipo !== 'frequencia' && participantes.some((aluno) => rascunhos[aluno.id])))} onClick={() => void salvarAlteracoes(item, participantes)}>Salvar alterações dos alunos</button>}
                                    {item.tipo === 'troca_de_faixa' && <button className="module-primary" type="button" disabled={graduando !== null || !pagosDe(item).some((id) => item.aluno_ids.includes(id))} onClick={() => void graduarSelecionados(item, participantes)}><Award size={15} />Graduar selecionados ({participantes.filter((aluno) => pagosDe(item).includes(aluno.id)).length})</button>}
                                  </div>}
              {erroGraduacao && <small role="alert">{erroGraduacao}</small>}
            </fieldset>
            </>}
          </ModalDetalhes>
        )
      })()}

      <div className="module-list" aria-label="Lista de atividades">
        {atividadesFiltradas.map((item) => (
          <article className="module-record" key={item.id}><button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${item.nome}`} onClick={() => { setFormAberto(false); setEditando(null); setErroGraduacao(''); setVisualizando(item.id) }}><strong>{item.nome}</strong><span>{formatarDataParaEntrada(item.data)} · {rotuloTipoAtividade(item.tipo)} · {item.aluno_ids.length} alunos · {item.aluno_ids_pagos?.length ?? 0} {item.tipo === 'frequencia' ? 'presentes' : 'confirmados'}{item.local ? ` · ${item.local}` : ''}</span></button><div className="record-actions"><BotaoIcone label={`Planilha de ${item.nome}`} onClick={() => void exportarPlanilha(item)}><FileText size={16} /></BotaoIcone><BotaoIcone label={`Editar ${item.nome}`} onClick={() => iniciarEdicao(item)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${item.nome}`} onClick={() => void apagar(item)}><Trash2 size={16} /></BotaoIcone></div></article>
        ))}
        {!atividadesFiltradas.length && <p className="module-empty">{recurso.itens.length ? 'Nenhuma atividade encontrada com esses filtros.' : 'Nenhuma atividade cadastrada.'}</p>}
      </div>
    </PaginaModulo>
  )
}
