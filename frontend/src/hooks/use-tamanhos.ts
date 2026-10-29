import { useEffect, useState } from 'react'
import { TAMANHOS_FAIXA, TAMANHOS_KIMONO, tamanhosApi } from '../servicos/dominio'

// Se a lista não carregar, os tamanhos padrão mantêm os comboboxes utilizáveis.
export function useTamanhos() {
  const [listas, setListas] = useState({ kimono: TAMANHOS_KIMONO, faixa: TAMANHOS_FAIXA })

  useEffect(() => {
    let ativo = true
    void tamanhosApi.listar()
      .then((tamanhos) => {
        if (!ativo || !Array.isArray(tamanhos) || !tamanhos.length) return
        const nomes = (tipo: string, padrao: string[]) => {
          const doTipo = tamanhos.filter((tamanho) => tamanho.tipo === tipo).map((tamanho) => tamanho.nome)
          return doTipo.length ? doTipo : padrao
        }
        setListas({ kimono: nomes('kimono', TAMANHOS_KIMONO), faixa: nomes('faixa', TAMANHOS_FAIXA) })
      })
      .catch(() => undefined)
    return () => { ativo = false }
  }, [])

  return listas
}

// Mantém visível o tamanho já gravado no aluno, mesmo que tenha saído da lista.
export function opcoesDeTamanho(lista: string[], atual: string | null | undefined) {
  return atual && !lista.includes(atual) ? [...lista, atual] : lista
}
