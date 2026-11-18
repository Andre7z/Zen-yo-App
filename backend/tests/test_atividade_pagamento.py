from datetime import date
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from pydantic import ValidationError
from sqlalchemy import create_engine, insert, inspect, select, text
from sqlalchemy.orm import Session

from app.associacoes import atividade_alunos
from app.atividades.models import Atividade
from app.atividades.repository import _salvar_confirmacoes
from app.atividades.schemas import AtividadeAtualizar, AtividadeEntrada


def test_modelo_atividade_aceita_nova_faixa():
    atividade = Atividade(nova_faixa="Laranja")

    assert atividade.nova_faixa == "Laranja"


def test_schema_so_confirma_alunos_participantes():
    dados = {
        "tipo": "frequencia",
        "nome": "Treino da turma",
        "data": date(2026, 10, 14),
        "aluno_ids": [7, 8],
        "aluno_ids_confirmados": [8],
    }

    assert AtividadeEntrada(**dados).aluno_ids_confirmados == [8]
    assert AtividadeAtualizar(aluno_ids=[7, 8], aluno_ids_confirmados=[8]).aluno_ids_confirmados == [8]
    assert AtividadeAtualizar.model_validate({"aluno_ids": [7, 8], "aluno_ids_pagos": [8]}).model_dump(exclude_unset=True)["aluno_ids_confirmados"] == [8]

    with pytest.raises(ValidationError, match="Somente alunos participantes"):
        AtividadeEntrada(**{**dados, "aluno_ids_confirmados": [9]})
    with pytest.raises(ValidationError, match="Envie aluno_ids"):
        AtividadeAtualizar(aluno_ids_confirmados=[8])


def test_repository_grava_e_limpa_confirmacao_no_vinculo():
    engine = create_engine("sqlite:///:memory:")
    atividade_alunos.create(engine)
    with engine.begin() as conexao:
        conexao.execute(insert(atividade_alunos), [
            {"atividade_id": 3, "aluno_id": 7, "confirmado": False},
            {"atividade_id": 3, "aluno_id": 8, "confirmado": False},
        ])

    with Session(engine) as db:
        _salvar_confirmacoes(db, 3, [8])
        db.commit()
        confirmados = db.execute(
            select(atividade_alunos.c.aluno_id).where(
                atividade_alunos.c.atividade_id == 3,
                atividade_alunos.c.confirmado.is_(True),
            )
        ).scalars().all()
        assert confirmados == [8]

        _salvar_confirmacoes(db, 3, [])
        db.commit()
        confirmados = db.execute(
            select(atividade_alunos.c.aluno_id).where(
                atividade_alunos.c.atividade_id == 3,
                atividade_alunos.c.confirmado.is_(True),
            )
        ).scalars().all()
        assert confirmados == []


@pytest.mark.parametrize("coluna_anterior", ["pago", "confirmado"])
def test_migracao_preserva_confirmacoes_existentes(tmp_path, monkeypatch, coluna_anterior):
    url = f"sqlite:///{(tmp_path / 'confirmacoes.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "c4d5e6f7a8b9")
    engine = create_engine(url)
    with engine.begin() as conexao:
        conexao.execute(text("INSERT INTO atividade_alunos (atividade_id, aluno_id, pago) VALUES (1, 1, 1), (1, 2, 0)"))
        if coluna_anterior == "confirmado":
            conexao.execute(text("ALTER TABLE atividade_alunos RENAME COLUMN pago TO confirmado"))

    command.upgrade(config, "head")
    assert "pago" not in {coluna["name"] for coluna in inspect(engine).get_columns("atividade_alunos")}
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT aluno_id, confirmado FROM atividade_alunos ORDER BY aluno_id")).all() == [(1, 1), (2, 0)]

    command.downgrade(config, "c4d5e6f7a8b9")
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT aluno_id, pago FROM atividade_alunos ORDER BY aluno_id")).all() == [(1, 1), (2, 0)]
    command.upgrade(config, "head")
    engine.dispose()
