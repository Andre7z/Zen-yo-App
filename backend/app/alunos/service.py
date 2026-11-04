"""As regras da biblioteca, e mais nada.

Este arquivo decide. Ele nao levanta erro de protocolo, nao monta consulta
e nao abre conexao: quem fala HTTP e o controller, quem fala SQL e o
repository. Um dia essas regras podem ser chamadas por um script de
importacao, sem requisicao nenhuma para responder -- e vao funcionar.

O `db` atravessa este arquivo sem ser aberto: o Service so o repassa para
o repository, que e quem sabe o que fazer com ele.
"""
from ..faixas import service as faixas_service
from ..ordenacao import ordenar_alunos_por_nome
from ..responsaveis import service as responsaveis_service
from . import repository
from .erros import (
AlunoNaoEncontrado
)

_CAMPOS_RESPONSAVEL = {
    "responsavel_nome": "nome",
    "responsavel_cpf": "cpf",
    "responsavel_celular": "celular",
    "responsavel_parentesco": "parentesco",
}


def _validar_vinculos(db, usuario, dados):
    if dados.get("faixa_id") is not None:
        faixas_service.buscar(db, usuario, dados["faixa_id"])


def _separar_responsavel(dados):
    dados_aluno = dict(dados)
    dados_responsavel = {
        campo: dados_aluno.pop(campo)
        for campo in _CAMPOS_RESPONSAVEL
        if campo in dados_aluno
    }
    return dados_aluno, dados_responsavel


def listar(db, usuario):
    return ordenar_alunos_por_nome(repository.listar(db, usuario.id))


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
    dados_aluno, dados_responsavel = _separar_responsavel(dados)
    aluno = repository.criar(db, {**dados_aluno, "dono_id": usuario.id})
    responsaveis_service.criar(db, aluno, dados_responsavel)
    return repository.salvar(db, aluno)

def atualizar(db, usuario, aluno_id, mudancas):
    aluno = buscar(db, usuario, aluno_id)
    _validar_vinculos(db, usuario, mudancas)
    mudancas_aluno, mudancas_responsavel = _separar_responsavel(mudancas)
    repository.atualizar(db, aluno, mudancas_aluno)
    responsaveis_service.atualizar(db, aluno, mudancas_responsavel)
    return repository.salvar(db, aluno)

def apagar(db, usuario, aluno_id):
    aluno = buscar(db, usuario, aluno_id)
    repository.apagar(db, aluno)
    repository.confirmar(db)
