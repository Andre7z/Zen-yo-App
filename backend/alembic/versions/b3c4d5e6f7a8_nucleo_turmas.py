"""Adiciona o núcleo das turmas sem alterar os cadastros existentes."""

from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a8"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("turmas", sa.Column("nucleo", sa.String(120), nullable=True))


def downgrade():
    with op.batch_alter_table("turmas") as batch_op:
        batch_op.drop_column("nucleo")
