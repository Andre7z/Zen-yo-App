from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.atividades import controle_kimonos


def _aluno(nome, turma, tamanho):
    return SimpleNamespace(nome=nome, turma=turma, tamanho_kimono=tamanho)


def _alunos():
    return [
        _aluno("Ana", "Infantil", "pp"),
        _aluno("Beto", "Infantil", "PP"),
        _aluno("Caio", "Adultos", "M"),
        _aluno("Duda", None, None),
    ]


def test_quantidades_por_turma_e_tamanho_com_totais():
    relatorio = controle_kimonos.gerar_relatorio(_alunos())
    quantidades = relatorio["quantidades"]
    por_turma = {t["turma"]: t for t in quantidades["turmas"]}

    assert relatorio["linhas"][3]["turma"] == "SEM TURMA"
    assert por_turma["INFANTIL"]["tamanhos"][0] == 2
    assert por_turma["INFANTIL"]["total"] == 2
    assert por_turma["ADULTOS"]["tamanhos"][3] == 1
    assert quantidades["total_geral"] == 3


def test_xlsx_preserva_layout_da_tabela():
    planilha = load_workbook(BytesIO(controle_kimonos.gerar_xlsx(_alunos())))
    folha = planilha.active

    assert folha["A1"].value == "CONTROLE DE ENTREGA DE KIMONOS"
    assert [c.value for c in folha[2]] == [
        "NOME", "TURMA", "TAMANHO", "QUANTIDADES", "PP", "P", "N2", "M", "G", "N4", "GG", "Total",
    ]
    assert folha["A3"].value == "Ana"
    assert folha["E3"].value.startswith("=COUNTIFS(")
    assert folha["B3"].fill.fgColor.rgb.endswith("DDEBF7")
    assert folha["D3"].fill.fgColor.rgb.endswith("FFFF00")
    assert folha["D3"].border.left.style == "thin"
