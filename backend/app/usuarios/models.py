from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base


class Usuario(Base):
    """A TABELA de usuarios.

    Repare no que NAO existe aqui: uma coluna `senha`. O que se guarda e' o
    hash -- e ninguem, nem quem administra o banco, consegue ler a senha de
    volta a partir dele.
    """

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    senha_hash = Column(String(100), nullable=False)
    dojo_id = Column(Integer, ForeignKey("dojos.id", name="fk_usuarios_dojo"), nullable=True)

    dojo = relationship("Dojo", back_populates="usuarios")
    # O outro lado do relacionamento: um usuario, muitos livros. Nao cria
    # coluna nenhuma -- a chave estrangeira mora em livros.dono_id.
    atividades = relationship("Atividade", back_populates="dono")
    anexos = relationship("Anexo", back_populates="dono")
    turmas = relationship("Turma", back_populates="professor")


from ..anexos.models import Anexo  # noqa: E402
from ..atividades.models import Atividade  # noqa: E402
from ..dojos.models import Dojo  # noqa: E402
from ..turmas.models import Turma  # noqa: E402