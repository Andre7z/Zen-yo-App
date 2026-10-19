"""grau (numero do kyu/dan) em faixas e ordem calculada

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-10-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("faixas", schema=None) as batch_op:
        batch_op.add_column(sa.Column("grau", sa.Integer(), nullable=True))

    # Antes, a "ordem" de Kyu/Dan era o proprio numero da graduacao.
    op.execute(
        sa.text(
            "UPDATE faixas SET grau = CASE WHEN ordem < 1 THEN 1 ELSE ordem END "
            "WHERE tipo IN ('Kyu', 'Dan')"
        )
    )
    op.execute(sa.text("UPDATE faixas SET tipo = 'Iniciante', grau = NULL WHERE tipo = 'Iniciante'"))
    op.execute(
        sa.text(
            "UPDATE faixas SET ordem = CASE tipo "
            "WHEN 'Kyu' THEN 1000 - grau WHEN 'Dan' THEN 1000 + grau ELSE 0 END"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text("UPDATE faixas SET ordem = COALESCE(grau, 0)")
    )
    with op.batch_alter_table("faixas", schema=None) as batch_op:
        batch_op.drop_column("grau")
