"""Regras do dominio das turmas."""

from . import repository
from .erros import TurmaNaoEncontrada


def listar(db):
    return repository.listar(db)


def buscar(db, turma_id):
    turma = repository.buscar(db, turma_id)
    if turma is None:
        raise TurmaNaoEncontrada(f"Turma {turma_id} nao esta cadastrada")
    return turma


def criar(db, dados, professor=None):
    return repository.criar(db, dados)


def atualizar(db, turma, mudancas, professor=None):
    return repository.atualizar(db, turma, mudancas)


def apagar(db, turma_id):
    turma = buscar(db, turma_id)
    repository.apagar(db, turma)
