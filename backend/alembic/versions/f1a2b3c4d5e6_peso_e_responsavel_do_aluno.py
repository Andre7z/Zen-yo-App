"""peso e responsavel no aluno

Revision ID: f1a2b3c4d5e6
Revises: e0f1a2b3c4d5
Create Date: 2026-10-27 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("peso", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("responsavel_nome", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("responsavel_cpf", sa.String(length=14), nullable=True))
        batch_op.add_column(sa.Column("responsavel_celular", sa.String(length=20), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.drop_column("responsavel_celular")
        batch_op.drop_column("responsavel_cpf")
        batch_op.drop_column("responsavel_nome")
        batch_op.drop_column("peso")
