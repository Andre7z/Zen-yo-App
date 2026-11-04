from datetime import date
from calendar import monthrange
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.alunos.cpf import normalizar_cpf

Genero = Literal["Masculino", "Feminino"]


class _ValidaDadosAluno(BaseModel):

    @field_validator("cpf", "responsavel_cpf", check_fields=False)
    @classmethod
    def validar_cpf(cls, valor: str | None) -> str | None:
        return normalizar_cpf(valor)

    @field_validator("data_nascimento", check_fields=False)
    @classmethod
    def validar_data_nascimento(cls, valor: date | None) -> date | None:
        if valor is None:
            return valor

        hoje = date.today()
        if valor > hoje:
            raise ValueError("A data de nascimento não pode ser futura")

        ano_limite = hoje.year - 122
        ultimo_dia = monthrange(ano_limite, hoje.month)[1]
        data_limite = date(ano_limite, hoje.month, min(hoje.day, ultimo_dia))
        if valor < data_limite:
            raise ValueError("A data de nascimento deve estar dentro dos últimos 122 anos")
        return valor


class AlunoCriar(_ValidaDadosAluno):

    nome: str = Field(min_length=2)
    cpf: str | None = None
    data_nascimento: date | None = None
    genero: Genero | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    celular: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool = False
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None


class AlunoPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cpf: str | None
    data_nascimento: date | None = None
    genero: str | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    turma_ids: list[int] = Field(default_factory=list)
    celular: str | None = None
    tamanho_kimono: str | None
    tamanho_faixa: str | None
    faixa_grossa: bool = False
    codigo_zempo: str | None
    peso: float | None = None
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None
    responsavel_parentesco: str | None = None


class AlunoAtualizar(_ValidaDadosAluno):

    nome: str | None = None
    cpf: str | None = None
    data_nascimento: date | None = None
    genero: Genero | None = None
    faixa_id: int | None = None
    proxima_faixa: str | None = None
    celular: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool | None = None
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None
    responsavel_parentesco: str | None = None