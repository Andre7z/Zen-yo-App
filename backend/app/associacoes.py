from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, Table, false
from sqlalchemy.orm import relationship

from .database import Base


class AlunoTurma(Base):
    __tablename__ = "aluno_turmas"
    __table_args__ = (Index("ix_aluno_turmas_turma_id", "turma_id"),)

    aluno_id = Column(
        Integer,
        ForeignKey("alunos.id", name="fk_aluno_turmas_aluno", ondelete="CASCADE"),
        primary_key=True,
    )
    turma_id = Column(
        Integer,
        ForeignKey("turmas.id", name="fk_aluno_turmas_turma", ondelete="CASCADE"),
        primary_key=True,
    )

    aluno = relationship("Aluno", back_populates="vinculos_turma")
    turma = relationship("Turma", back_populates="vinculos_aluno")


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
