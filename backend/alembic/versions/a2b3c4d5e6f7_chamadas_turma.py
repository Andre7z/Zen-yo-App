"""Registra as chamadas das turmas e seus participantes."""

from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "f3a5b7c9d1e2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "chamadas_turma",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("turma_id", sa.Integer(), sa.ForeignKey("turmas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.UniqueConstraint("turma_id", "data", name="uq_chamada_turma_data"),
    )
    op.create_table(
        "presencas_turma",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chamada_id", sa.Integer(), sa.ForeignKey("chamadas_turma.id", ondelete="CASCADE"), nullable=False),
        sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("alunos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("aluno_nome", sa.String(120), nullable=False),
        sa.Column("presente", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("chamada_id", "aluno_id", name="uq_presenca_chamada_aluno"),
    )


def downgrade():
    op.drop_table("presencas_turma")
    op.drop_table("chamadas_turma")
