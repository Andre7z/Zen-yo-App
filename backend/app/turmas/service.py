"""Regras do dominio das turmas."""

from ..alunos import service as alunos_service
from . import repository
from .erros import TurmaNaoEncontrada


def listar(db, usuario):
    return repository.listar(db, usuario.id)


def buscar(db, usuario, turma_id):
    turma = repository.buscar(db, turma_id)
    if turma is None or turma.dono_id != usuario.id:
        raise TurmaNaoEncontrada(f"Turma {turma_id} nao esta cadastrada")
    return turma


def criar(db, usuario, dados, professor=None):
    return repository.criar(db, {**dados, "dono_id": usuario.id})


def atualizar(db, turma, mudancas, professor=None):
    return repository.atualizar(db, turma, mudancas)


def apagar(db, usuario, turma_id):
    turma = buscar(db, usuario, turma_id)
    repository.apagar(db, turma)


def adicionar_alunos(db, usuario, turma_id, aluno_ids):
    turma = buscar(db, usuario, turma_id)
    alunos = alunos_service.buscar_por_ids(db, usuario, list(set(aluno_ids)))
    repository.adicionar_alunos(db, turma, alunos)


def remover_aluno(db, usuario, turma_id, aluno_id):
    turma = buscar(db, usuario, turma_id)
    aluno = alunos_service.buscar(db, usuario, aluno_id)
    repository.remover_aluno(db, turma, aluno)
