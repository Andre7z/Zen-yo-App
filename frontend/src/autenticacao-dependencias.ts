import { clearToken, getToken, saveToken } from './api'
import { AutenticacaoFacade } from './autenticacao-facade'
import { autenticacaoService } from './autenticacao-service'
import { historicoAutenticacao } from './historico-autenticacao'

const sessao = {
  obterToken: getToken,
  salvarToken: saveToken,
  limparToken: clearToken,
}

export function obterAutenticacaoFacade() {
  return new AutenticacaoFacade(autenticacaoService, sessao, historicoAutenticacao)
}

export const autenticacaoFacade = obterAutenticacaoFacade()