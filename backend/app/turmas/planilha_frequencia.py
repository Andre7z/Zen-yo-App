from io import BytesIO
from types import SimpleNamespace

from openpyxl import Workbook
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

from ..atividades._estilo_xlsx import BORDA, CENTRO, ESQUERDA, NEGRITO
from ..ordenacao import ordenar_alunos_por_nome
from ..nomes import primeiro_e_ultimo_nome
from ..planilhas_xlsx import textos_em_maiusculas

MESES = ("JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
         "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO")


def texto_seguro(valor):
    valor = ILLEGAL_CHARACTERS_RE.sub("", valor)
    return "'" + valor if valor.startswith(("=", "+", "-", "@")) else valor


def gerar_xlsx(sensei, ano, mes, blocos):
    arquivo = Workbook()
    folha = arquivo.active
    folha.title = "FREQUÊNCIA"
    maior = max([2 + len(chamadas) for _, chamadas in blocos] + [3])
    folha.merge_cells(start_row=1, start_column=1, end_row=1, end_column=maior)
    titulo_geral = texto_seguro(f"FREQUÊNCIA DE {MESES[mes - 1]} {ano} - SENSEI {primeiro_e_ultimo_nome(sensei).upper()}")
    folha.cell(1, 1, titulo_geral)
    folha.cell(1, 1).font = NEGRITO
    folha.cell(1, 1).alignment = CENTRO
    folha.column_dimensions["A"].width = 9
    folha.column_dimensions["B"].width = 38
    linha = 3
    for turma, chamadas in blocos:
        fim = 2 + len(chamadas)
        titulo = f"{turma.nucleo} - {turma.nome}" if turma.nucleo else turma.nome
        folha.cell(linha, 1, texto_seguro(titulo.upper())).border = BORDA
        folha.merge_cells(start_row=linha, start_column=1, end_row=linha, end_column=fim)
        folha.cell(linha, 1).font = NEGRITO
        folha.cell(linha, 1).alignment = ESQUERDA
        linha += 1
        for coluna, valor in enumerate(["ORDEM", "NOME"] + [c.data.day for c in chamadas], 1):
            celula = folha.cell(linha, coluna, valor)
            celula.font, celula.border, celula.alignment = NEGRITO, BORDA, CENTRO
            if coluna > 2:
                folha.column_dimensions[get_column_letter(coluna)].width = 10
        nomes = {a.id: a.nome for a in turma.alunos}
        for chamada in chamadas:
            for presenca in chamada.presencas:
                nomes.setdefault(presenca.aluno_id, presenca.aluno_nome)
        alunos = ordenar_alunos_por_nome([SimpleNamespace(id=ident, nome=nome) for ident, nome in nomes.items()])
        por_dia = [{p.aluno_id: p.presente for p in chamada.presencas} for chamada in chamadas]
        for ordem, aluno in enumerate(alunos, 1):
            linha += 1
            valores = [ordem, texto_seguro(aluno.nome)] + [
                "-" if aluno.id not in dia else "V" if dia[aluno.id] else "X"
                for dia in por_dia
            ]
            for coluna, valor in enumerate(valores, 1):
                celula = folha.cell(linha, coluna, valor)
                celula.border = BORDA
                celula.alignment = ESQUERDA if coluna == 2 else CENTRO
                if coluna > 2 and valor in ("V", "X"):
                    celula.font = Font(name="Calibri", bold=True, color="008000" if valor == "V" else "FF0000")
        linha += 3
    textos_em_maiusculas(arquivo)
    saida = BytesIO()
    arquivo.save(saida)
    return saida.getvalue()
