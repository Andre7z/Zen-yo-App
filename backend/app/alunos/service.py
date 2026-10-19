"""As regras da biblioteca, e mais nada.

Este arquivo decide. Ele nao levanta erro de protocolo, nao monta consulta
e nao abre conexao: quem fala HTTP e o controller, quem fala SQL e o
repository. Um dia essas regras podem ser chamadas por um script de
importacao, sem requisicao nenhuma para responder -- e vao funcionar.

O `db` atravessa este arquivo sem ser aberto: o Service so o repassa para
o repository, que e quem sabe o que fazer com ele.
"""
from ..faixas import service as faixas_service
from ..turmas import service as turmas_service
from . import repository
from .erros import (
AlunoNaoEncontrado
)


def _validar_vinculos(db, usuario, dados):
    # Faixa e turma tambem precisam ser do proprio usuario.
    if dados.get("faixa_id") is not None:
        faixas_service.buscar(db, usuario, dados["faixa_id"])
    if dados.get("turma_id") is not None:
        turmas_service.buscar(db, usuario, dados["turma_id"])


def listar(db, usuario):
    return repository.listar(db, usuario.id)


def buscar(db, usuario, aluno_id):
    aluno = repository.buscar(db, aluno_id)
    if aluno is None or aluno.dono_id != usuario.id:
        raise AlunoNaoEncontrado(f"Aluno {aluno_id} nao esta cadastrado")
    return aluno


def buscar_por_ids(db, usuario, aluno_ids):
    alunos = repository.buscar_por_ids(db, usuario.id, aluno_ids)
    if len(alunos) != len(set(aluno_ids)):
        raise AlunoNaoEncontrado("Um ou mais alunos nao estao cadastrados")
    return alunos


def criar(db, usuario, dados):
    _validar_vinculos(db, usuario, dados)
    return repository.criar(db, {**dados, "dono_id": usuario.id})

def atualizar(db, usuario, aluno_id, mudancas):
    aluno = buscar(db, usuario, aluno_id)
    _validar_vinculos(db, usuario, mudancas)
    return repository.atualizar(db, aluno, mudancas)

def apagar(db, usuario, aluno_id):
    aluno = buscar(db, usuario, aluno_id)
    repository.apagar(db, aluno)
