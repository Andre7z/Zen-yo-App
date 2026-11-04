"""separa responsavel do aluno e remove dojo

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-11-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "d0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "responsaveis",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("aluno_id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=True),
        sa.Column("cpf", sa.String(length=14), nullable=True),
        sa.Column("celular", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(
            ["aluno_id"],
            ["alunos.id"],
            name="fk_responsaveis_aluno",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("aluno_id", name="uq_responsaveis_aluno_id"),
    )
    with op.batch_alter_table("responsaveis", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_responsaveis_id"), ["id"], unique=False)

    op.execute(
        sa.text(
            "INSERT INTO responsaveis (aluno_id, nome, cpf, celular) "
            "SELECT id, responsavel_nome, responsavel_cpf, responsavel_celular "
            "FROM alunos "
            "WHERE responsavel_nome IS NOT NULL "
            "OR responsavel_cpf IS NOT NULL "
            "OR responsavel_celular IS NOT NULL"
        )
    )
    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.drop_column("responsavel_celular")
        batch_op.drop_column("responsavel_cpf")
        batch_op.drop_column("responsavel_nome")

    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.drop_constraint("fk_turmas_dojo", type_="foreignkey")
        batch_op.drop_column("dojo_id")

    with op.batch_alter_table("usuarios", schema=None) as batch_op:
        batch_op.drop_constraint("fk_usuarios_dojo", type_="foreignkey")
        batch_op.drop_column("dojo_id")

    op.drop_index("ix_dojos_id", table_name="dojos")
    op.drop_table("dojos")


def downgrade() -> None:
    op.create_table(
        "dojos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("cidade", sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("dojos", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_dojos_id"), ["id"], unique=False)

    with op.batch_alter_table("usuarios", schema=None) as batch_op:
        batch_op.add_column(sa.Column("dojo_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_usuarios_dojo", "dojos", ["dojo_id"], ["id"]
        )

    with op.batch_alter_table("turmas", schema=None) as batch_op:
        batch_op.add_column(sa.Column("dojo_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_turmas_dojo", "dojos", ["dojo_id"], ["id"])

    with op.batch_alter_table("alunos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("responsavel_nome", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("responsavel_cpf", sa.String(length=14), nullable=True))
        batch_op.add_column(sa.Column("responsavel_celular", sa.String(length=20), nullable=True))

    op.execute(
        sa.text(
            "UPDATE alunos SET "
            "responsavel_nome = (SELECT nome FROM responsaveis "
            "WHERE responsaveis.aluno_id = alunos.id), "
            "responsavel_cpf = (SELECT cpf FROM responsaveis "
            "WHERE responsaveis.aluno_id = alunos.id), "
            "responsavel_celular = (SELECT celular FROM responsaveis "
            "WHERE responsaveis.aluno_id = alunos.id)"
        )
    )
    with op.batch_alter_table("responsaveis", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_responsaveis_id"))
    op.drop_table("responsaveis")
