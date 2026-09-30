"""Regras do dominio das turmas."""

from . import repository
from ..usuarios.models import Usuario
from .erros import ProfessorForaDoDojo, TurmaNaoEncontrada


def _validar_professor(db, dojo_id, professor_id):
    if professor_id is None:
        return

    professor = db.query(Usuario).filter(Usuario.id == professor_id).first()
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


def criar(db, dados):
    _validar_professor(db, dados["dojo_id"], dados.get("professor_id"))
    return repository.criar(db, dados)


def atualizar(db, turma_id, mudancas):
    turma = buscar(db, turma_id)
    dojo_id = mudancas.get("dojo_id", turma.dojo_id)
    professor_id = mudancas.get("professor_id", turma.professor_id)
    _validar_professor(db, dojo_id, professor_id)
    return repository.atualizar(db, turma, mudancas)


def apagar(db, turma_id):
    turma = buscar(db, turma_id)
    repository.apagar(db, turma)
