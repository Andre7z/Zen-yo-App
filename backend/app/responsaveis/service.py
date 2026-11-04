from . import repository
from .erros import ResponsavelNaoEncontrado, ResponsavelSemDados
from .schemas import ResponsavelDados

_CAMPOS_API = {
    "responsavel_nome": "nome",
    "responsavel_cpf": "cpf",
    "responsavel_celular": "celular",
    "responsavel_parentesco": "parentesco",
}


def _normalizar_dados(dados):
    dados_responsavel = {
        _CAMPOS_API[campo]: valor
        for campo, valor in dados.items()
        if campo in _CAMPOS_API
    }
    return ResponsavelDados(**dados_responsavel).model_dump(exclude_unset=True)


def criar(db, aluno, dados):
    dados_responsavel = _normalizar_dados(dados)
    if any(valor is not None for valor in dados_responsavel.values()):
        repository.criar(db, aluno, dados_responsavel)


def atualizar(db, aluno, mudancas):
    dados_responsavel = _normalizar_dados(mudancas)
    if not dados_responsavel:
        return

    responsavel = repository.buscar_por_aluno(db, aluno.id)
    if responsavel is None:
        if any(valor is not None for valor in dados_responsavel.values()):
            repository.criar(db, aluno, dados_responsavel)
        return

    valores_atualizados = {
        "nome": responsavel.nome,
        "cpf": responsavel.cpf,
        "celular": responsavel.celular,
        "parentesco": responsavel.parentesco,
        **dados_responsavel,
    }
    if all(valor is None for valor in valores_atualizados.values()):
        repository.apagar(db, responsavel)
        aluno.responsavel = None
        return

    repository.atualizar(db, responsavel, dados_responsavel)


def buscar(db, aluno):
    responsavel = repository.buscar_por_aluno(db, aluno.id)
    if responsavel is None:
        raise ResponsavelNaoEncontrado(
            f"Aluno {aluno.id} nao tem responsavel cadastrado"
        )
    return responsavel


def salvar(db, aluno, dados):
    if all(valor is None for valor in dados.values()):
        raise ResponsavelSemDados("Informe ao menos um dado do responsavel")
    atualizar(db, aluno, {f"responsavel_{campo}": valor for campo, valor in dados.items()})
    repository.confirmar(db)
    return buscar(db, aluno)


def apagar(db, aluno):
    responsavel = buscar(db, aluno)
    repository.apagar(db, responsavel)
    aluno.responsavel = None
    repository.confirmar(db)
