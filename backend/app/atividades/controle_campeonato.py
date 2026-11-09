"""Planilha "CONTROLE DE CAMPEONATO" da atividade de campeonato.

Monta as linhas (nome, idade, genero, peso, codigo zempo) e gera a planilha .xlsx
no mesmo estilo dos demais planilhas de atividade.
"""
from io import BytesIO

from openpyxl import Workbook
from openpyxl.utils import get_column_letter

from ..ordenacao import ordenar_alunos_por_nome
from ..planilhas_xlsx import textos_em_maiusculas
from ._estilo_xlsx import AZUL, BORDA, CENTRO, ESQUERDA, NEGRITO, NORMAL

TITULO = "CONTROLE DE CAMPEONATO"
LINHAS_MINIMAS = 14


def montar_linhas(alunos, confirmados=()):
    return [
        {
            "nome": aluno.nome,
            "idade": getattr(aluno, "idade", None),
            "genero": getattr(aluno, "genero", None) or "",
            "peso": getattr(aluno, "peso", None),
            "codigo_zempo": getattr(aluno, "codigo_zempo", None) or "",
            "confirmado": getattr(aluno, "id", None) in confirmados,
        }
        for aluno in ordenar_alunos_por_nome(alunos)
    ]


def gerar_planilha(alunos, confirmados=()):
    linhas = montar_linhas(alunos, confirmados)
    return {"titulo": TITULO, "linhas": linhas, "total_geral": len(linhas)}


def gerar_xlsx(alunos, confirmados=()):
    linhas = montar_linhas(alunos, confirmados)
    ultima_lista = 2 + max(len(linhas), LINHAS_MINIMAS)

    planilha = Workbook()
    folha = planilha.active
    folha.title = "CONTROLE DE CAMPEONATO"

    colunas_totais = 6
    folha.merge_cells(f"A1:{get_column_letter(colunas_totais)}1")
    folha["A1"] = TITULO
    folha["A1"].font = NEGRITO
    folha["A1"].alignment = CENTRO
    for coluna in range(1, colunas_totais + 1):
        folha.cell(row=1, column=coluna).border = BORDA

    for indice, texto in enumerate(["NOME", "IDADE", "GÊNERO", "PESO", "CÓDIGO ZEMPO", "CONFIRMADO"], start=1):
        celula = folha.cell(row=2, column=indice, value=texto)
        celula.font = NEGRITO
        celula.alignment = CENTRO
        celula.border = BORDA

    for numero in range(3, ultima_lista + 1):
        for coluna in range(1, colunas_totais + 1):
            celula = folha.cell(row=numero, column=coluna)
            celula.border = BORDA
            celula.font = NORMAL
            celula.alignment = ESQUERDA if coluna == 1 else CENTRO
            if coluna > 1:
                celula.fill = AZUL
    for indice, linha in enumerate(linhas):
        numero = 3 + indice
        folha.cell(row=numero, column=1, value=linha["nome"])
        folha.cell(row=numero, column=2, value=linha["idade"])
        folha.cell(row=numero, column=3, value=linha["genero"] or None)
        folha.cell(row=numero, column=4, value=linha["peso"])
        folha.cell(row=numero, column=5, value=linha["codigo_zempo"] or None)
        folha.cell(row=numero, column=6, value="SIM" if linha["confirmado"] else "NÃO")

    larguras = {1: 42, 2: 10, 3: 14, 4: 12, 5: 20, 6: 14}
    for coluna, largura in larguras.items():
        folha.column_dimensions[get_column_letter(coluna)].width = largura

    textos_em_maiusculas(planilha)
    saida = BytesIO()
    planilha.save(saida)
    return saida.getvalue()
