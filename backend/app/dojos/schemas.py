from pydantic import BaseModel, ConfigDict, field_validator
from ..validacoes import texto_legivel as _texto_legivel


class DojoEntrada(BaseModel):
    nome: str
    cidade: str | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")

    @field_validator("cidade")
    @classmethod
    def cidade_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "cidade")


class DojoPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    cidade: str | None = None


class DojoAtualizar(BaseModel):
    nome: str | None = None
    cidade: str | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")

    @field_validator("cidade")
    @classmethod
    def cidade_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "cidade")
