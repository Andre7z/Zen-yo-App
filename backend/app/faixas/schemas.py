from pydantic import BaseModel, ConfigDict, field_validator
from ..validacoes import texto_legivel as _texto_legivel


class FaixaEntrada(BaseModel):
    nome: str
    tipo: str
    ordem: int = 1

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v):
        valor = _texto_legivel(v, "tipo")
        permitido = {"Kyu", "Dan"}
        if valor not in permitido:
            raise ValueError("tipo deve ser 'Kyu' ou 'Dan'")
        return valor

    @field_validator("ordem")
    @classmethod
    def ordem_valida(cls, v):
        if v < 1:
            raise ValueError("ordem deve ser maior ou igual a 1")
        return v


class FaixaPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: str
    ordem: int


class FaixaAtualizar(BaseModel):
    nome: str | None = None
    tipo: str | None = None
    ordem: int | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v):
        if v is None:
            return None
        valor = _texto_legivel(v, "tipo")
        if valor not in {"Kyu", "Dan"}:
            raise ValueError("tipo deve ser 'Kyu' ou 'Dan'")
        return valor

    @field_validator("ordem")
    @classmethod
    def ordem_valida(cls, v):
        if v is None:
            return None
        if v < 1:
            raise ValueError("ordem deve ser maior ou igual a 1")
        return v
