from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Faixa(Base):
    """Catalogo de faixas do dojo. O campo `nome` representa a cor e `tipo` define Kyu ou Dan."""

    __tablename__ = "faixas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(80), nullable=False)
    tipo = Column(String(20), nullable=False)
    ordem = Column(Integer, nullable=False, default=1)
    grau = Column(Integer, nullable=True)
    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_faixas_dono"), nullable=True)

    alunos = relationship("Aluno", back_populates="faixa_obj")


from ..alunos.models import Aluno  # noqa: E402
