from datetime import date

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, insert, select
from sqlalchemy.orm import Session

from app.associacoes import atividade_alunos
from app.atividades.models import Atividade
from app.atividades.repository import _salvar_pagamentos
from app.atividades.schemas import AtividadeAtualizar, AtividadeEntrada


def test_modelo_atividade_aceita_nova_faixa():
    atividade = Atividade(nova_faixa="Laranja")

    assert atividade.nova_faixa == "Laranja"


def test_schema_so_confirma_pagamento_de_alunos_participantes():
    dados = {
        "tipo": "frequencia",
        "nome": "Treino da turma",
        "data": date(2026, 10, 14),
        "aluno_ids": [7, 8],
        "aluno_ids_pagos": [8],
    }

    assert AtividadeEntrada(**dados).aluno_ids_pagos == [8]
    assert AtividadeAtualizar(aluno_ids=[7, 8], aluno_ids_pagos=[8]).aluno_ids_pagos == [8]

    with pytest.raises(ValidationError, match="Somente alunos participantes"):
        AtividadeEntrada(**{**dados, "aluno_ids_pagos": [9]})
    with pytest.raises(ValidationError, match="Envie aluno_ids"):
        AtividadeAtualizar(aluno_ids_pagos=[8])


def test_repository_grava_e_limpa_pagamento_no_vinculo():
    engine = create_engine("sqlite:///:memory:")
    atividade_alunos.create(engine)
    with engine.begin() as conexao:
        conexao.execute(insert(atividade_alunos), [
            {"atividade_id": 3, "aluno_id": 7, "pago": False},
            {"atividade_id": 3, "aluno_id": 8, "pago": False},
        ])

    with Session(engine) as db:
        _salvar_pagamentos(db, 3, [8])
        db.commit()
        pagos = db.execute(
            select(atividade_alunos.c.aluno_id).where(
                atividade_alunos.c.atividade_id == 3,
                atividade_alunos.c.pago.is_(True),
            )
        ).scalars().all()
        assert pagos == [8]

        _salvar_pagamentos(db, 3, [])
        db.commit()
        pagos = db.execute(
            select(atividade_alunos.c.aluno_id).where(
                atividade_alunos.c.atividade_id == 3,
                atividade_alunos.c.pago.is_(True),
            )
        ).scalars().all()
        assert pagos == []
