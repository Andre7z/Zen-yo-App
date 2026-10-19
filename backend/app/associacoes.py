from sqlalchemy import Boolean, Column, ForeignKey, Table, false

from .database import Base


atividade_alunos = Table(
    "atividade_alunos",
    Base.metadata,
    Column(
        "atividade_id",
        ForeignKey("atividades.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "aluno_id",
        ForeignKey("alunos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("pago", Boolean, nullable=False, default=False, server_default=false()),
)
