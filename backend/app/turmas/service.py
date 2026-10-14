"""Regras do dominio das turmas."""

from . import repository
from .erros import ProfessorForaDoDojo, TurmaNaoEncontrada


def _validar_professor(dojo_id, professor_id, professor):
    if professor_id is None:
        return

    if professor is None or professor.dojo_id != dojo_id:
        raise ProfessorForaDoDojo(
            "O professor precisa estar vinculado ao mesmo dojo da turma"
        )


def listar(db):
    return repository.listar(db)


def buscar(db, turma_id):
    turma = repository.buscar(db, turma_id)
    if turma is None:
        raise TurmaNaoEncontrada(f"Turma {turma_id} nao esta cadastrada")
    return turma


def criar(db, dados, professor=None):
    _validar_professor(
        dados["dojo_id"],
        dados.get("professor_id"),
        professor,
    )
    return repository.criar(db, dados)


def atualizar(db, turma, mudancas, professor=None):
    dojo_id = mudancas.get("dojo_id", turma.dojo_id)
    professor_id = mudancas.get("professor_id", turma.professor_id)
    _validar_professor(dojo_id, professor_id, professor)
    return repository.atualizar(db, turma, mudancas)


def apagar(db, turma_id):
    turma = buscar(db, turma_id)
    repository.apagar(db, turma)
