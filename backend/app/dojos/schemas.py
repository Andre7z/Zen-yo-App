from pydantic import BaseModel, ConfigDict, field_validator


def _texto_legivel(texto, campo):
    if texto is None:
        return None
    valor = texto.strip()
    if len(valor) < 2:
        raise ValueError(f"o {campo} precisa ter pelo menos 2 caracteres")
    return valor


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
