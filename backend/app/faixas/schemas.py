from pydantic import BaseModel, ConfigDict, Field, field_validator
from ..validacoes import texto_legivel as _texto_legivel

TIPOS_PERMITIDOS = {"Iniciante", "Kyu", "Dan"}


def _validar_tipo(v):
    valor = _texto_legivel(v, "tipo")
    if valor not in TIPOS_PERMITIDOS:
        raise ValueError("tipo deve ser 'Iniciante', 'Kyu' ou 'Dan'")
    return valor


class FaixaEntrada(BaseModel):
    nome: str
    tipo: str
    grau: int | None = Field(default=None, ge=1)

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v):
        return _validar_tipo(v)


class FaixaPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: str
    grau: int | None = None
    ordem: int


class FaixaAtualizar(BaseModel):
    nome: str | None = None
    tipo: str | None = None
    grau: int | None = Field(default=None, ge=1)

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v):
        return None if v is None else _validar_tipo(v)
