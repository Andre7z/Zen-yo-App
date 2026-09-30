from pydantic import BaseModel, ConfigDict, field_validator


def _texto_legivel(texto, campo):
    if texto is None:
        return None
    valor = texto.strip()
    if len(valor) < 2:
        raise ValueError(f"o {campo} precisa ter pelo menos 2 caracteres")
    return valor


class TurmaEntrada(BaseModel):
    nome: str
    dojo_id: int
    professor_id: int | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")


class TurmaPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    dojo_id: int
    professor_id: int | None = None


class TurmaAtualizar(BaseModel):
    nome: str | None = None
    dojo_id: int | None = None
    professor_id: int | None = None

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome")
