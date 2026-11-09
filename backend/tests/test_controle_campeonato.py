from io import BytesIO
from types import SimpleNamespace

from openpyxl import load_workbook

from app.alunos.models import Aluno
from app.atividades import controle_campeonato


def _aluno(nome, idade, peso, codigo, genero=None, id=None):
    return SimpleNamespace(id=id, nome=nome, idade=idade, peso=peso, codigo_zempo=codigo, genero=genero)


def test_linhas_trazem_nome_idade_genero_peso_e_codigo_zempo():
    planilha = controle_campeonato.gerar_planilha([_aluno("Ana", 12, 38.5, "ZP1", "Feminino", 1), _aluno("Beto", None, None, None, id=2)], {1})

    assert planilha["linhas"][0] == {"nome": "Ana", "idade": 12, "genero": "Feminino", "peso": 38.5, "codigo_zempo": "ZP1", "confirmado": True}
    assert planilha["linhas"][1]["codigo_zempo"] == ""
    assert planilha["linhas"][1]["genero"] == ""
    assert planilha["linhas"][1]["confirmado"] is False
    assert planilha["total_geral"] == 2


def test_xlsx_tem_as_seis_colunas():
    folha = load_workbook(BytesIO(controle_campeonato.gerar_xlsx([_aluno("Ana", 12, 38.5, "ZP1", "Feminino", 1)], {1}))).active

    assert folha["A1"].value == "CONTROLE DE CAMPEONATO"
    assert [c.value for c in folha[2]] == ["NOME", "IDADE", "GÊNERO", "PESO", "CÓDIGO ZEMPO", "CONFIRMADO"]
    assert [c.value for c in folha[3]] == ["ANA", 12, "FEMININO", 38.5, "ZP1", "SIM"]


def test_aluno_calcula_idade_pela_data_de_nascimento():
    assert Aluno(data_nascimento=None).idade is None
