"""As regras da biblioteca, e mais nada.

Este arquivo decide. Ele nao levanta erro de protocolo, nao monta consulta
e nao abre conexao: quem fala HTTP e o controller, quem fala SQL e o
repository. Um dia essas regras podem ser chamadas por um script de
importacao, sem requisicao nenhuma para responder -- e vao funcionar.

O `db` atravessa este arquivo sem ser aberto: o Service so o repassa para
o repository, que e quem sabe o que fazer com ele.
"""
from . import repository
from .erros import (
AlunoNaoEncontrado
)


def listar(db):
    return repository.listar(db)


def buscar(db, aluno_id):
    aluno = repository.buscar(db, aluno_id)
    if aluno is None:
        raise AlunoNaoEncontrado(f"Aluno {aluno_id} nao esta cadastrado")
    return aluno


def buscar_por_ids(db, aluno_ids):
    alunos = repository.buscar_por_ids(db, aluno_ids)
    if len(alunos) != len(set(aluno_ids)):
        raise AlunoNaoEncontrado("Um ou mais alunos nao estao cadastrados")
    return alunos


def criar(db, dados):
    return repository.criar(db, dados)

def atualizar(db, aluno_id, mudancas):
    aluno = buscar(db, aluno_id)
    return repository.atualizar(db, aluno, mudancas)

def apagar(db, aluno_id):
    aluno = buscar(db, aluno_id)
    repository.apagar(db, aluno)
