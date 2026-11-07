import { describe, expect, it } from 'vitest'
import { exibirTelefone, formatarTelefone } from '../src/servicos/telefone'

describe('formatação de telefone', () => {
  it('formata números com dez ou onze dígitos e limita a entrada', () => {
    expect(formatarTelefone('6499887766')).toBe('(64)9988-7766')
    expect(formatarTelefone('64999887766')).toBe('(64)99988-7766')
    expect(formatarTelefone('649998877669')).toBe('(64)99988-7766')
    expect(formatarTelefone('64')).toBe('(64')
  })

  it('formata números antigos válidos sem alterar outros dados existentes', () => {
    expect(exibirTelefone('6499887766')).toBe('(64)9988-7766')
    expect(exibirTelefone('64999887766')).toBe('(64)99988-7766')
    expect(exibirTelefone('+55 64 99988-7766')).toBe('+55 64 99988-7766')
    expect(exibirTelefone('ramal 1234')).toBe('ramal 1234')
  })
})
