import { describe, expect, it } from 'vitest'
import { primeiroEUltimoNome } from '../src/servicos/nomes'
import { nomeArquivoPlanilhaXlsx } from '../src/servicos/dominio'

describe('nomes das planilhas', () => {
  it.each([
    ['Luiz Rocha Moraes', 'Luiz Moraes'],
    ['  José   da  Silva  ', 'José Silva'],
    ['Ana', 'Ana'],
    ['Ana Silva', 'Ana Silva'],
  ])('seleciona primeiro e último nome de %s', (nome, esperado) => {
    expect(primeiroEUltimoNome(nome)).toBe(esperado)
  })

  it('inclui e sanitiza atividade e professor no nome do arquivo', () => {
    expect(nomeArquivoPlanilhaXlsx('Treino/Especial', 'José da Silva')).toBe('TREINO-ESPECIAL - SENSEI JOSÉ SILVA.xlsx')
    expect(nomeArquivoPlanilhaXlsx('Graduação', 'Ana')).toBe('GRADUAÇÃO - SENSEI ANA.xlsx')
  })
})
