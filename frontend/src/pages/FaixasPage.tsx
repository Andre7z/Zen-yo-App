import { CrudCatalogo } from '../components/CrudCatalogo'
import { faixasApi, type Faixa } from '../servicos/dominio'

export function FaixasPage() {
  return <CrudCatalogo<Faixa>
    api={faixasApi}
    titulo="Faixas"
    rotuloNovo="Nova faixa"
    entidade="faixa"
    kicker="CONFIGURAÇÃO"
    descricao="Mantenha a ordem e a classificação das graduações do judô."
    campos={[
      { nome: 'nome', rotulo: 'Nome da faixa' },
      { nome: 'tipo', rotulo: 'Classificação', tipo: 'selecao', opcoes: [{ valor: 'Kyu', rotulo: 'Kyu' }, { valor: 'Dan', rotulo: 'Dan' }] },
      { nome: 'ordem', rotulo: 'Ordem', tipo: 'numero' },
    ]}
    colunas={[{ rotulo: 'Nome', valor: (faixa) => faixa.nome }, { rotulo: 'Tipo', valor: (faixa) => faixa.tipo }, { rotulo: 'Ordem', valor: (faixa) => String(faixa.ordem) }]}
  />
}
