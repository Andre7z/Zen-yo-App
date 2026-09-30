"""cria dojos turmas anexos e vinculos de dominio

Revision ID: e4f6a7b8c9d0
Revises: d31b9f15c0cf
Create Date: 2026-09-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d31b9f15c0cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dojos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("cidade", sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("dojos", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_dojos_id"), ["id"], unique=False)

    with op.batch_alter_table("usuarios", schema=None) as batch_op:
        batch_op.add_column(sa.Column("dojo_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_usuarios_dojo",
            "dojos",
            ["dojo_id"],
            ["id"],
        )

    op.create_table(
        "turmas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("dojo_id", sa.Integer(), nullable=False),
        sa.Column("professor_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["dojo_id"], ["dojos.id"], name="fk_turmas_dojo"),
        sa.ForeignKeyConstraint(
            ["professor_id"], ["usuarios.id"], name="fk_turmas_professor"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_turmas_id"), ["id"], unique=False)

    op.create_table(
        "anexos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=160), nullable=False),
        sa.Column("categoria", sa.String(length=40), nullable=False),
        sa.Column("descricao", sa.String(length=500), nullable=True),
        sa.Column("nome_arquivo", sa.String(length=160), nullable=True),
        sa.Column("arquivo_url", sa.String(length=500), nullable=True),
        sa.Column("link", sa.String(length=500), nullable=True),
        sa.Column("criado_em", sa.Date(), nullable=False),
        sa.Column("dono_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["dono_id"], ["usuarios.id"], name="fk_anexos_dono"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("anexos", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_anexos_id"), ["id"], unique=False)

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.alter_column("turma", existing_type=sa.String(length=120), nullable=True)
        batch_op.add_column(sa.Column("turma_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_alunos_turma",
            "turmas",
            ["turma_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.drop_constraint("fk_alunos_turma", type_="foreignkey")
        batch_op.drop_column("turma_id")
        batch_op.alter_column("turma", existing_type=sa.String(length=120), nullable=False)

    with op.batch_alter_table("anexos", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_anexos_id"))
    op.drop_table("anexos")

    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_turmas_id"))
    op.drop_table("turmas")

    with op.batch_alter_table("usuarios", schema=None) as batch_op:
        batch_op.drop_constraint("fk_usuarios_dojo", type_="foreignkey")
        batch_op.drop_column("dojo_id")

    with op.batch_alter_table("dojos", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_dojos_id"))
    op.drop_table("dojos")
