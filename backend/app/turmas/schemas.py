from pydantic import BaseModel, ConfigDict, field_validator
from ..validacoes import texto_legivel as _texto_legivel


class TurmaEntrada(BaseModel):
    nome: str

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")


class TurmaPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str


class TurmaAtualizar(BaseModel):
    nome: str | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")
