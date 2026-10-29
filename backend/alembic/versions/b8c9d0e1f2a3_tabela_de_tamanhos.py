"""tabela de tamanhos de kimono e faixa

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-27 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tamanhos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=10), nullable=False),
        sa.Column("nome", sa.String(length=5), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False),
        sa.Column("dono_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["dono_id"], ["usuarios.id"], name="fk_tamanhos_dono"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tamanhos_id"), "tamanhos", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tamanhos_id"), table_name="tamanhos")
    op.drop_table("tamanhos")
