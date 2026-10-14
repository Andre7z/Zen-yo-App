from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Turma(Base):
    """Turma vinculada a um dojo e a um professor."""

    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)

    dojo_id = Column(Integer, ForeignKey("dojos.id", name="fk_turmas_dojo"), nullable=False)
    dojo = relationship("Dojo", back_populates="turmas")

    professor_id = Column(Integer, ForeignKey("usuarios.id", name="fk_turmas_professor"), nullable=True)
    professor = relationship("Usuario", back_populates="turmas")
    alunos = relationship("Aluno", back_populates="turma_obj")


from ..alunos.models import Aluno  # noqa: E402
from ..dojos.models import Dojo  # noqa: E402
from ..usuarios.models import Usuario  # noqa: E402
