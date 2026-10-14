from types import SimpleNamespace

import pytest

from app.dojos.models import Dojo
from app.turmas.facade import TurmaFacade
from app.turmas.erros import ProfessorForaDoDojo
from app.turmas.models import Turma
from app.turmas import service as turmas_service


def test_dojo_cria_entidade():
    dojo = Dojo(nome="Academia Central", cidade="Curitiba")

    assert dojo.nome == "Academia Central"
    assert dojo.cidade == "Curitiba"


def test_turma_cria_entidade_com_relacao_dojo():
    dojo = Dojo(nome="Academia Central", cidade="Curitiba")
    turma = Turma(nome="Iniciantes A", dojo=dojo)

    assert turma.nome == "Iniciantes A"
    assert turma.dojo is dojo


def test_facade_cria_turma_resolvendo_professor():
    professor = SimpleNamespace(id=8, dojo_id=4)
    chamada = {}

    def buscar_professor(db, professor_id):
        chamada["professor_id"] = professor_id
        return professor

    def criar_turma(db, dados, professor_resolvido):
        chamada["professor"] = professor_resolvido
        chamada["dados"] = dados
        return "turma criada"

    facade = TurmaFacade(
        turmas_service=SimpleNamespace(criar=criar_turma),
        usuarios_service=SimpleNamespace(buscar=buscar_professor),
    )

    resultado = facade.criar(
        object(),
        {"nome": "Iniciantes A", "dojo_id": 4, "professor_id": 8},
    )

    assert resultado == "turma criada"
    assert chamada["professor_id"] == 8
    assert chamada["professor"] is professor
    assert chamada["dados"]["dojo_id"] == 4


def test_facade_atualiza_turma_resolvendo_professor_atual():
    turma = SimpleNamespace(id=3, dojo_id=4, professor_id=8)
    professor = SimpleNamespace(id=8, dojo_id=4)
    chamada = {}

    def atualizar_turma(db, turma_recebida, mudancas, professor_resolvido):
        chamada["turma"] = turma_recebida
        chamada["mudancas"] = mudancas
        chamada["professor"] = professor_resolvido
        return "turma atualizada"

    facade = TurmaFacade(
        turmas_service=SimpleNamespace(
            buscar=lambda db, turma_id: turma,
            atualizar=atualizar_turma,
        ),
        usuarios_service=SimpleNamespace(
            buscar=lambda db, professor_id: professor,
        ),
    )

    resultado = facade.atualizar(
        object(),
        3,
        {"nome": "Intermediarios"},
    )

    assert resultado == "turma atualizada"
    assert chamada["turma"] is turma
    assert chamada["mudancas"] == {"nome": "Intermediarios"}
    assert chamada["professor"] is professor


def test_servico_recusa_professor_de_outro_dojo():
    professor = SimpleNamespace(id=8, dojo_id=5)

    with pytest.raises(ProfessorForaDoDojo):
        turmas_service.criar(
            object(),
            {"nome": "Iniciantes A", "dojo_id": 4, "professor_id": 8},
            professor,
        )
