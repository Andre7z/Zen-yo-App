"""dono_id em faixas, alunos e turmas (dados por usuario)

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-10-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CONVENCAO = {"uq": "uq_%(table_name)s_%(column_0_name)s"}

# Mesma lista de app/faixas/padrao.py, copiada para a migracao nao mudar com o app.
FAIXAS_PADRAO = [
    ("Branca", "Kyu"),
    ("Branca/CINZA", "Kyu"),
    ("Cinza", "Kyu"),
    ("Cinza/AZUL", "Kyu"),
    ("Azul", "Kyu"),
    ("Azul/AMARELA", "Kyu"),
    ("Amarela", "Kyu"),
    ("Amarela/LARANJA", "Kyu"),
    ("Laranja", "Kyu"),
    ("Verde", "Kyu"),
    ("Roxa", "Kyu"),
    ("Marrom", "Kyu"),
    ("Preta", "Dan"),
    ("Preta", "Dan"),
    ("Preta", "Dan"),
    ("Preta", "Dan"),
    ("Preta", "Dan"),
    ("Vermelha e Branca", "Dan"),
    ("Vermelha e Branca", "Dan"),
    ("Vermelha e Branca", "Dan"),
    ("Vermelha", "Dan"),
    ("Vermelha", "Dan"),
]


def _nome_unique_faixas(bind) -> str:
    for restricao in sa.inspect(bind).get_unique_constraints("faixas"):
        if restricao["column_names"] == ["nome"]:
            return restricao["name"] or "uq_faixas_nome"
    return "uq_faixas_nome"


def upgrade() -> None:
    bind = op.get_bind()
    nome_unique = _nome_unique_faixas(bind)

    for tabela in ("faixas", "alunos", "turmas"):
        with op.batch_alter_table(tabela, schema=None) as batch_op:
            batch_op.add_column(sa.Column("dono_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                f"fk_{tabela}_dono", "usuarios", ["dono_id"], ["id"]
            )

    with op.batch_alter_table(
        "faixas", schema=None, naming_convention=CONVENCAO
    ) as batch_op:
        batch_op.drop_constraint(nome_unique, type_="unique")

    # Os dados que ja existiam passam a pertencer ao primeiro usuario.
    primeiro = bind.execute(sa.text("SELECT MIN(id) FROM usuarios")).scalar()
    if primeiro is None:
        return
    for tabela in ("faixas", "alunos", "turmas"):
        bind.execute(
            sa.text(f"UPDATE {tabela} SET dono_id = :dono WHERE dono_id IS NULL"),
            {"dono": primeiro},
        )

    # Os demais usuarios recebem o catalogo padrao de faixas.
    outros = bind.execute(
        sa.text("SELECT id FROM usuarios WHERE id <> :dono"), {"dono": primeiro}
    ).scalars().all()
    faixas = sa.table(
        "faixas",
        sa.column("nome", sa.String),
        sa.column("tipo", sa.String),
        sa.column("ordem", sa.Integer),
        sa.column("dono_id", sa.Integer),
    )
    for usuario_id in outros:
        op.bulk_insert(
            faixas,
            [
                {"nome": nome, "tipo": tipo, "ordem": posicao, "dono_id": usuario_id}
                for posicao, (nome, tipo) in enumerate(FAIXAS_PADRAO, start=1)
            ],
        )


def downgrade() -> None:
    # Remove as faixas duplicadas por usuario antes de voltar ao nome unico.
    op.execute(
        sa.text(
            "DELETE FROM faixas WHERE id NOT IN "
            "(SELECT MIN(id) FROM faixas GROUP BY nome) "
            "AND id NOT IN (SELECT faixa_id FROM alunos)"
        )
    )
    with op.batch_alter_table("faixas", schema=None) as batch_op:
        batch_op.create_unique_constraint("faixas_nome_key", ["nome"])

    for tabela in ("turmas", "alunos", "faixas"):
        with op.batch_alter_table(tabela, schema=None) as batch_op:
            batch_op.drop_constraint(f"fk_{tabela}_dono", type_="foreignkey")
            batch_op.drop_column("dono_id")
