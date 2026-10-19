import { useEffect, useState, type FormEvent } from 'react'
import { Award, FileText, Pencil, Plus, Trash2, X } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import { atividadesApi, alunosApi, faixasApi, relatorioAtividade, turmasApi, type Aluno, type Atividade, type Faixa, type Turma } from '../servicos/dominio'

const hoje = new Date().toISOString().slice(0, 10)
const vazio = { tipo: 'frequencia' as Atividade['tipo'], nome: '', data: hoje, local: '', descricao: '', aluno_ids: [] as number[], aluno_ids_pagos: [] as number[], nova_faixa: '', presenca: true }
type DadosAtividade = typeof vazio

export function AtividadesPage() {
  const recurso = useRecurso(atividadesApi)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [erroAlunos, setErroAlunos] = useState('')
  const [erroCadastros, setErroCadastros] = useState('')
  const [dados, setDados] = useState<DadosAtividade>(vazio)
  const [mostrarAlunos, setMostrarAlunos] = useState(false)
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [graduando, setGraduando] = useState<number | null>(null)
  const [erroGraduacao, setErroGraduacao] = useState('')
  const [rascunhos, setRascunhos] = useState<Record<number, { proxima_faixa: string; tamanho_faixa: string; tamanho_kimono: string }>>({})
  const [visualizando, setVisualizando] = useState<number | null>(null)
  const [editando, setEditando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [relatorio, setRelatorio] = useState<{ titulo: string; linhas: Array<Record<string, string | boolean | null>> } | null>(null)
  const [erroRelatorio, setErroRelatorio] = useState('')

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

  const turmaAtual = turmas.find((turma) => turma.id === Number(turmaSelecionada))
  const alunosDaTurma = turmaAtual
    ? alunos.filter((aluno) => aluno.turma_id === turmaAtual.id || (aluno.turma_id === null && aluno.turma?.trim().toLocaleLowerCase('pt-BR') === turmaAtual.nome.trim().toLocaleLowerCase('pt-BR')))
    : []

  function iniciarEdicao(item: Atividade) {
    const primeiroAluno = alunos.find((aluno) => item.aluno_ids.includes(aluno.id))
    const turmaDoAluno = primeiroAluno?.turma_id ?? turmas.find((turma) => turma.nome.trim().toLocaleLowerCase('pt-BR') === primeiroAluno?.turma?.trim().toLocaleLowerCase('pt-BR'))?.id
    setDados({
      tipo: item.tipo,
      nome: item.nome,
      data: item.data,
      local: item.local ?? '',
      descricao: item.descricao ?? '',
      aluno_ids: item.aluno_ids,
      aluno_ids_pagos: item.aluno_ids_pagos ?? [],
      nova_faixa: item.nova_faixa ?? '',
      presenca: item.presenca ?? true,
    })
    setTurmaSelecionada(turmaDoAluno ? String(turmaDoAluno) : '')
    setEditando(item.id)
    setVisualizando(null)
    setMostrarAlunos(false)
    setFormAberto(true)
  }

  function rascunhoDe(aluno: Aluno) {
    return rascunhos[aluno.id] ?? { proxima_faixa: aluno.proxima_faixa ?? '', tamanho_faixa: aluno.tamanho_faixa ?? '', tamanho_kimono: aluno.tamanho_kimono ?? '' }
  }

  function alterarRascunho(aluno: Aluno, parcial: Partial<{ proxima_faixa: string; tamanho_faixa: string; tamanho_kimono: string }>) {
    setRascunhos((atuais) => ({ ...atuais, [aluno.id]: { ...rascunhoDe(aluno), ...parcial } }))
  }

  async function salvarFaixaAluno(aluno: Aluno) {
    const rascunho = rascunhoDe(aluno)
    setErroGraduacao('')
    setGraduando(aluno.id)
    try {
      const atualizado = await alunosApi.atualizar(aluno.id, { proxima_faixa: rascunho.proxima_faixa || null, tamanho_faixa: rascunho.tamanho_faixa.trim() || null })
      setAlunos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item))
      setRascunhos((atuais) => { const { [aluno.id]: _descartado, ...restantes } = atuais; return restantes })
    } catch (falha) {
      setErroGraduacao(falha instanceof Error ? falha.message : 'Não foi possível salvar os dados da faixa.')
    } finally {
      setGraduando(null)
    }
  }

  async function salvarKimono(aluno: Aluno) {
    setErroGraduacao('')
    setGraduando(aluno.id)
    try {
      const atualizado = await alunosApi.atualizar(aluno.id, { tamanho_kimono: rascunhoDe(aluno).tamanho_kimono.trim() || null })
      setAlunos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item))
      setRascunhos((atuais) => { const { [aluno.id]: _descartado, ...restantes } = atuais; return restantes })
    } catch (falha) {
      setErroGraduacao(falha instanceof Error ? falha.message : 'Não foi possível salvar o tamanho do kimono.')
    } finally {
      setGraduando(null)
    }
  }

  async function alternarMarcacao(item: Atividade, alunoId: number, marcado: boolean) {
    const pagos = marcado ? [...item.aluno_ids_pagos, alunoId] : item.aluno_ids_pagos.filter((id) => id !== alunoId)
    await recurso.executar(() => atividadesApi.atualizar(item.id, { aluno_ids: item.aluno_ids, aluno_ids_pagos: pagos }))
  }

  async function graduar(aluno: Aluno) {
    const rascunho = rascunhoDe(aluno)
    const faixa = faixas.find((item) => item.nome === rascunho.proxima_faixa)
    if (!faixa) {
      setErroGraduacao(`Defina a próxima faixa de ${aluno.nome} antes de graduar.`)
      return
    }
    if (!window.confirm(`Graduar ${aluno.nome} para a faixa ${faixa.nome}?`)) return
    setErroGraduacao('')
    setGraduando(aluno.id)
    try {
      const atualizado = await alunosApi.atualizar(aluno.id, { faixa_id: faixa.id, proxima_faixa: null, tamanho_faixa: rascunho.tamanho_faixa.trim() || null })
      setAlunos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item))
      setRascunhos((atuais) => { const { [aluno.id]: _descartado, ...restantes } = atuais; return restantes })
    } catch (falha) {
      setErroGraduacao(falha instanceof Error ? falha.message : 'Não foi possível graduar o aluno.')
    } finally {
      setGraduando(null)
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { aluno_ids, aluno_ids_pagos, ...dadosGerais } = dados
    const payload = {
      ...(editando ? dadosGerais : { ...dadosGerais, aluno_ids, aluno_ids_pagos }),
      nome: dados.nome.trim(),
      local: dados.local.trim() || null,
      descricao: dados.descricao.trim() || null,
      nova_faixa: dados.tipo === 'troca_de_faixa' ? dados.nova_faixa.trim() || null : null,
      presenca: dados.tipo === 'frequencia' ? dados.presenca : null,
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
    if (window.confirm(`Excluir a atividade ${item.nome}?`)) await recurso.executar(() => atividadesApi.apagar(item.id))
  }

  async function verRelatorio(item: Atividade) {
    setErroRelatorio('')
    try {
      setRelatorio({ titulo: item.nome, linhas: await relatorioAtividade(item.id) })
    } catch (falha) {
      setErroRelatorio(falha instanceof Error ? falha.message : 'Não foi possível gerar o relatório.')
    }
  }

  return (
    <PaginaModulo kicker="ROTINA" titulo="Atividades" descricao="Registre frequência, entrega de kimonos e graduações." carregando={recurso.carregando} erro={recurso.erro || erroAlunos} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} {recurso.itens.length === 1 ? 'atividade' : 'atividades'}</p><button className="module-primary" type="button" onClick={() => { setDados(vazio); setTurmaSelecionada(''); setEditando(null); setVisualizando(null); setMostrarAlunos(false); setFormAberto((aberto) => !aberto) }}>{formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar formulário' : 'Nova atividade'}</button></div>

      {formAberto && (
        <form className="module-form" onSubmit={salvar}>
          <div className="module-form-heading"><h2>{editando ? 'Editar atividade' : 'Nova atividade'}</h2></div>
          <div className="module-form-grid">
            <CampoModulo rotulo="Tipo"><select value={dados.tipo} onChange={(event) => setDados({ ...dados, tipo: event.target.value as Atividade['tipo'] })}><option value="frequencia">Frequência</option><option value="entrega_de_kimono">Entrega de kimono</option><option value="troca_de_faixa">Troca de faixa</option></select></CampoModulo>
            <CampoModulo rotulo="Nome"><input required maxLength={120} value={dados.nome} onChange={(event) => setDados({ ...dados, nome: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Data"><input required type="date" value={dados.data} onChange={(event) => setDados({ ...dados, data: event.target.value })} /></CampoModulo>
            <CampoModulo rotulo="Local"><input value={dados.local} onChange={(event) => setDados({ ...dados, local: event.target.value })} /></CampoModulo>
            {dados.tipo === 'frequencia' && <CampoModulo rotulo="Presença"><select value={String(dados.presenca)} onChange={(event) => setDados({ ...dados, presenca: event.target.value === 'true' })}><option value="true">Presente</option><option value="false">Ausente</option></select></CampoModulo>}
            <CampoModulo rotulo="Descrição"><textarea rows={3} value={dados.descricao} onChange={(event) => setDados({ ...dados, descricao: event.target.value })} /></CampoModulo>
          </div>
          {!editando && <fieldset className="module-checks"><legend>Alunos participantes</legend><CampoModulo rotulo="Turma"><select value={turmaSelecionada} onChange={(event) => {
            const selecionada = event.target.value
            const turma = turmas.find((item) => item.id === Number(selecionada))
            const idsDaTurma = new Set(alunos.filter((aluno) => turma && (aluno.turma_id === turma.id || (aluno.turma_id === null && aluno.turma?.trim().toLocaleLowerCase('pt-BR') === turma.nome.trim().toLocaleLowerCase('pt-BR')))).map((aluno) => aluno.id))
            setDados((atual) => ({ ...atual, aluno_ids: atual.aluno_ids.filter((id) => idsDaTurma.has(id)), aluno_ids_pagos: atual.aluno_ids_pagos.filter((id) => idsDaTurma.has(id)) }))
            setTurmaSelecionada(selecionada)
          }}><option value="">Selecione uma turma</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome}</option>)}</select></CampoModulo><button className="module-secondary" type="button" aria-expanded={mostrarAlunos} disabled={!turmaSelecionada} onClick={() => setMostrarAlunos((visiveis) => !visiveis)}>{mostrarAlunos ? 'Ocultar alunos' : 'Adicionar aluno'}</button>{erroCadastros && <small role="alert">{erroCadastros}</small>}{mostrarAlunos && turmaSelecionada && <div className="activity-participant-list">{alunosDaTurma.map((aluno) => {
            const adicionado = dados.aluno_ids.includes(aluno.id)
            const pago = dados.aluno_ids_pagos.includes(aluno.id)
            return <div className="activity-participant-row" key={aluno.id}>
              <label className="activity-participant-name"><input aria-label={`Adicionar ${aluno.nome}`} type="checkbox" checked={adicionado} onChange={(event) => setDados({
                ...dados,
                aluno_ids: event.target.checked ? [...dados.aluno_ids, aluno.id] : dados.aluno_ids.filter((id) => id !== aluno.id),
                aluno_ids_pagos: event.target.checked ? dados.aluno_ids_pagos : dados.aluno_ids_pagos.filter((id) => id !== aluno.id),
              })} /><span>{aluno.nome}</span></label>
              {adicionado ? <label className="activity-payment"><input aria-label={`Pagamento confirmado de ${aluno.nome}`} title="Pagamento confirmado" type="checkbox" checked={pago} onChange={(event) => setDados({ ...dados, aluno_ids_pagos: event.target.checked ? [...dados.aluno_ids_pagos, aluno.id] : dados.aluno_ids_pagos.filter((id) => id !== aluno.id) })} /></label>               : <span className="activity-not-added">Não adicionado</span>}
                         </div>
                       })}{!alunosDaTurma.length && <small>Nenhum aluno cadastrado nesta turma.</small>}</div>}</fieldset>}
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar atividade'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
      )}

      {erroRelatorio && <p className="module-error" role="alert">{erroRelatorio}</p>}
      {relatorio && <section className="module-form" aria-label="Relatório da atividade"><div className="module-form-heading"><h2>Relatório · {relatorio.titulo}</h2><button className="module-secondary" type="button" onClick={() => setRelatorio(null)}>Fechar</button></div>{relatorio.linhas.length ? relatorio.linhas.map((linha, indice) => <pre className="module-report" key={indice}>{Object.entries(linha).map(([chave, valor]) => `${chave}: ${String(valor ?? '—')}`).join('\n')}</pre>) : <p>Nenhum aluno foi associado à atividade.</p>}</section>}

      {visualizando !== null && (() => {
        const item = recurso.itens.find((atividade) => atividade.id === visualizando)
        if (!item) return null
        const participantes = alunos.filter((aluno) => item.aluno_ids.includes(aluno.id))
        return (
          <section className="module-form" aria-label="Detalhes da atividade">
            <div className="module-form-heading"><h2>{item.nome}</h2></div>
            <dl className="module-details">
              <div><dt>Tipo</dt><dd>{item.tipo.replaceAll('_', ' ')}</dd></div>
              <div><dt>Data</dt><dd>{item.data}</dd></div>
              <div><dt>Local</dt><dd>{item.local ?? 'Não informado'}</dd></div>
              {item.tipo === 'frequencia' && <div><dt>Presença</dt><dd>{item.presenca ? 'Presente' : 'Ausente'}</dd></div>}
              <div><dt>Descrição</dt><dd>{item.descricao ?? 'Sem descrição'}</dd></div>
            </dl>
            <fieldset className="module-checks"><legend>Alunos participantes ({participantes.length})</legend>
              <div className="activity-participant-list">
                {participantes.map((aluno) => {
                  const rascunho = rascunhoDe(aluno)
                  return <div className="activity-participant-row" key={aluno.id}>
                    <span className="activity-participant-name"><span>{aluno.nome} · {faixas.find((faixa) => faixa.id === aluno.faixa_id)?.nome ?? 'Faixa não informada'}</span></span>
                    <label className="activity-payment"><input aria-label={`Marcar ${aluno.nome}`} title="Marcação do professor (pagamento ou presença)" type="checkbox" disabled={recurso.salvando} checked={item.aluno_ids_pagos.includes(aluno.id)} onChange={(event) => void alternarMarcacao(item, aluno.id, event.target.checked)} />Marcado</label>
                    {item.tipo === 'entrega_de_kimono' && <div className="activity-participant-fields">
                      <CampoModulo rotulo="Tamanho do kimono"><input aria-label={`Tamanho do kimono de ${aluno.nome}`} value={rascunho.tamanho_kimono} onChange={(event) => alterarRascunho(aluno, { tamanho_kimono: event.target.value })} /></CampoModulo>
                      <button className="module-secondary" type="button" aria-label={`Salvar kimono de ${aluno.nome}`} disabled={graduando === aluno.id} onClick={() => void salvarKimono(aluno)}>Salvar</button>
                    </div>}
                    {item.tipo === 'troca_de_faixa' && <div className="activity-participant-fields">
                      <CampoModulo rotulo="Próxima faixa"><select aria-label={`Próxima faixa de ${aluno.nome}`} value={rascunho.proxima_faixa} onChange={(event) => alterarRascunho(aluno, { proxima_faixa: event.target.value })}><option value="">Não definida</option>{faixas.map((faixa) => <option key={faixa.id} value={faixa.nome}>{faixa.nome}</option>)}</select></CampoModulo>
                      <CampoModulo rotulo="Tamanho da faixa"><input aria-label={`Tamanho da faixa de ${aluno.nome}`} value={rascunho.tamanho_faixa} onChange={(event) => alterarRascunho(aluno, { tamanho_faixa: event.target.value })} /></CampoModulo>
                      <button className="module-secondary" type="button" aria-label={`Salvar faixa de ${aluno.nome}`} disabled={graduando === aluno.id} onClick={() => void salvarFaixaAluno(aluno)}>Salvar</button>
                      <button className="module-secondary" type="button" aria-label={`Graduar ${aluno.nome}`} disabled={!rascunho.proxima_faixa || graduando === aluno.id} onClick={() => void graduar(aluno)}><Award size={15} />Graduar</button>
                                          </div>}
                  </div>
                })}
                {!participantes.length && <small>Nenhum aluno associado à atividade.</small>}
              </div>
              {erroGraduacao && <small role="alert">{erroGraduacao}</small>}
            </fieldset>
            <div className="module-form-actions"><button className="module-primary" type="button" onClick={() => iniciarEdicao(item)}><Pencil size={16} />Editar</button><button className="module-secondary" type="button" onClick={() => setVisualizando(null)}>Fechar</button></div>
          </section>
        )
      })()}

      <div className="module-list" aria-label="Lista de atividades">
        {recurso.itens.map((item) => (
          <article className="module-record" key={item.id}><button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${item.nome}`} onClick={() => { setFormAberto(false); setEditando(null); setErroGraduacao(''); setVisualizando(item.id) }}><strong>{item.nome}</strong><span>{item.data} · {item.tipo.replaceAll('_', ' ')} · {item.aluno_ids.length} alunos · {item.aluno_ids_pagos?.length ?? 0} pagos{item.local ? ` · ${item.local}` : ''}</span></button><div className="record-actions"><BotaoIcone label={`Relatório de ${item.nome}`} onClick={() => void verRelatorio(item)}><FileText size={16} /></BotaoIcone><BotaoIcone label={`Editar ${item.nome}`} onClick={() => iniciarEdicao(item)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${item.nome}`} onClick={() => void apagar(item)}><Trash2 size={16} /></BotaoIcone></div></article>
        ))}
        {!recurso.itens.length && <p className="module-empty">Nenhuma atividade cadastrada.</p>}
      </div>
    </PaginaModulo>
  )
}
