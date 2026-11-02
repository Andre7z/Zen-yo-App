import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { useRecurso } from '../hooks/use-recurso'
import { tamanhosApi, type Tamanho } from '../servicos/dominio'

const SECOES: { tipo: Tamanho['tipo']; titulo: string }[] = [
  { tipo: 'kimono', titulo: 'Tamanhos de judogi' },
  { tipo: 'faixa', titulo: 'Tamanhos de faixa' },
]

const nomeTipo = (tipo: Tamanho['tipo']) => tipo === 'kimono' ? 'judogi' : tipo

export function TamanhosPage() {
  const recurso = useRecurso(tamanhosApi)
  const [nome, setNome] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState<Tamanho['tipo']>('kimono')
  const [editando, setEditando] = useState<Tamanho | null>(null)
  const [formAberto, setFormAberto] = useState(false)

  function abrirCadastro(tipo: Tamanho['tipo']) {
    setNome('')
    setTipoSelecionado(tipo)
    setEditando(null)
    setFormAberto(true)
  }

  function abrirEdicao(tamanho: Tamanho) {
    setNome(tamanho.nome)
    setTipoSelecionado(tamanho.tipo)
    setEditando(tamanho)
    setFormAberto(true)
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nomeNormalizado = nome.trim()
    if (!nomeNormalizado) return
    const sucesso = await recurso.executar(() => editando
      ? tamanhosApi.atualizar(editando.id, { nome: nomeNormalizado })
      : tamanhosApi.criar({ tipo: tipoSelecionado, nome: nomeNormalizado }))
    if (sucesso) {
      setEditando(null)
      setFormAberto(false)
    }
  }

  async function mover(lista: Tamanho[], posicao: number, deslocamento: -1 | 1) {
    const atual = lista[posicao]
    const vizinho = lista[posicao + deslocamento]
    if (!vizinho) return
    await recurso.executar(async () => {
      await tamanhosApi.atualizar(atual.id, { ordem: vizinho.ordem })
      await tamanhosApi.atualizar(vizinho.id, { ordem: atual.ordem })
    })
  }

  async function apagar(tamanho: Tamanho) {
    if (window.confirm(`Remover o tamanho ${tamanho.nome}?`)) await recurso.executar(() => tamanhosApi.apagar(tamanho.id))
  }

  return (
    <PaginaModulo kicker="CADASTROS" titulo="Tamanhos" descricao="Defina os tamanhos de judogi e de faixa usados nos cadastros e planilhas." carregando={recurso.carregando} erro={recurso.erro} recarregar={() => { void recurso.carregar() }}>
      {SECOES.map(({ tipo, titulo }) => {
        const lista = recurso.itens.filter((tamanho) => tamanho.tipo === tipo).sort((a, b) => a.ordem - b.ordem)
        return (
          <section key={tipo} aria-label={titulo}>
            <div className="module-toolbar"><h2>{titulo}</h2><p>{lista.length} {lista.length === 1 ? 'tamanho' : 'tamanhos'}</p><button className="module-primary" type="button" onClick={() => abrirCadastro(tipo)}><Plus size={16} />Adicionar</button></div>
            <div className="module-list" aria-label={`Lista de ${titulo.toLowerCase()}`}>
              {lista.map((tamanho, posicao) => (
                <article className="module-record" key={tamanho.id}>
                  <div className="record-main"><strong>{tamanho.nome}</strong></div>
                  <div className="record-actions">
                    <BotaoIcone label={`Subir ${tamanho.nome}`} disabled={posicao === 0 || recurso.salvando} onClick={() => void mover(lista, posicao, -1)}><ArrowUp size={16} /></BotaoIcone>
                    <BotaoIcone label={`Descer ${tamanho.nome}`} disabled={posicao === lista.length - 1 || recurso.salvando} onClick={() => void mover(lista, posicao, 1)}><ArrowDown size={16} /></BotaoIcone>
                    <BotaoIcone label={`Renomear ${tamanho.nome}`} onClick={() => abrirEdicao(tamanho)}><Pencil size={16} /></BotaoIcone>
                    <BotaoIcone label={`Remover ${tamanho.nome}`} onClick={() => void apagar(tamanho)}><Trash2 size={16} /></BotaoIcone>
                  </div>
                </article>
              ))}
              {!lista.length && <p className="module-empty">Nenhum tamanho cadastrado.</p>}
            </div>
          </section>
        )
      })}
      {formAberto && <ModalDetalhes contexto="CADASTRO" titulo={editando ? `Editar tamanho de ${nomeTipo(editando.tipo)}` : `Novo tamanho de ${nomeTipo(tipoSelecionado)}`} aoFechar={() => setFormAberto(false)}>
        <form className="module-form" onSubmit={(event) => void salvar(event)}>
          <div className="module-form-grid">
            <CampoModulo rotulo={`Tamanho de ${nomeTipo(tipoSelecionado)}`}><input required maxLength={5} value={nome} onChange={(event) => setNome(event.target.value)} /></CampoModulo>
          </div>
          <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando || !nome.trim()}>{recurso.salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar'}</button><button className="module-secondary" type="button" onClick={() => setFormAberto(false)}>Cancelar</button></div>
        </form>
      </ModalDetalhes>}
    </PaginaModulo>
  )
}
