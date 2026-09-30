"""Regras do dominio das faixas."""

from . import repository
from .erros import FaixaNaoEncontrada


def listar(db):
    return repository.listar(db)


def buscar(db, faixa_id):
    faixa = repository.buscar(db, faixa_id)
    if faixa is None:
        raise FaixaNaoEncontrada(f"Faixa {faixa_id} nao esta cadastrada")
    return faixa


def criar(db, dados):
    nome = dados["nome"]
    if repository.buscar_por_nome(db, nome):
        raise FaixaNaoEncontrada(f"Ja existe uma faixa com o nome {nome}")
    return repository.criar(db, dados)


def atualizar(db, faixa_id, mudancas):
    faixa = buscar(db, faixa_id)
    return repository.atualizar(db, faixa, mudancas)


def apagar(db, faixa_id):
    faixa = buscar(db, faixa_id)
    repository.apagar(db, faixa)
