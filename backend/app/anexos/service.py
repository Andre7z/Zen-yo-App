"""Regras do dominio dos anexos."""

from . import repository
from .erros import AnexoNaoEncontrado, AnexoSemConteudo


def _exigir_arquivo_ou_link(arquivo_url, link):
    if not (arquivo_url or "").strip() and not (link or "").strip():
        raise AnexoSemConteudo("Informe um arquivo ou um link externo.")


def listar(db, usuario):
    return repository.listar(db, usuario.id)


def buscar(db, usuario, anexo_id):
    anexo = repository.buscar(db, anexo_id)
    if anexo is None or anexo.dono_id != usuario.id:
        raise AnexoNaoEncontrado(f"Anexo {anexo_id} nao esta cadastrado")
    return anexo


def buscar_por_url(db, usuario, arquivo_url):
    anexo = repository.buscar_por_url(db, usuario.id, arquivo_url)
    if anexo is None:
        raise AnexoNaoEncontrado("Arquivo nao encontrado")
    return anexo


def criar(db, usuario, dados):
    _exigir_arquivo_ou_link(dados.get("arquivo_url"), dados.get("link"))
    return repository.criar(db, {**dados, "dono_id": usuario.id})


def atualizar(db, usuario, anexo_id, mudancas):
    anexo = buscar(db, usuario, anexo_id)
    _exigir_arquivo_ou_link(
        mudancas.get("arquivo_url", anexo.arquivo_url),
        mudancas.get("link", anexo.link),
    )
    return repository.atualizar(db, anexo, mudancas)


def apagar(db, usuario, anexo_id):
    anexo = buscar(db, usuario, anexo_id)
    repository.apagar(db, anexo)
    return anexo
