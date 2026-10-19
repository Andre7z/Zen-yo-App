from app.faixas.models import Faixa
from app.faixas.schemas import FaixaEntrada


def test_faixa_aceita_tipo_kyu_e_dan():
    faixa_kyu = FaixaEntrada(nome="Azul", tipo="Kyu", grau=4)
    faixa_dan = FaixaEntrada(nome="Preta", tipo="Dan", grau=9)

    assert faixa_kyu.tipo == "Kyu"
    assert faixa_dan.tipo == "Dan"


def test_faixa_model_cria_entidade():
    faixa = Faixa(nome="Branca", tipo="Kyu", ordem=1)

    assert faixa.nome == "Branca"
    assert faixa.tipo == "Kyu"
    assert faixa.ordem == 1
