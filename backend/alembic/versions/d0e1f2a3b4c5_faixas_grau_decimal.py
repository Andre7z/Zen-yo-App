"""grau e ordem decimais nas faixas (faixas intermediarias)

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d0e1f2a3b4c5"
down_revision: Union[str, Sequence[str], None] = "c9d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("faixas") as lote:
        lote.alter_column("grau", existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=True)
        lote.alter_column("ordem", existing_type=sa.Integer(), type_=sa.Float(), existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("faixas") as lote:
        lote.alter_column("grau", existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=True, postgresql_using="round(grau)::integer")
        lote.alter_column("ordem", existing_type=sa.Float(), type_=sa.Integer(), existing_nullable=False, postgresql_using="round(ordem)::integer")
