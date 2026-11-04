from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class Responsavel(Base):
    __tablename__ = "responsaveis"
    __table_args__ = (
        UniqueConstraint("aluno_id", name="uq_responsaveis_aluno_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    aluno_id = Column(
        Integer,
        ForeignKey("alunos.id", name="fk_responsaveis_aluno", ondelete="CASCADE"),
        nullable=False,
    )
    nome = Column(String(120), nullable=True)
    cpf = Column(String(14), nullable=True)
    celular = Column(String(20), nullable=True)
    parentesco = Column(String(60), nullable=True)

    aluno = relationship("Aluno", back_populates="responsavel")


from ..alunos.models import Aluno  # noqa: E402
