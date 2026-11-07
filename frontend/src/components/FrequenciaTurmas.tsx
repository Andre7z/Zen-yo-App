import { useEffect, useState, type FormEvent } from 'react'
import { baixarArquivo, nomeArquivoSeguro } from '../api'
import { useAutenticacao } from '../autenticacao-context'
import { useNotificacao } from '../notificacoes-context'
import { dataAtualIso } from '../servicos/datas'
import { primeiroEUltimoNome } from '../servicos/nomes'
import { turmasApi, type ChamadaTurma, type Turma } from '../servicos/dominio'
import { ModalDetalhes } from './ModalDetalhes'
import { CampoModulo } from './PaginaModulo'

export function RegistroFrequencia({ turma, aoFechar, dataInicial }: { turma: Turma; aoFechar: () => void; dataInicial?: string }) {
  const [data, setData] = useState(() => dataInicial ?? dataAtualIso())
  const [chamada, setChamada] = useState<ChamadaTurma | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const notificacao = useNotificacao()

  useEffect(() => {
    let ativa = true
    if (data) {
      void turmasApi.consultarFrequencia(turma.id, data).then((resultado) => {
        if (ativa) setChamada(resultado)
      }).catch((falha: unknown) => {
        if (ativa) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar a chamada.')
      })
    }
    return () => { ativa = false }
  }, [turma.id, data, tentativa])

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chamada) return
    setSalvando(true)
    setErro('')
    try {
      const alunos = chamada.alunos.map((aluno) => ({ aluno_id: aluno.aluno_id, presente: aluno.presente }))
      const resultado = await turmasApi.salvarFrequencia(turma.id, data, alunos)
      setChamada(resultado)
      notificacao.sucesso('Frequência salva com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível salvar a frequência.'
      setErro(mensagem)
      notificacao.erro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  return <ModalDetalhes contexto="FREQUÊNCIA" titulo={`Registro de frequência · ${turma.nome}`} aoFechar={aoFechar} grande>
    <form className="module-form" onSubmit={(event) => void salvar(event)}>
      <CampoModulo rotulo="Data da aula"><input className="frequencia-data" type="date" required value={data} disabled={salvando} onChange={(event) => { setChamada(null); setErro(''); setData(event.target.value) }} /></CampoModulo>
      {erro && <div className="module-error" role="alert">{erro}{!chamada && data && <button className="module-secondary" type="button" onClick={() => { setErro(''); setTentativa((atual) => atual + 1) }}>Tentar novamente</button>}</div>}
      {data && !chamada && !erro && <p role="status">Carregando chamada...</p>}
      {chamada && <>
        <p>{chamada.registrada ? 'Chamada registrada. Você pode alterar as marcações.' : 'Todos começam presentes. Desmarque os alunos que faltaram e salve a chamada.'}</p>
        {!chamada.alunos.length && <p>Nenhum aluno nesta chamada.</p>}
        <div className="frequencia-lista">
          {chamada.alunos.map((aluno) => <label className="frequencia-aluno" key={aluno.aluno_id}>
            <span className="frequencia-aluno-nome">{aluno.nome}</span>{' '}
            <span className="frequencia-aluno-marcacao">
              <input type="checkbox" checked={aluno.presente} disabled={salvando} onChange={(event) => {
                const presente = event.target.checked
                setChamada((atual) => atual && { ...atual, alunos: atual.alunos.map((item) => item.aluno_id === aluno.aluno_id ? { ...item, presente } : item) })
              }} />
              {aluno.presente ? 'Presente' : 'Faltou'}
            </span>
          </label>)}
        </div>
        <div className="module-form-actions"><button className="module-primary" disabled={salvando || !chamada.alunos.length}>{salvando ? 'Salvando...' : 'Salvar frequência'}</button></div>
      </>}
    </form>
  </ModalDetalhes>
}

export function ExportarFrequencia({ turmas, aoFechar }: { turmas: Turma[]; aoFechar: () => void }) {
  const [mes, setMes] = useState(() => dataAtualIso().slice(0, 7))
  const [selecionadas, setSelecionadas] = useState<number[]>([])
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const { usuario } = useAutenticacao()
  const notificacao = useNotificacao()

  async function exportar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selecionadas.length) { setErro('Selecione pelo menos uma turma.'); return }
    const [ano, numeroMes] = mes.split('-')
    const parametros = new URLSearchParams({ ano, mes: numeroMes })
    selecionadas.forEach((id) => parametros.append('turma_ids', String(id)))
    setGerando(true)
    setErro('')
    try {
      if (!usuario) throw new Error('Não foi possível identificar o professor para gerar a planilha.')
      const blob = await baixarArquivo(`/turmas/planilha-de-frequencia.xlsx?${parametros}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const nomeMes = new Date(Number(ano), Number(numeroMes) - 1, 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()
      link.href = url
      link.download = nomeArquivoSeguro(`FREQUÊNCIA DE ${nomeMes} ${ano} - SENSEI ${primeiroEUltimoNome(usuario.nome).toUpperCase()}.xlsx`)
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notificacao.sucesso('Planilha gerada com sucesso.')
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível gerar a planilha.'
      setErro(mensagem)
      notificacao.erro(mensagem)
    } finally {
      setGerando(false)
    }
  }

  return <ModalDetalhes contexto="PLANILHA" titulo="Planilha de frequência das turmas" aoFechar={aoFechar}>
    <form className="module-form" onSubmit={(event) => void exportar(event)}>
      <CampoModulo rotulo="Mês"><input type="month" required value={mes} onChange={(event) => setMes(event.target.value)} /></CampoModulo>
      <fieldset className="frequencia-selecao"><legend>Turmas</legend>
        {turmas.map((turma) => <label key={turma.id}><input type="checkbox" checked={selecionadas.includes(turma.id)} onChange={(event) => setSelecionadas(event.target.checked ? [...selecionadas, turma.id] : selecionadas.filter((id) => id !== turma.id))} /> {turma.nome}</label>)}
        {!turmas.length && <p>Nenhuma turma cadastrada.</p>}
      </fieldset>
      {erro && <p className="module-error" role="alert">{erro}</p>}
      <div className="module-form-actions"><button className="module-primary" disabled={gerando || !turmas.length}>{gerando ? 'Gerando...' : 'Gerar planilha'}</button></div>
    </form>
  </ModalDetalhes>
}
