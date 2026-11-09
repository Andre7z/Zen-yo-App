from datetime import date
from io import BytesIO

from openpyxl import Workbook, load_workbook

from app.planilhas_xlsx import textos_em_maiusculas


def test_textos_em_maiusculas_preserva_formulas_tipos_e_valores():
    arquivo = Workbook()
    folha = arquivo.active
    folha.title = "FREQUÊNCIA"
    folha["A1"] = "João da Silva"
    folha["A2"] = '=IF(A1="João",1,0)'
    folha["A3"] = 42
    folha["A4"] = date(2026, 11, 3)
    folha["A5"] = "=texto"
    folha["A5"].data_type = "s"

    textos_em_maiusculas(arquivo)
    saida = BytesIO()
    arquivo.save(saida)
    folha = load_workbook(BytesIO(saida.getvalue())).active

    assert folha.title == "FREQUÊNCIA"
    assert folha["A1"].value == "JOÃO DA SILVA"
    assert folha["A2"].value == '=IF(A1="João",1,0)'
    assert folha["A2"].data_type == "f"
    assert folha["A3"].value == 42
    assert folha["A4"].value.date() == date(2026, 11, 3)
    assert folha["A5"].value == "=TEXTO"
    assert folha["A5"].data_type == "s"
