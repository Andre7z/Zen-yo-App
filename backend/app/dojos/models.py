from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Dojo(Base):
    """Ambiente do dojo (academia ou unidade)."""

    __tablename__ = "dojos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    cidade = Column(String(120), nullable=True)

    usuarios = relationship("Usuario", back_populates="dojo")
    turmas = relationship("Turma", back_populates="dojo")


from ..usuarios.models import Usuario  # noqa: E402
