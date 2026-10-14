from sqlalchemy import Column, ForeignKey, Table

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
)
