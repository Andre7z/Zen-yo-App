import { describe, expect, it } from 'vitest'
import { formatarCodigoZempo } from '../src/servicos/zempo'

describe('código Zempo', () => {
  it('adiciona o prefixo sem exigir quantidade mínima de dígitos', () => {
    expect(formatarCodigoZempo('')).toBe('')
    expect(formatarCodigoZempo('1')).toBe('JU1')
    expect(formatarCodigoZempo('ju001234')).toBe('JU001234')
    expect(formatarCodigoZempo('JU12-3')).toBe('JU123')
    expect(formatarCodigoZempo('123456789012345')).toBe('JU123456789012')
  })
})
