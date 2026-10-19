from datetime import date
from types import SimpleNamespace

import pytest

from app.alunos.models import Aluno
from app.alunos.erros import AlunoNaoEncontrado
from app.alunos import service as alunos_service
from app.atividades.facade import AtividadeFacade
from app.atividades.erros import TipoDeAtividadeDesconhecido
from app.atividades.politicas import (
    RelatorioEntregaKimono,
    RelatorioFactory,
    RelatorioFrequencia,
    RelatorioTrocaDeFaixa,
)


def test_factory_cria_estrategia_correta():
    assert isinstance(RelatorioFactory.criar("troca_de_faixa"), RelatorioTrocaDeFaixa)
    assert isinstance(RelatorioFactory.criar("entrega_de_kimono"), RelatorioEntregaKimono)
    assert isinstance(RelatorioFactory.criar("frequencia"), RelatorioFrequencia)


def test_factory_lanca_erro_para_tipo_desconhecido():
    with pytest.raises(TipoDeAtividadeDesconhecido):
        RelatorioFactory.criar("tipo_inexistente")


def test_aluno_calcula_idade_corretamente():
    hoje = date.today()
    aluno = Aluno(
        nome="Ana",
        cpf="12345678901",
        data_nascimento=hoje.replace(year=hoje.year - 10),
        faixa_id=1,
        turma="juvenil",
        tamanho_kimono="M",
        tamanho_faixa="M",
        codigo_zempo="ABC123",
    )

    assert aluno.idade == 10


def test_factory_gera_relatorio_para_varios_alunos():
    atividade = SimpleNamespace(
        tipo="troca_de_faixa",
        nova_faixa="azul",
        alunos=[
            SimpleNamespace(
                nome="Ana",
                faixa_obj=SimpleNamespace(nome="branca"),
                tamanho_faixa="M",
            ),
            SimpleNamespace(
                nome="Beto",
                faixa_obj=SimpleNamespace(nome="preta"),
                tamanho_faixa="L",
            ),
        ],
    )

    relatorio = RelatorioFactory.criar("troca_de_faixa").gerar(atividade)

    assert relatorio[0]["aluno"] == "Ana"
    assert relatorio[1]["nova_faixa"] == "azul"


def test_relatorio_de_frequencia_retorna_presenca_individual():
    atividade = SimpleNamespace(
        data=date(2026, 10, 19),
        aluno_ids_pagos=[7],
        alunos=[
            SimpleNamespace(id=7, nome="Ana"),
            SimpleNamespace(id=8, nome="Beto"),
        ],
    )

    relatorio = RelatorioFactory.criar("frequencia").gerar(atividade)

    assert relatorio == [
        {"aluno": "Ana", "presenca": True, "data": date(2026, 10, 19)},
        {"aluno": "Beto", "presenca": False, "data": date(2026, 10, 19)},
    ]


def test_buscar_alunos_por_ids_recusa_ids_inexistentes(monkeypatch):
    monkeypatch.setattr(
        alunos_service.repository,
        "buscar_por_ids",
        lambda db, dono_id, aluno_ids: [SimpleNamespace(id=aluno_ids[0])],
    )

    with pytest.raises(AlunoNaoEncontrado):
        alunos_service.buscar_por_ids(object(), SimpleNamespace(id=1), [1, 2])


def test_facade_cria_atividade_com_alunos_resolvidos():
    aluno = SimpleNamespace(id=7)
    chamada_alunos = {}
    chamada_atividade = {}

    def buscar_por_ids(db, usuario, aluno_ids):
        chamada_alunos["ids"] = aluno_ids
        return [aluno]

    def criar(db, usuario, dados):
        chamada_atividade["dados"] = dados
        return "atividade criada"

    facade = AtividadeFacade(
        atividades_service=SimpleNamespace(criar=criar),
        alunos_service=SimpleNamespace(buscar_por_ids=buscar_por_ids),
    )

    resultado = facade.criar(
        object(),
        object(),
        {"nome": "Treino", "aluno_ids": [7]},
    )

    assert resultado == "atividade criada"
    assert chamada_alunos["ids"] == [7]
    assert chamada_atividade["dados"] == {"nome": "Treino", "alunos": [aluno]}


def test_facade_atualiza_atividade_sem_consultar_alunos():
    chamada = {}

    def atualizar(db, usuario, atividade_id, mudancas):
        chamada["mudancas"] = mudancas
        return "atividade atualizada"

    def buscar_por_ids(db, usuario, aluno_ids):
        raise AssertionError("Nao deve consultar alunos sem aluno_ids")

    facade = AtividadeFacade(
        atividades_service=SimpleNamespace(atualizar=atualizar),
        alunos_service=SimpleNamespace(buscar_por_ids=buscar_por_ids),
    )

    resultado = facade.atualizar(
        object(),
        object(),
        3,
        {"nome": "Treino especial"},
    )

    assert resultado == "atividade atualizada"
    assert chamada["mudancas"] == {"nome": "Treino especial"}


def test_facade_atualiza_e_limpa_vinculos_quando_lista_vazia():
    chamada = {}

    def buscar_por_ids(db, usuario, aluno_ids):
        assert aluno_ids == []
        return []

    def atualizar(db, usuario, atividade_id, mudancas):
        chamada["mudancas"] = mudancas
        return "atividade atualizada"

    facade = AtividadeFacade(
        atividades_service=SimpleNamespace(atualizar=atualizar),
        alunos_service=SimpleNamespace(buscar_por_ids=buscar_por_ids),
    )

    facade.atualizar(
        object(),
        object(),
        3,
        {"aluno_ids": None},
    )

    assert chamada["mudancas"] == {"alunos": []}
