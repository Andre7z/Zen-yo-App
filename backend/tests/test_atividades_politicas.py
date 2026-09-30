from datetime import date
from types import SimpleNamespace

import pytest

from app.alunos.models import Aluno
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
