from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

Tipo = Literal["kimono", "faixa"]


def _limpar(nome: str) -> str:
    nome = nome.strip().upper()
    if not nome:
        raise ValueError("Informe o tamanho.")
    if len(nome) > 5:
        raise ValueError("O tamanho deve ter no maximo 5 caracteres.")
    return nome


class TamanhoEntrada(BaseModel):
    tipo: Tipo
    nome: str

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, nome: str) -> str:
        return _limpar(nome)


class TamanhoAtualizar(BaseModel):
    nome: str | None = None
    ordem: int | None = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, nome: str | None) -> str | None:
        return None if nome is None else _limpar(nome)


class TamanhoPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    nome: str
    ordem: int
