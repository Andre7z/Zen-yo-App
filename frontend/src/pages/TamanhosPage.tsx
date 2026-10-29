import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { BotaoIcone, CampoModulo, PaginaModulo } from '../components/PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import { tamanhosApi, type Tamanho } from '../servicos/dominio'

const SECOES: { tipo: Tamanho['tipo']; titulo: string }[] = [
  { tipo: 'kimono', titulo: 'Tamanhos de kimono' },
  { tipo: 'faixa', titulo: 'Tamanhos de faixa' },
]

export function TamanhosPage() {
  const recurso = useRecurso(tamanhosApi)
  const [novo, setNovo] = useState({ kimono: '', faixa: '' })

  async function adicionar(event: FormEvent<HTMLFormElement>, tipo: Tamanho['tipo']) {
    event.preventDefault()
    const nome = novo[tipo].trim()
    if (!nome) return
    if (await recurso.executar(() => tamanhosApi.criar({ tipo, nome }))) setNovo((atual) => ({ ...atual, [tipo]: '' }))
  }

  async function renomear(tamanho: Tamanho) {
    const nome = window.prompt(`Novo nome para o tamanho ${tamanho.nome}`, tamanho.nome)?.trim()
    if (nome && nome !== tamanho.nome) await recurso.executar(() => tamanhosApi.atualizar(tamanho.id, { nome }))
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
    <PaginaModulo kicker="CADASTROS" titulo="Tamanhos" descricao="Defina os tamanhos de kimono e de faixa usados nos cadastros e planilhas." carregando={recurso.carregando} erro={recurso.erro} recarregar={() => { void recurso.carregar() }}>
      {SECOES.map(({ tipo, titulo }) => {
        const lista = recurso.itens.filter((tamanho) => tamanho.tipo === tipo).sort((a, b) => a.ordem - b.ordem)
        return (
          <section key={tipo} aria-label={titulo}>
            <div className="module-toolbar"><h2>{titulo}</h2><p>{lista.length} {lista.length === 1 ? 'tamanho' : 'tamanhos'}</p></div>
            <form className="module-form" onSubmit={(event) => void adicionar(event, tipo)}>
              <div className="module-form-grid">
                <CampoModulo rotulo={`Novo tamanho de ${tipo}`}><input maxLength={5} value={novo[tipo]} onChange={(event) => setNovo({ ...novo, [tipo]: event.target.value })} /></CampoModulo>
              </div>
              <div className="module-form-actions"><button className="module-primary" disabled={recurso.salvando || !novo[tipo].trim()}><Plus size={16} />Adicionar</button></div>
            </form>
            <div className="module-list" aria-label={`Lista de ${titulo.toLowerCase()}`}>
              {lista.map((tamanho, posicao) => (
                <article className="module-record" key={tamanho.id}>
                  <div className="record-main"><strong>{tamanho.nome}</strong></div>
                  <div className="record-actions">
                    <BotaoIcone label={`Subir ${tamanho.nome}`} disabled={posicao === 0 || recurso.salvando} onClick={() => void mover(lista, posicao, -1)}><ArrowUp size={16} /></BotaoIcone>
                    <BotaoIcone label={`Descer ${tamanho.nome}`} disabled={posicao === lista.length - 1 || recurso.salvando} onClick={() => void mover(lista, posicao, 1)}><ArrowDown size={16} /></BotaoIcone>
                    <BotaoIcone label={`Renomear ${tamanho.nome}`} onClick={() => void renomear(tamanho)}><Pencil size={16} /></BotaoIcone>
                    <BotaoIcone label={`Remover ${tamanho.nome}`} onClick={() => void apagar(tamanho)}><Trash2 size={16} /></BotaoIcone>
                  </div>
                </article>
              ))}
              {!lista.length && <p className="module-empty">Nenhum tamanho cadastrado.</p>}
            </div>
          </section>
        )
      })}
    </PaginaModulo>
  )
}
