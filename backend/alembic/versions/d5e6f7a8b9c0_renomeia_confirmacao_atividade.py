"""Renomeia a confirmação dos participantes sem perder os valores existentes."""

from alembic import context, op
import sqlalchemy as sa

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade():
    if context.is_offline_mode():
        raise RuntimeError("Esta migração exige conexão ao banco para verificar a coluna existente.")

    colunas = {coluna["name"] for coluna in sa.inspect(op.get_bind()).get_columns("atividade_alunos")}
    if "pago" in colunas and "confirmado" not in colunas:
        op.alter_column("atividade_alunos", "pago", new_column_name="confirmado")
    elif "confirmado" not in colunas or "pago" in colunas:
        raise RuntimeError("A tabela atividade_alunos deve ter somente uma das colunas pago ou confirmado.")


def downgrade():
    op.alter_column("atividade_alunos", "confirmado", new_column_name="pago")
