from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Turma(Base):
    """Grupo de alunos."""

    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)

    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_turmas_dono"), nullable=True)
    professor_id = Column(Integer, ForeignKey("usuarios.id", name="fk_turmas_professor"), nullable=True)
    professor = relationship("Usuario", back_populates="turmas", foreign_keys=[professor_id])
    alunos = relationship("Aluno", back_populates="turma_obj")


from ..alunos.models import Aluno  # noqa: E402
from ..usuarios.models import Usuario  # noqa: E402
