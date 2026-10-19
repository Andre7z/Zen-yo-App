import { useState, type FormEvent } from 'react'
import { Download, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import { anexosApi, type Anexo } from '../servicos/dominio'
import { baixarArquivo } from '../api'

const vazio = { titulo: '', categoria: 'Calendarios' as Anexo['categoria'], descricao: '', nome_arquivo: '', arquivo_url: '', link: '' }
type DadosAnexo = typeof vazio

export function AnexosPage() {
  const recurso = useRecurso(anexosApi)
  const [dados, setDados] = useState<DadosAnexo>(vazio)
  const [editando, setEditando] = useState<number | null>(null)
  const [formAberto, setFormAberto] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')

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

  async function apagar(anexo: Anexo) {
    if (window.confirm(`Excluir o anexo ${anexo.titulo}?`)) await recurso.executar(() => anexosApi.apagar(anexo.id))
  }

  return (
    <PaginaModulo kicker="ARQUIVOS" titulo="Anexos" descricao="Organize documentos e links de referência da equipe." carregando={recurso.carregando} erro={recurso.erro || erroArquivo} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} {recurso.itens.length === 1 ? 'anexo' : 'anexos'}</p><button className="module-primary" type="button" onClick={() => { setDados(vazio); setArquivo(null); setErroArquivo(''); setEditando(null); setFormAberto((aberto) => !aberto) }}>{formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar formulário' : 'Novo anexo'}</button></div>
      {formAberto && <form className="module-form" onSubmit={salvar}><div className="module-form-heading"><h2>{editando ? 'Editar anexo' : 'Novo anexo'}</h2></div><div className="module-form-grid">
        <CampoModulo rotulo="Título"><input required maxLength={160} value={dados.titulo} onChange={(event) => setDados({ ...dados, titulo: event.target.value })} /></CampoModulo>
        <CampoModulo rotulo="Categoria"><select value={dados.categoria} onChange={(event) => setDados({ ...dados, categoria: event.target.value as Anexo['categoria'] })}><option value="Calendarios">Calendários</option><option value="Panilhas">Planilhas</option><option value="Fichas">Fichas</option><option value="Regulamentos">Regulamentos</option><option value="Outro">Outro</option></select></CampoModulo>
        <CampoModulo rotulo="Arquivo"><input type="file" onChange={(event) => setArquivo(event.target.files?.[0] ?? null)} />{arquivo && <small>{arquivo.name}</small>}</CampoModulo>
        <CampoModulo rotulo="Link externo"><input type="url" maxLength={500} value={dados.link} onChange={(event) => setDados({ ...dados, link: event.target.value })} /></CampoModulo>
        <CampoModulo rotulo="Descrição"><textarea rows={3} value={dados.descricao} onChange={(event) => setDados({ ...dados, descricao: event.target.value })} /></CampoModulo>
      </div><div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar anexo'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div></form>}
      <div className="module-list" aria-label="Lista de anexos">{recurso.itens.map((anexo) => <article className="module-record" key={anexo.id}><div className="record-main"><strong>{anexo.titulo}</strong><span>{anexo.categoria} · {anexo.nome_arquivo ?? 'Link de referência'}{anexo.criado_em ? ` · ${anexo.criado_em}` : ''}</span>{anexo.descricao && <p>{anexo.descricao}</p>}</div><div className="record-actions">{anexo.arquivo_url?.startsWith('/anexos/arquivos/') && <BotaoIcone label={`Baixar ${anexo.titulo}`} onClick={() => void baixar(anexo)}><Download size={16} /></BotaoIcone>}{anexo.link && <a className="icon-action" href={anexo.link} target="_blank" rel="noreferrer" aria-label={`Abrir ${anexo.titulo}`} title={`Abrir ${anexo.titulo}`}><ExternalLink size={16} /></a>}{anexo.arquivo_url && !anexo.arquivo_url.startsWith('/anexos/arquivos/') && <a className="icon-action" href={anexo.arquivo_url} target="_blank" rel="noreferrer" aria-label={`Abrir arquivo ${anexo.titulo}`} title={`Abrir arquivo ${anexo.titulo}`}><ExternalLink size={16} /></a>}<BotaoIcone label={`Editar ${anexo.titulo}`} onClick={() => iniciarEdicao(anexo)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${anexo.titulo}`} onClick={() => void apagar(anexo)}><Trash2 size={16} /></BotaoIcone></div></article>)}{!recurso.itens.length && <p className="module-empty">Nenhum anexo cadastrado.</p>}</div>
    </PaginaModulo>
  )
}
