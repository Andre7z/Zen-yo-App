"""Adiciona A3 aos catálogos de judogi existentes."""

from alembic import op

revision = "c4d5e6f7a8b9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TEMPORARY TABLE migracao_tamanho_a3 AS
        SELECT dono_id,
               COALESCE(MIN(CASE WHEN upper(nome) = 'A4' THEN ordem END), MAX(ordem) + 1) AS ordem
        FROM tamanhos
        WHERE tipo = 'kimono'
        GROUP BY dono_id
        HAVING SUM(CASE WHEN upper(nome) = 'A3' THEN 1 ELSE 0 END) = 0
    """)
    op.execute("""
        UPDATE tamanhos SET ordem = ordem + 1
        WHERE tipo = 'kimono' AND EXISTS (
            SELECT 1 FROM migracao_tamanho_a3
            WHERE migracao_tamanho_a3.dono_id = tamanhos.dono_id
              AND tamanhos.ordem >= migracao_tamanho_a3.ordem
        )
    """)
    op.execute("""
        INSERT INTO tamanhos (tipo, nome, ordem, dono_id)
        SELECT 'kimono', 'A3', ordem, dono_id FROM migracao_tamanho_a3
    """)
    op.execute("DROP TABLE migracao_tamanho_a3")


def downgrade():
    # Não remover tamanhos que podem ter sido utilizados ou modificados após a migração.
    pass
