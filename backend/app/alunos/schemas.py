from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.alunos.cpf import normalizar_cpf

Genero = Literal["Masculino", "Feminino"]


class _ValidaCpf(BaseModel):

    @field_validator("cpf", "responsavel_cpf", check_fields=False)
    @classmethod
    def validar_cpf(cls, valor: str | None) -> str | None:
        return normalizar_cpf(valor)


class AlunoCriar(_ValidaCpf):

    nome: str = Field(min_length=2)
    cpf: str | None = None
    data_nascimento: date | None = None
    genero: Genero | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool = False
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None


class AlunoPublico(BaseModel):

    id: int
    nome: str
    cpf: str | None
    data_nascimento: date | None = None
    genero: str | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None
    tamanho_kimono: str | None
    tamanho_faixa: str | None
    faixa_grossa: bool = False
    codigo_zempo: str | None
    peso: float | None = None
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None


class AlunoAtualizar(_ValidaCpf):

    nome: str | None = None
    cpf: str | None = None
    data_nascimento: date | None = None
    genero: Genero | None = None
    faixa_id: int | None = None
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool | None = None
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None