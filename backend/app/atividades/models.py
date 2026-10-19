from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, select
from sqlalchemy.orm import object_session, relationship

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

    @property
    def aluno_ids_pagos(self):
        sessao = object_session(self)
        if sessao is None or self.id is None:
            return []
        consulta = select(atividade_alunos.c.aluno_id).where(
            atividade_alunos.c.atividade_id == self.id,
            atividade_alunos.c.pago.is_(True),
        )
        return list(sessao.execute(consulta).scalars())
    
    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_atividades_dono"), nullable=True)
    dono = relationship("Usuario", back_populates="atividades")


from ..usuarios.models import Usuario  # noqa: E402