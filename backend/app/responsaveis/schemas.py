from pydantic import BaseModel, ConfigDict, field_validator

from ..alunos.cpf import normalizar_cpf


class ResponsavelDados(BaseModel):
    nome: str | None = None
    cpf: str | None = None
    celular: str | None = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor: str | None) -> str | None:
        return normalizar_cpf(valor)


class ResponsavelEntrada(ResponsavelDados):
    pass


class ResponsavelPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    nome: str | None = None
    cpf: str | None = None
    celular: str | None = None
