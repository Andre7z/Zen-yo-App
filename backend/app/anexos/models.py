from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import deferred, relationship

from ..database import Base


class Anexo(Base):
    """Arquivo ou link associado ao dojo e ao usuario que o cadastrou."""

    __tablename__ = "anexos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(160), nullable=False)
    categoria = Column(String(40), nullable=False)
    descricao = Column(String(500), nullable=True)
    nome_arquivo = Column(String(160), nullable=True)
    arquivo_url = Column(String(500), nullable=True)
    # O conteudo fica no banco para nao se perder com discos efemeros.
    conteudo = deferred(Column(LargeBinary, nullable=True))
    tipo_conteudo = Column(String(120), nullable=True)
    link = Column(String(500), nullable=True)
    criado_em = Column(Date, default=date.today, nullable=False)

    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_anexos_dono"), nullable=True)
    dono = relationship("Usuario", back_populates="anexos")


from ..usuarios.models import Usuario  # noqa: E402
