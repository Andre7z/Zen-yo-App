from datetime import date

import pytest
from pydantic import ValidationError

from app.atividades.schemas import AtividadeAtualizar, AtividadeEntrada
from app.alunos.schemas import AlunoAtualizar, AlunoCriar


@pytest.mark.parametrize("schema", [AlunoCriar, AlunoAtualizar])
@pytest.mark.parametrize("data_nascimento", [date(9999, 12, 31), date(1800, 1, 1)])
def test_schemas_de_aluno_rejeitam_nascimento_fora_do_limite(schema, data_nascimento):
    with pytest.raises(ValidationError, match="data de nascimento"):
        schema(data_nascimento=data_nascimento)


def test_schemas_de_aluno_aceitam_data_de_nascimento_atual():
    assert AlunoCriar(nome="Caio", faixa_id=1, data_nascimento=date.today()).data_nascimento == date.today()
    assert AlunoAtualizar(data_nascimento=date.today()).data_nascimento == date.today()


@pytest.mark.parametrize("schema", [AtividadeEntrada, AtividadeAtualizar])
@pytest.mark.parametrize("data", [date(1999, 12, 31), date(2151, 1, 1)])
def test_schemas_de_atividade_rejeitam_datas_fora_do_periodo(schema, data):
    dados = {"data": data}
    if schema is AtividadeEntrada:
        dados.update(tipo="frequencia", nome="Treino")

    with pytest.raises(ValidationError, match="entre 2000 e 2150"):
        schema(**dados)


def test_schemas_de_atividade_aceitam_os_limites_de_ano():
    dados = {"tipo": "frequencia", "nome": "Treino"}
    assert AtividadeEntrada(**dados, data=date(2000, 1, 1)).data == date(2000, 1, 1)
    assert AtividadeEntrada(**dados, data=date(2150, 12, 31)).data == date(2150, 12, 31)
    assert AtividadeAtualizar(data=date(2000, 1, 1)).data == date(2000, 1, 1)
    assert AtividadeAtualizar(data=date(2150, 12, 31)).data == date(2150, 12, 31)
