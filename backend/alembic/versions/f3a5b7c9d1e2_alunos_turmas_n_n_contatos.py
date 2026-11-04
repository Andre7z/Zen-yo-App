"""converte aluno-turma para n:n e adiciona contatos

Revision ID: f3a5b7c9d1e2
Revises: e1f2a3b4c5d6
Create Date: 2026-11-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3a5b7c9d1e2"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "aluno_turmas",
        sa.Column("aluno_id", sa.Integer(), nullable=False),
        sa.Column("turma_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["aluno_id"], ["alunos.id"], name="fk_aluno_turmas_aluno", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["turma_id"], ["turmas.id"], name="fk_aluno_turmas_turma", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("aluno_id", "turma_id"),
    )
    op.create_index(
        "ix_aluno_turmas_turma_id",
        "aluno_turmas",
        ["turma_id"],
        unique=False,
    )

    bind = op.get_bind()
    metadata = sa.MetaData()
    alunos = sa.Table("alunos", metadata, autoload_with=bind)
    turmas = sa.Table("turmas", metadata, autoload_with=bind)
    aluno_turmas = sa.Table("aluno_turmas", metadata, autoload_with=bind)

    turmas_por_id = {
        turma["id"]: turma
        for turma in bind.execute(sa.select(turmas)).mappings()
    }
    turmas_por_dono_nome = {}
    for turma in turmas_por_id.values():
        turmas_por_dono_nome.setdefault((turma["dono_id"], turma["nome"]), turma["id"])

    vinculos = set()
    alunos_existentes = bind.execute(
        sa.select(alunos.c.id, alunos.c.dono_id, alunos.c.turma_id, alunos.c.turma)
    ).mappings()
    for aluno in alunos_existentes:
        turma = turmas_por_id.get(aluno["turma_id"])
        if turma is not None and turma["dono_id"] == aluno["dono_id"]:
            vinculos.add((aluno["id"], turma["id"]))
            continue

        nome = (aluno["turma"] or "").strip()[:120]
        if not nome:
            continue

        chave = (aluno["dono_id"], nome)
        turma_id = turmas_por_dono_nome.get(chave)
        if turma_id is None:
            resultado = bind.execute(
                turmas.insert().values(nome=nome, dono_id=aluno["dono_id"])
            )
            turma_id = resultado.inserted_primary_key[0]
            turmas_por_dono_nome[chave] = turma_id
        vinculos.add((aluno["id"], turma_id))

    if vinculos:
        bind.execute(
            aluno_turmas.insert(),
            [
                {"aluno_id": aluno_id, "turma_id": turma_id}
                for aluno_id, turma_id in sorted(vinculos)
            ],
        )

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.drop_constraint("fk_alunos_turma", type_="foreignkey")
        batch_op.drop_column("turma_id")
        batch_op.drop_column("turma")
        batch_op.add_column(sa.Column("celular", sa.String(length=20), nullable=True))

    with op.batch_alter_table("responsaveis", schema=None) as batch_op:
        batch_op.add_column(sa.Column("parentesco", sa.String(length=60), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    metadata = sa.MetaData()
    turmas = sa.Table("turmas", metadata, autoload_with=bind)
    aluno_turmas = sa.Table("aluno_turmas", metadata, autoload_with=bind)

    vinculos = bind.execute(
        sa.select(aluno_turmas.c.aluno_id, aluno_turmas.c.turma_id)
        .order_by(aluno_turmas.c.aluno_id, aluno_turmas.c.turma_id)
    ).all()
    primeiro_vinculo = {}
    for aluno_id, turma_id in vinculos:
        primeiro_vinculo.setdefault(aluno_id, turma_id)

    op.drop_index("ix_aluno_turmas_turma_id", table_name="aluno_turmas")
    op.drop_table("aluno_turmas")
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("turma", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("turma_id", sa.Integer(), nullable=True))
        batch_op.drop_column("celular")
        batch_op.create_foreign_key(
            "fk_alunos_turma",
            "turmas",
            ["turma_id"],
            ["id"],
        )

    for aluno_id, turma_id in primeiro_vinculo.items():
        nome = bind.execute(
            sa.select(turmas.c.nome).where(turmas.c.id == turma_id)
        ).scalar_one()
        bind.execute(
            sa.text(
                "UPDATE alunos SET turma_id = :turma_id, turma = :turma "
                "WHERE id = :aluno_id"
            ),
            {"aluno_id": aluno_id, "turma_id": turma_id, "turma": nome},
        )

    with op.batch_alter_table("responsaveis", schema=None) as batch_op:
        batch_op.drop_column("parentesco")
