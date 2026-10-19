from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..associacoes import atividade_alunos
from ..database import Base


class Aluno(Base):
    """A TABELA. Nao confunda com os schemas: aquilo atravessa a
    fronteira da API, isto vira linha no banco.
    """

    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    cpf = Column(String(14), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    faixa_id = Column(Integer, ForeignKey("faixas.id", name="fk_alunos_faixa"), nullable=False)
    proxima_faixa = Column(String(120), nullable=True)
    turma = Column(String(120), nullable=True)
    turma_id = Column(Integer, ForeignKey("turmas.id", name="fk_alunos_turma"), nullable=True)
    tamanho_kimono = Column(String(5), nullable=True)
    tamanho_faixa = Column(String(5), nullable=True)
    codigo_zempo = Column(String(14), nullable=True)

    faixa_obj = relationship("Faixa", back_populates="alunos")
    turma_obj = relationship("Turma", back_populates="alunos")
    atividades = relationship(
        "Atividade",
        secondary=atividade_alunos,
        back_populates="alunos",
    )


    @property
    def idade(self):
        if self.data_nascimento is None:
            return None

        hoje = date.today()
        idade = hoje.year - self.data_nascimento.year

        if (hoje.month, hoje.day) < (
            self.data_nascimento.month,
            self.data_nascimento.day,
        ):
            idade -= 1

        return idade


from ..atividades.models import Atividade  # noqa: E402
from ..faixas.models import Faixa  # noqa: E402
from ..turmas.models import Turma  # noqa: E402