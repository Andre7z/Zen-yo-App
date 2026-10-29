from sqlalchemy import Column, ForeignKey, Integer, String

from ..database import Base


class Tamanho(Base):
    """Tamanho de kimono ou de faixa cadastrado pelo professor."""

    __tablename__ = "tamanhos"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(10), nullable=False)
    nome = Column(String(5), nullable=False)
    ordem = Column(Integer, nullable=False, default=1)
    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_tamanhos_dono"), nullable=False)
