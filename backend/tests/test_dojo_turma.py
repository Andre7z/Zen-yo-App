from app.turmas.models import Turma
from app.turmas.schemas import TurmaEntrada


def test_turma_sem_dependencia_de_dojo():
    turma = Turma(nome="Iniciantes A")
    entrada = TurmaEntrada(nome="Iniciantes B")

    assert turma.nome == "Iniciantes A"
    assert entrada.nome == "Iniciantes B"
