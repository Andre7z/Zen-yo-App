"""adiciona confirmacao de pagamento por aluno na atividade

Revision ID: a4c19e3d7f20
Revises: f5a6b7c8d9e0
Create Date: 2026-10-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4c19e3d7f20"
down_revision: Union[str, Sequence[str], None] = "f5a6b7c8d9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "atividade_alunos",
        sa.Column("pago", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("atividade_alunos", "pago")
