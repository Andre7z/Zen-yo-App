import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import { PaginaModulo } from '../components/PaginaModulo'
import { useRecurso } from '../hooks/use-recurso'
import { atividadesApi } from '../servicos/dominio'

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${data}T12:00:00`))
}

export function CalendarioPage() {
  const recurso = useRecurso(atividadesApi)
  const atividades = useMemo(() => [...recurso.itens].sort((a, b) => a.data.localeCompare(b.data)), [recurso.itens])
  const porData = useMemo(() => atividades.reduce<Record<string, typeof atividades>>((grupos, atividade) => {
    grupos[atividade.data] = [...(grupos[atividade.data] ?? []), atividade]
    return grupos
  }, {}), [atividades])

  return (
    <PaginaModulo kicker="AGENDA DO DOJÔ" titulo="Calendário" descricao="Acompanhe treinos, entregas e graduações cadastrados." carregando={recurso.carregando} erro={recurso.erro} recarregar={() => { void recurso.carregar() }}>
      {!atividades.length ? <section className="module-empty-state"><CalendarDays size={26} /><h2>Agenda vazia</h2><p>As atividades cadastradas aparecerão organizadas por data.</p><Link className="module-primary" to="/atividades">Abrir atividades</Link></section> : <div className="calendar-list">{Object.entries(porData).map(([data, itens]) => <section className="calendar-day" key={data}><h2><time dateTime={data}>{formatarData(data)}</time></h2>{itens.map((atividade) => <article className="module-record" key={atividade.id}><div className="record-date">{data.slice(8, 10)}</div><div className="record-main"><strong>{atividade.nome}</strong><span>{atividade.tipo.replaceAll('_', ' ')} · {atividade.aluno_ids.length} alunos{atividade.local ? ` · ${atividade.local}` : ''}</span></div>{atividade.local && <MapPin className="calendar-location" size={16} aria-label={`Local: ${atividade.local}`} />}</article>)}</section>)}</div>}
    </PaginaModulo>
  )
}
