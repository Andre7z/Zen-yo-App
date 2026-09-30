from app.dojos.models import Dojo
from app.turmas.models import Turma


def test_dojo_cria_entidade():
    dojo = Dojo(nome="Academia Central", cidade="Curitiba")

    assert dojo.nome == "Academia Central"
    assert dojo.cidade == "Curitiba"


def test_turma_cria_entidade_com_relacao_dojo():
    dojo = Dojo(nome="Academia Central", cidade="Curitiba")
    turma = Turma(nome="Iniciantes A", dojo=dojo)

    assert turma.nome == "Iniciantes A"
    assert turma.dojo is dojo
