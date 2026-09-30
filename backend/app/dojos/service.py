"""Regras do dominio dos dojos."""

from . import repository
from .erros import DojoNaoEncontrado


def listar(db):
    return repository.listar(db)


def buscar(db, dojo_id):
    dojo = repository.buscar(db, dojo_id)
    if dojo is None:
        raise DojoNaoEncontrado(f"Dojo {dojo_id} nao esta cadastrado")
    return dojo


def criar(db, dados):
    return repository.criar(db, dados)


def atualizar(db, dojo_id, mudancas):
    dojo = buscar(db, dojo_id)
    return repository.atualizar(db, dojo, mudancas)


def apagar(db, dojo_id):
    dojo = buscar(db, dojo_id)
    repository.apagar(db, dojo)
