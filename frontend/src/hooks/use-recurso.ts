import { useCallback, useEffect, useState } from 'react'
import type { Identificado } from '../servicos/dominio'
import { useNotificacao } from '../notificacoes-context'

type RecursoApi<T extends Identificado> = {
  listar(): Promise<T[]>
  criar(dados: object): Promise<T>
  atualizar(id: number, dados: object): Promise<T>
  apagar(id: number): Promise<void>
}

export function useRecurso<T extends Identificado>(api: RecursoApi<T>) {
  const [itens, setItens] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const notificacao = useNotificacao()

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setItens(await api.listar())
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar os dados.')
    } finally {
      setCarregando(false)
    }
  }, [api])

  useEffect(() => {
    let ativo = true
    void api.listar()
      .then((dados) => { if (ativo) setItens(dados) })
      .catch((falha: unknown) => {
        if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar os dados.')
      })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [api])

  const executar = useCallback(async (operacao: () => Promise<unknown>, mensagemSucesso = 'Salvo com sucesso.') => {
    setSalvando(true)
    setErro('')
    try {
      await operacao()
      await carregar()
      notificacao.sucesso(mensagemSucesso)
      return true
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível salvar as alterações.'
      setErro(mensagem)
      notificacao.erro(mensagem)
      return false
    } finally {
      setSalvando(false)
    }
  }, [carregar, notificacao])

  return { itens, carregando, salvando, erro, carregar, executar }
}
