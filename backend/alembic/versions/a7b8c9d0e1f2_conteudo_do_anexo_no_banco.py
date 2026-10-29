"""conteudo do anexo no banco

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-10-27 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("anexos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("conteudo", sa.LargeBinary(), nullable=True))
        batch_op.add_column(sa.Column("tipo_conteudo", sa.String(length=120), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("anexos", schema=None) as batch_op:
        batch_op.drop_column("tipo_conteudo")
        batch_op.drop_column("conteudo")
