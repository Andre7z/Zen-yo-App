from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..associacoes import atividade_alunos
from ..database import Base


class Atividade(Base):
    __tablename__ = "atividades"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)
    nome = Column(String(120), nullable=False)
    data = Column(Date, nullable=False)
    local = Column(String(120), nullable=True)
    descricao = Column(String(500), nullable=True)

    nova_faixa = Column(String(120), nullable=True)
    presenca = Column(Boolean, nullable=True)

    alunos = relationship(
        "Aluno",
        secondary=atividade_alunos,
        back_populates="atividades",
    )

    @property
    def aluno_ids(self):
        return [aluno.id for aluno in self.alunos]
    
    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_atividades_dono"), nullable=True)
    dono = relationship("Usuario", back_populates="atividades")


from ..usuarios.models import Usuario  # noqa: E402