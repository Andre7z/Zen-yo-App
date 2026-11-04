from datetime import date

from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression

from ..associacoes import AlunoTurma, atividade_alunos
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
    genero = Column(String(20), nullable=True)
    faixa_id = Column(Integer, ForeignKey("faixas.id", name="fk_alunos_faixa"), nullable=False)
    proxima_faixa = Column(String(120), nullable=True)
    celular = Column(String(20), nullable=True)
    tamanho_kimono = Column(String(5), nullable=True)
    tamanho_faixa = Column(String(5), nullable=True)
    faixa_grossa = Column(Boolean, nullable=False, default=False, server_default=expression.false())
    codigo_zempo = Column(String(14), nullable=True)
    peso = Column(Float, nullable=True)
    dono_id = Column(Integer, ForeignKey("usuarios.id", name="fk_alunos_dono"), nullable=True)

    faixa_obj = relationship("Faixa", back_populates="alunos")
    vinculos_turma = relationship(
        AlunoTurma,
        back_populates="aluno",
        cascade="all, delete-orphan",
    )
    turmas = association_proxy(
        "vinculos_turma",
        "turma",
        creator=lambda turma: AlunoTurma(turma=turma),
    )
    responsavel = relationship(
        "Responsavel",
        back_populates="aluno",
        uselist=False,
        cascade="all, delete-orphan",
    )
    atividades = relationship(
        "Atividade",
        secondary=atividade_alunos,
        back_populates="alunos",
    )

    @property
    def responsavel_nome(self):
        return self.responsavel.nome if self.responsavel else None

    @property
    def responsavel_cpf(self):
        return self.responsavel.cpf if self.responsavel else None

    @property
    def responsavel_celular(self):
        return self.responsavel.celular if self.responsavel else None

    @property
    def responsavel_parentesco(self):
        return self.responsavel.parentesco if self.responsavel else None

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

    @property
    def turma_ids(self):
        return sorted(vinculo.turma_id for vinculo in self.vinculos_turma)


from ..atividades.models import Atividade  # noqa: E402
from ..faixas.models import Faixa  # noqa: E402
from ..responsaveis.models import Responsavel  # noqa: E402
from ..turmas.models import Turma  # noqa: E402