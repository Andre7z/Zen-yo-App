"""Planilha "CONTROLE DE ENTREGA DE JUDOGIS" da atividade de entrega de judogi.

Monta as linhas (nome, turma, tamanho, confirmado), a tabela de quantidades por turma e
tamanho e a planilha .xlsx no mesmo layout do controle de faixas.
"""
from io import BytesIO

from openpyxl import Workbook
from openpyxl.utils import get_column_letter

from ..ordenacao import ordenar_alunos_por_nome
from ..planilhas_xlsx import textos_em_maiusculas
from ._estilo_xlsx import AMARELO, AZUL, BORDA, CENTRO, ESQUERDA, NEGRITO, NORMAL

TITULO = "CONTROLE DE ENTREGA DE JUDOGIS"
TAMANHOS_PADRAO = ["M00", "M0", "M1", "M2", "M3", "A0", "A1", "A2", "A4", "A5"]
SEM_TURMA = "SEM TURMA"
LINHAS_MINIMAS = 14


def normalizar_turma(texto):
    return str(texto).strip().upper() if texto else SEM_TURMA


def normalizar_tamanho(texto):
    return str(texto).strip().upper() if texto else ""


def _nome_turmas(aluno):
    nomes = [turma.nome for turma in getattr(aluno, "turmas", [])]
    return ", ".join(sorted(nomes)) if nomes else getattr(aluno, "turma", None)


def montar_linhas(alunos, confirmados=()):
    return [
        {
            "nome": aluno.nome,
            "turma": normalizar_turma(_nome_turmas(aluno)),
            "tamanho": normalizar_tamanho(getattr(aluno, "tamanho_kimono", None)),
            "confirmado": getattr(aluno, "id", None) in confirmados,
        }
        for aluno in ordenar_alunos_por_nome(alunos)
    ]


def calcular_quantidades(linhas, tamanhos=None):
    TAMANHOS = tamanhos or TAMANHOS_PADRAO
    turmas = sorted({linha["turma"] for linha in linhas}) or [SEM_TURMA]
    matriz = {turma: {tamanho: 0 for tamanho in TAMANHOS} for turma in turmas}
    for linha in linhas:
        if linha["turma"] in matriz and linha["tamanho"] in TAMANHOS:
            matriz[linha["turma"]][linha["tamanho"]] += 1
    por_turma = [
        {
            "turma": turma,
            "tamanhos": [matriz[turma][t] for t in TAMANHOS],
            "total": sum(matriz[turma].values()),
        }
        for turma in turmas
    ]
    totais = [sum(matriz[t][tam] for t in turmas) for tam in TAMANHOS]
    return {
        "tamanhos": TAMANHOS,
        "turmas": por_turma,
        "totais": totais,
        "total_geral": sum(totais),
    }


def gerar_planilha(alunos, tamanhos=None, confirmados=()):
    linhas = montar_linhas(alunos, confirmados)
    return {"titulo": TITULO, "linhas": linhas, "quantidades": calcular_quantidades(linhas, tamanhos)}


def gerar_xlsx(alunos, tamanhos=None, confirmados=()):
    TAMANHOS = tamanhos or TAMANHOS_PADRAO
    linhas = montar_linhas(alunos, confirmados)
    quantidades = calcular_quantidades(linhas, TAMANHOS)
    turmas = quantidades["turmas"]
    ultima_lista = 2 + max(len(linhas), LINHAS_MINIMAS)
    total_linha = 3 + len(turmas)

    planilha = Workbook()
    folha = planilha.active
    folha.title = "CONTROLE DE JUDOGIS"

    colunas_totais = 5 + len(TAMANHOS) + 1
    ultima_coluna = get_column_letter(colunas_totais)
    folha.merge_cells(f"A1:{ultima_coluna}1")
    folha["A1"] = TITULO
    folha["A1"].font = NEGRITO
    folha["A1"].alignment = CENTRO
    for coluna in range(1, colunas_totais + 1):
        folha.cell(row=1, column=coluna).border = BORDA

    cabecalhos = ["NOME", "TURMA", "TAMANHO", "CONFIRMADO", "QUANTIDADES", *TAMANHOS, "Total"]
    for indice, texto in enumerate(cabecalhos, start=1):
        celula = folha.cell(row=2, column=indice, value=texto)
        celula.font = NEGRITO
        celula.alignment = CENTRO
        celula.border = BORDA

    for numero in range(3, ultima_lista + 1):
        for coluna in range(1, 5):
            celula = folha.cell(row=numero, column=coluna)
            celula.border = BORDA
            celula.font = NORMAL
            celula.alignment = ESQUERDA if coluna == 1 else CENTRO
            if coluna in (2, 3):
                celula.fill = AZUL
    for indice, linha in enumerate(linhas):
        numero = 3 + indice
        folha.cell(row=numero, column=1, value=linha["nome"])
        folha.cell(row=numero, column=2, value=linha["turma"] or None)
        folha.cell(row=numero, column=3, value=linha["tamanho"] or None)
        folha.cell(row=numero, column=4, value="SIM" if linha["confirmado"] else "NÃO")

    intervalo_turma = f"$B$3:$B${ultima_lista}"
    intervalo_tamanho = f"$C$3:$C${ultima_lista}"
    for indice, resumo in enumerate(turmas):
        numero = 3 + indice
        folha.cell(row=numero, column=5, value=resumo["turma"])
        for posicao, tamanho in enumerate(TAMANHOS):
            coluna = 6 + posicao
            folha.cell(
                row=numero,
                column=coluna,
                value=f'=COUNTIFS({intervalo_turma},$E{numero},{intervalo_tamanho},{get_column_letter(coluna)}$2)',
            )
        primeira, ultima = get_column_letter(6), get_column_letter(5 + len(TAMANHOS))
        folha.cell(row=numero, column=colunas_totais, value=f"=SUM({primeira}{numero}:{ultima}{numero})")

    folha.cell(row=total_linha, column=5, value="TOTAL:")
    for coluna in range(6, colunas_totais + 1):
        letra = get_column_letter(coluna)
        folha.cell(row=total_linha, column=coluna, value=f"=SUM({letra}3:{letra}{total_linha - 1})")

    for numero in range(3, total_linha + 1):
        for coluna in range(5, colunas_totais + 1):
            celula = folha.cell(row=numero, column=coluna)
            celula.fill = AMARELO
            celula.border = BORDA
            celula.font = NEGRITO if numero == total_linha else NORMAL
            celula.alignment = ESQUERDA if coluna == 5 else CENTRO

    larguras = {1: 42, 2: 28, 3: 14, 4: 14, 5: 32}
    for coluna in range(1, colunas_totais + 1):
        folha.column_dimensions[get_column_letter(coluna)].width = larguras.get(coluna, 9)

    textos_em_maiusculas(planilha)
    saida = BytesIO()
    planilha.save(saida)
    return saida.getvalue()
