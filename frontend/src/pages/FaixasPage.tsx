import { CrudCatalogo } from '../components/CrudCatalogo'
import { faixasApi, type Faixa } from '../servicos/dominio'

export function FaixasPage() {
  return <CrudCatalogo<Faixa>
    api={faixasApi}
    titulo="Faixas"
    rotuloNovo="Nova faixa"
    entidade="faixa"
    kicker="CONFIGURAÇÃO"
    descricao="Graduações do judô, ordenadas automaticamente: Iniciante, Kyu (decrescente) e Dan (crescente)."
    campos={[
      { nome: 'nome', rotulo: 'Nome da faixa' },
      { nome: 'tipo', rotulo: 'Classificação', tipo: 'selecao', opcoes: [{ valor: 'Iniciante', rotulo: 'Iniciante' }, { valor: 'Kyu', rotulo: 'Kyu' }, { valor: 'Dan', rotulo: 'Dan' }] },
      { nome: 'grau', rotulo: 'Número do Kyu/Dan', tipo: 'numero', obrigatorio: false },
    ]}
    colunas={[
      { rotulo: 'Nome', valor: (faixa) => faixa.nome },
      { rotulo: 'Graduação', valor: (faixa) => faixa.grau ? `${faixa.grau}º ${faixa.tipo}` : faixa.tipo },
    ]}
  />
}
