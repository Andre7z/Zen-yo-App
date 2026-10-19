import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from './PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import type { Identificado } from '../servicos/dominio'

type Campo = {
  nome: string
  rotulo: string
  tipo?: 'texto' | 'numero' | 'selecao'
  obrigatorio?: boolean
  opcoes?: Array<{ valor: string; rotulo: string }>
}

type Props<T extends Identificado> = {
  api: {
    listar(): Promise<T[]>
    criar(dados: object): Promise<T>
    atualizar(id: number, dados: object): Promise<T>
    apagar(id: number): Promise<void>
  }
  campos: Campo[]
  titulo: string
  rotuloNovo: string
  entidade: string
  kicker: string
  descricao: string
  colunas: Array<{ rotulo: string; valor(item: T): string }>
}

export function CrudCatalogo<T extends Identificado>({ api, campos, titulo, rotuloNovo, entidade, kicker, descricao, colunas }: Props<T>) {
  const recurso = useRecurso(api)
  const valoresIniciais = Object.fromEntries(campos.map((campo) => [campo.nome, campo.tipo === 'numero' ? '1' : '']))
  const [valores, setValores] = useState<Record<string, string>>(valoresIniciais)
  const [editando, setEditando] = useState<T | null>(null)
  const [aberto, setAberto] = useState(false)

  function editar(item: T) {
    setValores(Object.fromEntries(campos.map((campo) => [campo.nome, String((item as Record<string, unknown>)[campo.nome] ?? '')])))
    setEditando(item)
    setAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(campos.map((campo) => {
      const valor = valores[campo.nome].trim()
      return [campo.nome, campo.tipo === 'numero' ? Number(valor) : valor || (campo.obrigatorio === false ? null : '')]
    }))
    const sucesso = await recurso.executar(() => editando
      ? api.atualizar(editando.id, payload)
      : api.criar(payload))
    if (sucesso) {
      setValores(valoresIniciais)
      setEditando(null)
      setAberto(false)
    }
  }

  async function apagar(item: T) {
    const nome = colunas[0]?.valor(item) ?? `#${item.id}`
    if (window.confirm(`Excluir ${nome}?`)) await recurso.executar(() => api.apagar(item.id))
  }

  return (
    <PaginaModulo kicker={kicker} titulo={titulo} descricao={descricao} carregando={recurso.carregando} erro={recurso.erro} recarregar={() => { void recurso.carregar() }}>
      <div className="module-toolbar"><p>{recurso.itens.length} registros</p><button className="module-primary" type="button" onClick={() => { setValores(valoresIniciais); setEditando(null); setAberto((atual) => !atual) }}>{aberto ? <X size={16} /> : <Plus size={16} />}{aberto ? 'Fechar formulário' : rotuloNovo}</button></div>
      {aberto && <form className="module-form" onSubmit={salvar}><div className="module-form-heading"><h2>{editando ? `Editar ${entidade}` : rotuloNovo}</h2></div><div className="module-form-grid">{campos.map((campo) => <CampoModulo key={campo.nome} rotulo={campo.rotulo}><CampoControle campo={campo} valor={valores[campo.nome]} alterar={(valor) => setValores({ ...valores, [campo.nome]: valor })} /></CampoModulo>)}</div><div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando}>{recurso.salvando ? 'Salvando...' : 'Salvar'}</button><button className="module-secondary" type="button" onClick={() => setAberto(false)}>Cancelar</button></div></form>}
      <div className="module-list" aria-label={`Lista: ${titulo}`}>{recurso.itens.map((item) => <article className="module-record" key={item.id}><div className="record-main"><strong>{colunas[0]?.valor(item) ?? `#${item.id}`}</strong><span>{colunas.slice(1).map((coluna) => `${coluna.rotulo}: ${coluna.valor(item)}`).join(' · ')}</span></div><div className="record-actions"><BotaoIcone label={`Editar ${colunas[0]?.valor(item) ?? item.id}`} onClick={() => editar(item)}><Pencil size={16} /></BotaoIcone><BotaoIcone label={`Excluir ${colunas[0]?.valor(item) ?? item.id}`} onClick={() => void apagar(item)}><Trash2 size={16} /></BotaoIcone></div></article>)}{!recurso.itens.length && <p className="module-empty">Nenhum registro cadastrado.</p>}</div>
    </PaginaModulo>
  )
}

function CampoControle({ campo, valor, alterar }: { campo: Campo; valor: string; alterar(valor: string): void }) {
  const obrigatorio = campo.obrigatorio !== false
  if (campo.tipo === 'selecao') return <select required={obrigatorio} value={valor} onChange={(event) => alterar(event.target.value)}><option value="">Selecione</option>{campo.opcoes?.map((opcao) => <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>)}</select>
  return <input required={obrigatorio} min={campo.tipo === 'numero' ? 1 : undefined} minLength={campo.tipo === 'numero' ? undefined : 2} type={campo.tipo === 'numero' ? 'number' : 'text'} value={valor} onChange={(event) => alterar(event.target.value)} />
}
