"""usa faixa_id como unico vinculo de faixa do aluno

Revision ID: f5a6b7c8d9e0
Revises: e4f6a7b8c9d0
Create Date: 2026-09-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5a6b7c8d9e0"
down_revision: Union[str, Sequence[str], None] = "e4f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Migra os nomes antigos para o catalogo antes de apagar a coluna textual.
    op.execute(
        sa.text(
            "INSERT INTO faixas (nome, tipo, ordem) "
            "SELECT DISTINCT faixa, "
            "CASE WHEN lower(faixa) = 'preta' THEN 'Dan' ELSE 'Kyu' END, 1 "
            "FROM alunos "
            "WHERE faixa IS NOT NULL AND trim(faixa) <> '' "
            "ON CONFLICT (nome) DO NOTHING"
        )
    )
    op.execute(
        sa.text(
            "INSERT INTO faixas (nome, tipo, ordem) VALUES ('Branca', 'Kyu', 1) "
            "ON CONFLICT (nome) DO NOTHING"
        )
    )
    op.execute(
        sa.text(
            "UPDATE alunos SET faixa_id = faixas.id "
            "FROM faixas WHERE lower(trim(alunos.faixa)) = lower(trim(faixas.nome)) "
            "AND alunos.faixa_id IS NULL"
        )
    )
    op.execute(
        sa.text(
            "UPDATE alunos SET faixa_id = faixas.id "
            "FROM faixas WHERE faixas.nome = 'Branca' AND alunos.faixa_id IS NULL"
        )
    )

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.alter_column("faixa_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column("faixa")


def downgrade() -> None:
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("faixa", sa.String(length=120), nullable=True))

    op.execute(
        sa.text(
            "UPDATE alunos SET faixa = faixas.nome "
            "FROM faixas WHERE alunos.faixa_id = faixas.id"
        )
    )

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.alter_column("faixa", existing_type=sa.String(length=120), nullable=False)
