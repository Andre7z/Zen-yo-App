"""Estilos compartilhados pelos planilhas .xlsx das atividades."""
from io import BytesIO
import re

from openpyxl import load_workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

FINO = Side(style="thin", color="000000")
BORDA = Border(left=FINO, right=FINO, top=FINO, bottom=FINO)
AZUL = PatternFill("solid", fgColor="DDEBF7")
AMARELO = PatternFill("solid", fgColor="FFFF00")
NEGRITO = Font(name="Calibri", size=11, bold=True)
NORMAL = Font(name="Calibri", size=11)
CENTRO = Alignment(horizontal="center", vertical="center")
ESQUERDA = Alignment(horizontal="left", vertical="center")


def nomear_planilha(conteudo, nome):
    arquivo = load_workbook(BytesIO(conteudo))
    folha = arquivo.active
    nome = ILLEGAL_CHARACTERS_RE.sub("", nome)
    folha["A1"] = f"{folha['A1'].value} - {nome}"
    titulo = re.sub(r'[\\/*?:\[\]]', '-', nome).strip("'")[:31].strip("'")
    folha.title = titulo or "Planilha"
    saida = BytesIO()
    arquivo.save(saida)
    return saida.getvalue()
