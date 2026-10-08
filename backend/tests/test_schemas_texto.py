from datetime import date

import pytest
from pydantic import ValidationError

from app.atividades.schemas import AtividadeAtualizar, AtividadeEntrada
from app.anexos.schemas import AnexoAtualizar, AnexoEntrada
from app.dojos.schemas import DojoAtualizar, DojoEntrada
from app.faixas.schemas import FaixaAtualizar, FaixaEntrada
from app.turmas.schemas import TurmaAtualizar, TurmaEntrada


def test_schemas_normalizam_textos_de_entrada():
    atividade = AtividadeEntrada(
        tipo=" frequência ",
        nome=" Treino aberto ",
        data=date(2026, 10, 8),
        local=" Tatame principal ",
        descricao=" Aula conjunta ",
    )
    anexo = AnexoEntrada(
        titulo=" Regulamento ",
        categoria=" Regulamento ",
        descricao=" Documento oficial ",
        nome_arquivo=" regulamento.pdf ",
        arquivo_url=" https://cdn.exemplo.com/regulamento.pdf ",
        link=" https://exemplo.com/regulamento ",
    )
    dojo = DojoEntrada(nome=" Academia Central ", cidade=" Curitiba ")
    faixa = FaixaEntrada(nome=" Azul ", tipo=" Kyu ", ordem=4)
    turma = TurmaEntrada(nome=" Adultos ", dojo_id=3)

    assert (atividade.tipo, atividade.nome, atividade.local, atividade.descricao) == (
        "frequência",
        "Treino aberto",
        "Tatame principal",
        "Aula conjunta",
    )
    assert (anexo.titulo, anexo.categoria, anexo.descricao) == (
        "Regulamento",
        "Regulamento",
        "Documento oficial",
    )
    assert anexo.nome_arquivo == "regulamento.pdf"
    assert anexo.arquivo_url == "https://cdn.exemplo.com/regulamento.pdf"
    assert anexo.link == "https://exemplo.com/regulamento"
    assert (dojo.nome, dojo.cidade) == ("Academia Central", "Curitiba")
    assert (faixa.nome, faixa.tipo) == ("Azul", "Kyu")
    assert turma.nome == "Adultos"


@pytest.mark.parametrize(
    ("schema", "dados", "campo"),
    [
        (
            AtividadeEntrada,
            {"tipo": "x", "nome": "Treino", "data": date(2026, 10, 8)},
            "tipo",
        ),
        (
            AnexoEntrada,
            {"titulo": "x", "categoria": "Fichas"},
            "titulo",
        ),
        (DojoEntrada, {"nome": "x"}, "nome"),
        (FaixaEntrada, {"nome": "x", "tipo": "Kyu"}, "nome"),
        (TurmaEntrada, {"nome": "x", "dojo_id": 3}, "nome"),
    ],
)
def test_schemas_rejeitam_textos_com_menos_de_dois_caracteres(schema, dados, campo):
    with pytest.raises(ValidationError) as erro:
        schema(**dados)

    assert f"o {campo} precisa ter pelo menos 2 caracteres" in str(erro.value)


def test_schemas_de_atualizacao_preservam_none_e_normalizam_texto():
    atividade = AtividadeAtualizar(tipo=None, nome=None, local=None, descricao=" Nota ")
    anexo = AnexoAtualizar(titulo=None, categoria=None, descricao=" Documento ")
    dojo = DojoAtualizar(nome=None, cidade=None)
    faixa = FaixaAtualizar(nome=None, tipo=None, ordem=None)
    turma = TurmaAtualizar(nome=None, dojo_id=None, professor_id=None)

    assert (atividade.tipo, atividade.nome, atividade.local, atividade.descricao) == (
        None,
        None,
        None,
        "Nota",
    )
    assert (anexo.titulo, anexo.categoria, anexo.descricao) == (None, None, "Documento")
    assert (dojo.nome, dojo.cidade) == (None, None)
    assert (faixa.nome, faixa.tipo, faixa.ordem) == (None, None, None)
    assert (turma.nome, turma.dojo_id, turma.professor_id) == (None, None, None)