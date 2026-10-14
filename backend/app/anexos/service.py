"""Regras do dominio dos anexos."""

from . import repository
from .erros import AnexoNaoEncontrado


def listar(db, usuario):
    return repository.listar(db, usuario.id)


def buscar(db, usuario, anexo_id):
    anexo = repository.buscar(db, anexo_id)
    if anexo is None or anexo.dono_id != usuario.id:
        raise AnexoNaoEncontrado(f"Anexo {anexo_id} nao esta cadastrado")
    return anexo


def criar(db, usuario, dados):
    return repository.criar(db, {**dados, "dono_id": usuario.id})


def atualizar(db, usuario, anexo_id, mudancas):
    anexo = buscar(db, usuario, anexo_id)
    return repository.atualizar(db, anexo, mudancas)


def apagar(db, usuario, anexo_id):
    anexo = buscar(db, usuario, anexo_id)
    repository.apagar(db, anexo)
