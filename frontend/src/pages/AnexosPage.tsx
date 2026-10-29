import { useState, type FormEvent } from 'react'
import { Download, ExternalLink, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { useRecurso } from '../hooks/use-recurso'
import { anexosApi, type Anexo } from '../servicos/dominio'
import { baixarArquivo } from '../api'

const vazio = { titulo: '', categoria: 'Calendarios' as Anexo['categoria'], descricao: '', nome_arquivo: '', arquivo_url: '', link: '' }
type DadosAnexo = typeof vazio

export function AnexosPage() {
  const recurso = useRecurso(anexosApi)
  const [dados, setDados] = useState<DadosAnexo>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [visualizando, setVisualizando] = useState<Anexo | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [previa, setPrevia] = useState<{ anexo: Anexo; url: string; tipo: string } | null>(null)
  const anexosFiltrados = categoriaFiltro ? recurso.itens.filter((anexo) => anexo.categoria === categoriaFiltro) : recurso.itens

  function iniciarEdicao(anexo: Anexo) {
    setDados({ titulo: anexo.titulo, categoria: anexo.categoria, descricao: anexo.descricao ?? '', nome_arquivo: anexo.nome_arquivo ?? '', arquivo_url: anexo.arquivo_url ?? '', link: anexo.link ?? '' })
    setArquivo(null)
    setErroArquivo('')
    setEditando(anexo.id)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      titulo: dados.titulo.trim(),
      categoria: dados.categoria,
      descricao: dados.descricao.trim() || null,
      nome_arquivo: dados.nome_arquivo.trim() || null,
      arquivo_url: dados.arquivo_url.trim() || null,
      link: dados.link.trim() || null,
    }
    const sucesso = await recurso.executar(() => arquivo
      ? editando
        ? anexosApi.substituirArquivo(editando, payload, arquivo)
        : anexosApi.enviarArquivo(payload, arquivo)
      : editando
        ? anexosApi.atualizar(editando, payload)
        : anexosApi.criar(payload))
    if (sucesso) {
      setDados(vazio)
      setArquivo(null)
      setEditando(null)
      setFormAberto(false)
    }
  }

  async function baixar(anexo: Anexo) {
    if (!anexo.arquivo_url) return
    setErroArquivo('')
    try {
      const url = URL.createObjectURL(await baixarArquivo(anexo.arquivo_url))
      const link = document.createElement('a')
      link.href = url
      link.download = anexo.nome_arquivo || anexo.titulo
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (falha) {
      setErroArquivo(falha instanceof Error ? falha.message : 'Não foi possível baixar o arquivo.')
    }
  }

  function fecharPrevia() {
    setPrevia((atual) => {
      if (atual) URL.revokeObjectURL(atual.url)
      return null
    })
  }

  function abrir(anexo: Anexo) {
    if (anexo.arquivo_url?.startsWith('/anexos/arquivos/')) void previsualizar(anexo)
    else setVisualizando(anexo)
  }

  async function previsualizar(anexo: Anexo) {
    if (!anexo.arquivo_url) return
    setErroArquivo('')
    try {
      const blob = await baixarArquivo(`${anexo.arquivo_url}?inline=true`)
      fecharPrevia()
      setPrevia({ anexo, url: URL.createObjectURL(blob), tipo: blob.type })
    } catch (falha) {
      setErroArquivo(falha instanceof Error ? falha.message : 'Não foi possível abrir o arquivo.')
    }
  }

  async function apagar(anexo: Anexo) {
    if (window.confirm(`Excluir o anexo ${anexo.titulo}?`)) await recurso.executar(() => anexosApi.apagar(anexo.id))
  }

  return (
    <PaginaModulo kicker="ARQUIVOS" titulo="Anexos" descricao="Organize documentos e links de referência da equipe." carregando={recurso.carregando} erro={recurso.erro || erroArquivo} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} {recurso.itens.length === 1 ? 'anexo' : 'anexos'}</p><button className="module-primary" type="button" onClick={() => { setDados(vazio); setArquivo(null); setErroArquivo(''); setEditando(null); setFormAberto((aberto) => !aberto) }}>{formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar formulário' : 'Novo anexo'}</button></div>
      <CampoModulo rotulo="Filtrar por categoria"><select value={categoriaFiltro} onChange={(event) => setCategoriaFiltro(event.target.value)}><option value="">Todos</option><option value="Calendarios">Calendários</option><option value="Panilhas">Planilhas</option><option value="Fichas">Fichas</option><option value="Regulamentos">Regulamentos</option><option value="Outro">Outro</option></select></CampoModulo>
      {formAberto && <form className="module-form" onSubmit={salvar}><div className="module-form-heading"><h2>{editando ? 'Editar anexo' : 'Novo anexo'}</h2></div><div className="module-form-grid">
        <CampoModulo rotulo="Título"><input required maxLength={160} value={dados.titulo} onChange={(event) => setDados({ ...dados, titulo: event.target.value })} /></CampoModulo>
        <CampoModulo rotulo="Categoria"><select value={dados.categoria} onChange={(event) => setDados({ ...dados, categoria: event.target.value as Anexo['categoria'] })}><option value="Calendarios">Calendários</option><option value="Panilhas">Planilhas</option><option value="Fichas">Fichas</option><option value="Regulamentos">Regulamentos</option><option value="Outro">Outro</option></select></CampoModulo>
        <CampoModulo rotulo="Arquivo"><input type="file" onChange={(event) => setArquivo(event.target.files?.[0] ?? null)} />{arquivo && <small>{arquivo.name}</small>}</CampoModulo>
        <CampoModulo rotulo="Link externo"><input type="url" maxLength={500} value={dados.link} onChange={(event) => setDados({ ...dados, link: event.target.value })} /></CampoModulo>
        <CampoModulo rotulo="Descrição"><textarea rows={3} value={dados.descricao} onChange={(event) => setDados({ ...dados, descricao: event.target.value })} /></CampoModulo>
      </div><div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar anexo'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div></form>}
      {previa && <ModalDetalhes grande titulo={previa.anexo.titulo} aoFechar={fecharPrevia}>
        {previa.tipo.startsWith('image/')
          ? <img className="anexo-previa" src={previa.url} alt={`Prévia de ${previa.anexo.titulo}`} />
          : previa.tipo === 'application/pdf' || previa.tipo.startsWith('text/')
            ? <iframe className="anexo-previa" src={previa.url} title={`Prévia de ${previa.anexo.titulo}`} />
            : <p className="module-empty">Este tipo de arquivo não tem prévia. Use o botão de baixar.</p>}
        <div className="module-form-actions">
          <a className="module-secondary" href={previa.url} target="_blank" rel="noreferrer"><ExternalLink size={16} />Abrir em nova aba</a>
          <button className="module-secondary" type="button" onClick={() => void baixar(previa.anexo)}><Download size={16} />Baixar arquivo</button>
          <button className="module-primary" type="button" onClick={() => { const anexo = previa.anexo; fecharPrevia(); setVisualizando(anexo) }}>Detalhes</button>
        </div>
      </ModalDetalhes>}
      {visualizando && <ModalDetalhes titulo={visualizando.titulo} aoFechar={() => setVisualizando(null)}>
        <dl className="module-details">
          <div><dt>Categoria</dt><dd>{visualizando.categoria}</dd></div>
          <div><dt>Arquivo</dt><dd>{visualizando.nome_arquivo ?? 'Não informado'}</dd></div>
          <div><dt>Data de cadastro</dt><dd>{visualizando.criado_em || 'Não informada'}</dd></div>
          <div><dt>Descrição</dt><dd>{visualizando.descricao ?? 'Sem descrição'}</dd></div>
          <div><dt>Link</dt><dd>{visualizando.link ? <a href={visualizando.link} target="_blank" rel="noreferrer">{visualizando.link}</a> : 'Não informado'}</dd></div>
        </dl>
        <div className="module-form-actions">
          {visualizando.arquivo_url?.startsWith('/anexos/arquivos/') && <button className="module-secondary" type="button" onClick={() => { const anexo = visualizando; setVisualizando(null); void previsualizar(anexo) }}><Eye size={16} />Visualizar</button>}
          {visualizando.arquivo_url?.startsWith('/anexos/arquivos/') && <button className="module-secondary" type="button" onClick={() => void baixar(visualizando)}><Download size={16} />Baixar arquivo</button>}
          <button className="module-primary" type="button" onClick={() => { setVisualizando(null); iniciarEdicao(visualizando) }}><Pencil size={16} />Editar</button>
        </div>
      </ModalDetalhes>}
      <div className="module-list" aria-label="Lista de anexos">{anexosFiltrados.map((anexo) => <article className="module-record" key={anexo.id}><button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${anexo.titulo}`} onClick={() => abrir(anexo)}><strong>{anexo.titulo}</strong><span>{anexo.categoria} · {anexo.nome_arquivo ?? 'Link de referência'}{anexo.criado_em ? ` · ${anexo.criado_em}` : ''}</span>{anexo.descricao && <p>{anexo.descricao}</p>}</button><div className="record-actions">{anexo.arquivo_url?.startsWith('/anexos/arquivos/') && <BotaoIcone label={`Visualizar ${anexo.titulo}`} onClick={() => abrir(anexo)}><Eye size={16} /></BotaoIcone>}{anexo.arquivo_url?.startsWith('/anexos/arquivos/') && <BotaoIcone label={`Baixar ${anexo.titulo}`} onClick={() => void baixar(anexo)}><Download size={16} /></BotaoIcone>}{anexo.link && <a className="icon-action" href={anexo.link} target="_blank" rel="noreferrer" aria-label={`Abrir ${anexo.titulo}`} title={`Abrir ${anexo.titulo}`}><ExternalLink size={16} /></a>}{anexo.arquivo_url && !anexo.arquivo_url.startsWith('/anexos/arquivos/') && <a className="icon-action" href={anexo.arquivo_url} target="_blank" rel="noreferrer" aria-label={`Abrir arquivo ${anexo.titulo}`} title={`Abrir arquivo ${anexo.titulo}`}><ExternalLink size={16} /></a>}<BotaoIcone label={`Editar ${anexo.titulo}`} onClick={() => iniciarEdicao(anexo)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${anexo.titulo}`} onClick={() => void apagar(anexo)}><Trash2 size={16} /></BotaoIcone></div></article>)}{!anexosFiltrados.length && <p className="module-empty">Nenhum anexo encontrado.</p>}</div>
    </PaginaModulo>
  )
}
