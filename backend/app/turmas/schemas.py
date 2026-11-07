from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator
from ..validacoes import texto_legivel as _texto_legivel


class TurmaEntrada(BaseModel):
    nome: str
    nucleo: str = Field(max_length=120)

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")

    @field_validator("nucleo")
    @classmethod
    def nucleo_legivel(cls, v):
        return _texto_legivel(v, "núcleo")


class TurmaPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    nucleo: str | None


class TurmaAtualizar(BaseModel):
    nome: str | None = None
    nucleo: str | None = Field(default=None, max_length=120)

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")

    @field_validator("nucleo")
    @classmethod
    def nucleo_legivel(cls, v):
        if v is None:
            raise ValueError("o núcleo é obrigatório")
        return _texto_legivel(v, "núcleo")


class AlunosTurmaEntrada(BaseModel):
    aluno_ids: list[int] = Field(default_factory=list)


class PresencaEntrada(BaseModel):
    aluno_id: int
    presente: bool


class ChamadaEntrada(BaseModel):
    alunos: list[PresencaEntrada]


class PresencaPublico(BaseModel):
    aluno_id: int
    nome: str
    presente: bool


class ChamadaPublico(BaseModel):
    data: date
    registrada: bool
    alunos: list[PresencaPublico]
