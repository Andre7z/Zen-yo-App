"""cria tabela faixas e relaciona alunos

Revision ID: d31b9f15c0cf
Revises: c7a4f1b2d9e0
Create Date: 2026-09-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d31b9f15c0cf"
down_revision: Union[str, Sequence[str], None] = "c7a4f1b2d9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "faixas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="1"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    with op.batch_alter_table("faixas", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_faixas_id"), ["id"], unique=False)

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("faixa_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_alunos_faixa",
            "faixas",
            ["faixa_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.drop_constraint("fk_alunos_faixa", type_="foreignkey")
        batch_op.drop_column("faixa_id")

    with op.batch_alter_table("faixas", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_faixas_id"))

    op.drop_table("faixas")
