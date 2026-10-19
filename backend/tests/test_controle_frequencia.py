from datetime import date
from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.atividades import controle_frequencia


def _aluno(id, nome):
    return SimpleNamespace(id=id, nome=nome)


def _atividade():
    alunos = [_aluno(1, "Ana"), _aluno(2, "Beto"), _aluno(3, "Caio")]
    atividade = SimpleNamespace(data=date(2026, 10, 13), aluno_ids_pagos=[1, 3])
    return atividade, alunos


def test_quantidades_de_presentes_e_ausentes():
    atividade, alunos = _atividade()
    relatorio = controle_frequencia.gerar_relatorio(atividade, alunos)

    assert relatorio["linhas"][0]["presenca"] is True
    assert relatorio["linhas"][1]["presenca"] is False
    assert relatorio["quantidades"] == {"presentes": 2, "ausentes": 1, "total_geral": 3}


def test_xlsx_preserva_layout_da_tabela():
    atividade, alunos = _atividade()
    planilha = load_workbook(BytesIO(controle_frequencia.gerar_xlsx(atividade, alunos)))
    folha = planilha.active

    assert folha["A1"].value == "CONTROLE DE FREQUENCIA"
    assert [c.value for c in folha[2]] == ["NOME", "PRESENÇA", "DATA", "QUANTIDADES", "Total"]
    assert folha["A3"].value == "Ana"
    assert folha["B3"].value == "PRESENTE"
    assert folha["B4"].value == "AUSENTE"
    assert folha["C3"].value == "2026-10-13"
    assert folha["E3"].value == '=COUNTIF($B$3:$B$16,"PRESENTE")'
    assert folha["E5"].value == "=SUM(E3:E4)"
    assert folha["B3"].fill.fgColor.rgb.endswith("DDEBF7")
    assert folha["D3"].fill.fgColor.rgb.endswith("FFFF00")
