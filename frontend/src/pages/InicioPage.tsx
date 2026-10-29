import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { useAutenticacao } from '../autenticacao-context'
import { ModalDetalhes } from '../components/ModalDetalhes'
import { useRecurso } from '../hooks/use-recurso'
import { atividadesApi, type Atividade } from '../servicos/dominio'
import { formatarDataParaEntrada } from '../servicos/datas'
import { ROTAS } from '../routes'

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${data}T12:00:00`))
}

export function InicioPage() {
  const { usuario } = useAutenticacao()
  const recurso = useRecurso(atividadesApi)
  const [visualizando, setVisualizando] = useState<Atividade | null>(null)
  const atividades = useMemo(() => [...recurso.itens].sort((a, b) => a.data.localeCompare(b.data)), [recurso.itens])
  const porData = useMemo(() => atividades.reduce<Record<string, Atividade[]>>((grupos, atividade) => {
    grupos[atividade.data] = [...(grupos[atividade.data] ?? []), atividade]
    return grupos
  }, {}), [atividades])
  if (!usuario) return null
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0]

  return (
    <section className="home-main">
      <h1>Bem-vindo, Sensei <em>{primeiroNome}.</em></h1>

      <section className="home-calendar" aria-label="Calendário">
        <h2 className="home-calendar-title"><CalendarDays size={18} />Calendário</h2>
        {recurso.erro && <p className="module-error" role="alert">{recurso.erro}</p>}
        {visualizando && <ModalDetalhes titulo={visualizando.nome} aoFechar={() => setVisualizando(null)}>
          <dl className="module-details">
            <div><dt>Tipo</dt><dd>{visualizando.tipo.replaceAll('_', ' ')}</dd></div>
            <div><dt>Data</dt><dd>{formatarDataParaEntrada(visualizando.data)}</dd></div>
            <div><dt>Local</dt><dd>{visualizando.local ?? 'Não informado'}</dd></div>
            <div><dt>Participantes</dt><dd>{visualizando.aluno_ids.length}</dd></div>
            <div><dt>Descrição</dt><dd>{visualizando.descricao ?? 'Sem descrição'}</dd></div>
          </dl>
        </ModalDetalhes>}
        {!recurso.carregando && !atividades.length
          ? <div className="module-empty-state"><p>As atividades cadastradas aparecerão organizadas por data.</p><Link className="module-primary" to={ROTAS.atividades}>Abrir atividades</Link></div>
          : <div className="calendar-list">{Object.entries(porData).map(([data, itens]) => <section className="calendar-day" key={data}><h3><time dateTime={data}>{formatarData(data)}</time></h3>{itens.map((atividade) => <article className="module-record" key={atividade.id}><div className="record-date">{data.slice(8, 10)}</div><button className="record-main record-open" type="button" aria-label={`Ver detalhes de ${atividade.nome}`} onClick={() => setVisualizando(atividade)}><strong>{atividade.nome}</strong><span>{atividade.tipo.replaceAll('_', ' ')} · {atividade.aluno_ids.length} alunos{atividade.local ? ` · ${atividade.local}` : ''}</span></button>{atividade.local && <MapPin className="calendar-location" size={16} aria-label={`Local: ${atividade.local}`} />}</article>)}</section>)}</div>}
      </section>

      <div className="home-note"><span className="note-mark">柔道</span></div>
      <footer className="home-footer"><span>ZEN'YO · GESTÃO DE JUDÔ</span></footer>
    </section>
  )
}
