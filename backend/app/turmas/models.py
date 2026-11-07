from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship

from ..associacoes import AlunoTurma
from ..database import Base


class Turma(Base):
    """Grupo de alunos."""

    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    nucleo = Column(String(120), nullable=True)

    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_turmas_dono"), nullable=True)
    professor_id = Column(Integer, ForeignKey("usuarios.id", name="fk_turmas_professor"), nullable=True)
    professor = relationship("Usuario", back_populates="turmas", foreign_keys=[professor_id])
    vinculos_aluno = relationship(
        AlunoTurma,
        back_populates="turma",
        cascade="all, delete-orphan",
    )
    alunos = association_proxy(
        "vinculos_aluno",
        "aluno",
        creator=lambda aluno: AlunoTurma(aluno=aluno),
    )
    chamadas = relationship("ChamadaTurma", back_populates="turma", cascade="all, delete-orphan")


class ChamadaTurma(Base):
    __tablename__ = "chamadas_turma"
    __table_args__ = (UniqueConstraint("turma_id", "data", name="uq_chamada_turma_data"),)

    id = Column(Integer, primary_key=True)
    turma_id = Column(Integer, ForeignKey("turmas.id", ondelete="CASCADE"), nullable=False)
    data = Column(Date, nullable=False)
    turma = relationship("Turma", back_populates="chamadas")
    presencas = relationship("PresencaTurma", back_populates="chamada", cascade="all, delete-orphan")


class PresencaTurma(Base):
    __tablename__ = "presencas_turma"
    __table_args__ = (UniqueConstraint("chamada_id", "aluno_id", name="uq_presenca_chamada_aluno"),)

    id = Column(Integer, primary_key=True)
    chamada_id = Column(Integer, ForeignKey("chamadas_turma.id", ondelete="CASCADE"), nullable=False)
    aluno_id = Column(Integer, ForeignKey("alunos.id", ondelete="CASCADE"), nullable=False)
    aluno_nome = Column(String(120), nullable=False)
    presente = Column(Boolean, nullable=False)
    chamada = relationship("ChamadaTurma", back_populates="presencas")
    aluno = relationship("Aluno", back_populates="presencas_turma")


from ..alunos.models import Aluno  # noqa: E402
from ..usuarios.models import Usuario  # noqa: E402
