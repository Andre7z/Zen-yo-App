import { useEffect, useState } from 'react'
import { formatarDataParaEntrada } from '../servicos/datas'
import { turmasApi, type Turma } from '../servicos/dominio'

export function HistoricoFrequencia({ turma, editar }: { turma: Turma; editar: (data: string) => void }) {
  const [datas, setDatas] = useState<string[] | null>(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativa = true
    void turmasApi.listarFrequencias(turma.id).then((resultado) => {
      if (ativa) setDatas(resultado)
    }).catch((falha: unknown) => {
      if (ativa) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as chamadas.')
    })
    return () => { ativa = false }
  }, [turma.id, tentativa])

  return <section className="historico-frequencia" aria-label="Chamadas registradas">
    <h3>Chamadas registradas</h3>
    {erro && <div className="module-error" role="alert">{erro}<button className="module-secondary" type="button" onClick={() => { setErro(''); setTentativa((atual) => atual + 1) }}>Tentar novamente</button></div>}
    {!datas && !erro && <p role="status">Carregando chamadas...</p>}
    {datas?.length === 0 && <p>Nenhuma chamada registrada.</p>}
    {datas && datas.length > 0 && <ul className="historico-frequencia-lista">
      {datas.map((data) => <li key={data}>
        <time dateTime={data}>{formatarDataParaEntrada(data)}</time>
        <button className="module-secondary" type="button" aria-label={`Editar registro de ${formatarDataParaEntrada(data)}`} onClick={() => editar(data)}>Editar registro</button>
      </li>)}
    </ul>}
  </section>
}
