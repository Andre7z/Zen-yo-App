from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.alunos.models import Aluno
from app.atividades import controle_campeonato


def _aluno(nome, idade, peso, codigo):
    return SimpleNamespace(nome=nome, idade=idade, peso=peso, codigo_zempo=codigo)


def test_linhas_trazem_nome_idade_peso_e_codigo_zempo():
    relatorio = controle_campeonato.gerar_relatorio([_aluno("Ana", 12, 38.5, "ZP1"), _aluno("Beto", None, None, None)])

    assert relatorio["linhas"][0] == {"nome": "Ana", "idade": 12, "peso": 38.5, "codigo_zempo": "ZP1"}
    assert relatorio["linhas"][1]["codigo_zempo"] == ""
    assert relatorio["total_geral"] == 2


def test_xlsx_tem_as_quatro_colunas():
    folha = load_workbook(BytesIO(controle_campeonato.gerar_xlsx([_aluno("Ana", 12, 38.5, "ZP1")]))).active

    assert folha["A1"].value == "CONTROLE DE CAMPEONATO"
    assert [c.value for c in folha[2]] == ["NOME", "IDADE", "PESO", "CÓDIGO ZEMPO"]
    assert [c.value for c in folha[3]] == ["Ana", 12, 38.5, "ZP1"]


def test_aluno_calcula_idade_pela_data_de_nascimento():
    assert Aluno(data_nascimento=None).idade is None
