from datetime import date

from app.anexos.models import Anexo
from app.anexos.schemas import AnexoEntrada, AnexoPublico


def test_anexo_aceita_categoria_valida():
    dados = AnexoEntrada(
        titulo="Regulamento 2026",
        categoria="Regulamento",
        descricao="Documento oficial",
        nome_arquivo="regulamento.pdf",
        arquivo_url="https://cdn.exemplo.com/regulamento.pdf",
        link="https://example.com/regulamento",
    )

    assert dados.categoria == "Regulamento"
    assert dados.titulo == "Regulamento 2026"


def test_anexo_model_cria_instancia_com_data():
    anexo = Anexo(
        id=1,
        titulo="Autorização",
        categoria="Autorização",
        descricao="Autorização da academia",
        nome_arquivo="autorizacao.pdf",
        arquivo_url="https://cdn.exemplo.com/autorizacao.pdf",
        link="https://example.com/autorizacao",
        criado_em=date.today(),
    )

    assert anexo.categoria == "Autorização"
    assert anexo.nome_arquivo == "autorizacao.pdf"
    assert isinstance(AnexoPublico.model_validate(anexo).criado_em, date)
