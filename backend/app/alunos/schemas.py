from datetime import date
from pydantic import BaseModel, Field


class AlunoCriar(BaseModel):

    nome: str = Field(min_length=2)
    cpf: str | None = None
    data_nascimento: date | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool = False
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None


class AlunoPublico(BaseModel):

    id: int
    nome: str
    cpf: str | None
    data_nascimento: date | None = None
    faixa_id: int
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None
    tamanho_kimono: str | None
    tamanho_faixa: str | None
    faixa_grossa: bool = False
    codigo_zempo: str | None
    peso: float | None = None
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None


class AlunoAtualizar(BaseModel):

    nome: str | None = None
    cpf: str | None = None
    data_nascimento: date | None = None
    faixa_id: int | None = None
    proxima_faixa: str | None = None
    turma_id: int | None = None
    turma: str | None = None
    tamanho_kimono: str | None = None
    tamanho_faixa: str | None = None
    faixa_grossa: bool | None = None
    codigo_zempo: str | None = None
    peso: float | None = Field(default=None, gt=0, le=500)
    responsavel_nome: str | None = None
    responsavel_cpf: str | None = None
    responsavel_celular: str | None = None