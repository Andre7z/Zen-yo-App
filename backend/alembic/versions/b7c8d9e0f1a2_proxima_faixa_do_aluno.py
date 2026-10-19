"""adiciona proxima faixa e remove obrigatoriedade de dojo na turma

Revision ID: b7c8d9e0f1a2
Revises: a4c19e3d7f20
Create Date: 2026-10-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a4c19e3d7f20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "alunos",
        sa.Column("proxima_faixa", sa.String(length=120), nullable=True),
    )
    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.alter_column(
            "dojo_id",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.alter_column(
            "dojo_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
    op.drop_column("alunos", "proxima_faixa")