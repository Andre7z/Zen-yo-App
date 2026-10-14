from datetime import date
from pydantic import BaseModel, Field


class AlunoCriar(BaseModel):

    nome: str = Field(min_length=2)
    cpf: str = Field(min_length=11)
    data_nascimento: date | None = None
    faixa_id: int
    turma: str | None = Field(default=None, min_length=2)
    tamanho_kimono: str = Field(min_length=2)
    tamanho_faixa: str = Field(min_length=1)
    codigo_zempo: str = Field(min_length=2)


class AlunoPublico(BaseModel):

    id: int
    nome: str
    cpf: str
    data_nascimento: date | None = None
    faixa_id: int
    turma: str | None
    tamanho_kimono: str
    tamanho_faixa: str
    codigo_zempo: str


class AlunoAtualizar(BaseModel):

    nome: str | None = None
    cpf: str | None = None
    data_nascimento: date | None = None
    faixa_id: int | None = None
    turma: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    codigo_zempo: str | None = None