import pytest
from pydantic import ValidationError

from app.alunos.schemas import AlunoAtualizar, AlunoCriar


def test_cpf_e_opcional_e_vazio_vira_none():
    assert AlunoCriar(nome="Caio", faixa_id=1).cpf is None
    assert AlunoCriar(nome="Caio", faixa_id=1, cpf="  ").cpf is None


@pytest.mark.parametrize("cpf", ["52998224725", "529.982.247-25", " 529.982.247-25 "])
def test_cpf_valido_e_normalizado(cpf):
    assert AlunoCriar(nome="Caio", faixa_id=1, cpf=cpf).cpf == "529.982.247-25"


@pytest.mark.parametrize("cpf", ["12345678901", "11111111111", "5299822472", "abc", "529.982.247-26"])
def test_cpf_invalido_e_rejeitado(cpf):
    with pytest.raises(ValidationError) as erro:
        AlunoCriar(nome="Caio", faixa_id=1, cpf=cpf)

    assert "CPF inválido" in str(erro.value)


def test_cpf_do_responsavel_e_validado_na_atualizacao():
    assert AlunoAtualizar(responsavel_cpf="52998224725").responsavel_cpf == "529.982.247-25"
    assert AlunoAtualizar().cpf is None

    with pytest.raises(ValidationError):
        AlunoAtualizar(responsavel_cpf="12345678901")
