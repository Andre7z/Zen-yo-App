from datetime import date
from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.atividades import (
    controle_campeonato,
    controle_faixas,
    controle_frequencia,
    controle_kimonos,
)


def _alunos():
    return [
        SimpleNamespace(
            id=1,
            nome="Zeca",
            idade=30,
            genero="Masculino",
            peso=80,
            codigo_zempo="Z1",
            tamanho_kimono="A2",
            tamanho_faixa="M",
            faixa_grossa=False,
            proxima_faixa=None,
            faixa_obj=SimpleNamespace(nome="Branca"),
        ),
        SimpleNamespace(
            id=2,
            nome="Álvaro",
            idade=20,
            genero="Masculino",
            peso=70,
            codigo_zempo="A1",
            tamanho_kimono="A1",
            tamanho_faixa="P",
            faixa_grossa=False,
            proxima_faixa=None,
            faixa_obj=SimpleNamespace(nome="Branca"),
        ),
    ]


def _nomes_da_planilha(conteudo):
    folha = load_workbook(BytesIO(conteudo)).active
    return [folha.cell(row, 1).value for row in range(3, 5)]


def test_dados_e_planilhas_ordenam_alunos_por_nome():
    alunos = _alunos()
    atividade = SimpleNamespace(data=date(2026, 11, 2), aluno_ids_pagos=[], nova_faixa=None)

    planilhas = [
        (controle_frequencia.gerar_planilha(atividade, alunos), controle_frequencia.gerar_xlsx(atividade, alunos)),
        (controle_campeonato.gerar_planilha(alunos), controle_campeonato.gerar_xlsx(alunos)),
        (controle_faixas.gerar_planilha(atividade, alunos), controle_faixas.gerar_xlsx(atividade, alunos)),
        (controle_kimonos.gerar_planilha(alunos), controle_kimonos.gerar_xlsx(alunos)),
    ]

    for dados, planilha in planilhas:
        assert [linha["nome"] for linha in dados["linhas"]] == ["Álvaro", "Zeca"]
        assert _nomes_da_planilha(planilha) == ["Álvaro", "Zeca"]
