"""Regras do dominio das turmas."""

from sqlalchemy.exc import IntegrityError

from ..alunos import service as alunos_service
from ..ordenacao import ordenar_alunos_por_nome
from . import repository
from .erros import ErroTurma, TurmaNaoEncontrada


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
    if not mudancas.get("nucleo", turma.nucleo):
        raise ErroTurma("Informe o núcleo da turma antes de salvar.")
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


def consultar_chamada(db, usuario, turma_id, data):
    turma = buscar(db, usuario, turma_id)
    chamada = repository.buscar_chamada(db, turma.id, data)
    if chamada is None:
        alunos = [{"aluno_id": aluno.id, "nome": aluno.nome, "presente": True}
                  for aluno in ordenar_alunos_por_nome(turma.alunos)]
    else:
        alunos = [{"aluno_id": p.aluno_id, "nome": p.aluno_nome, "presente": p.presente}
                  for p in sorted(chamada.presencas, key=lambda p: p.aluno_nome.casefold())]
    return {"data": data, "registrada": chamada is not None, "alunos": alunos}


def listar_datas_chamadas(db, usuario, turma_id):
    turma = buscar(db, usuario, turma_id)
    return repository.listar_datas_chamadas(db, turma.id)


def salvar_chamada(db, usuario, turma_id, data, alunos):
    turma = buscar(db, usuario, turma_id)
    chamada = repository.buscar_chamada(db, turma.id, data)
    ids_esperados = {p.aluno_id for p in chamada.presencas} if chamada else {a.id for a in turma.alunos}
    marcacoes = {aluno.aluno_id: aluno.presente for aluno in alunos}
    if not ids_esperados:
        raise ErroTurma("Nao ha alunos para registrar nesta chamada.")
    if len(marcacoes) != len(alunos) or set(marcacoes) != ids_esperados:
        raise ErroTurma("A lista de alunos mudou. Atualize a chamada e marque todos os alunos.")
    try:
        repository.salvar_chamada(db, turma, data, chamada, marcacoes)
    except IntegrityError as erro:
        db.rollback()
        if chamada is None and repository.buscar_chamada(db, turma_id, data) is not None:
            raise ErroTurma("Esta chamada ja foi registrada. Atualize antes de salvar.") from erro
        raise
    return consultar_chamada(db, usuario, turma_id, data)


def planilha_frequencia(db, usuario, turma_ids, ano, mes):
    from datetime import date
    from . import planilha_frequencia as planilha

    if len(turma_ids) != len(set(turma_ids)):
        raise ErroTurma("Selecione cada turma apenas uma vez.")
    inicio = date(ano, mes, 1)
    if ano == 9999 and mes == 12:
        raise ErroTurma("Mes fora do intervalo permitido.")
    fim = date(ano + (mes == 12), 1 if mes == 12 else mes + 1, 1)
    blocos = []
    for turma_id in turma_ids:
        turma = buscar(db, usuario, turma_id)
        blocos.append((turma, repository.listar_chamadas(db, turma.id, inicio, fim)))
    return planilha.gerar_xlsx(usuario.nome, ano, mes, blocos)
