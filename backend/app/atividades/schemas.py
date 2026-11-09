from datetime import date

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator
from ..validacoes import texto_legivel as _texto_legivel


def _validar_data_atividade(valor: date) -> date:
    if not date(2000, 1, 1) <= valor <= date(2150, 12, 31):
        raise ValueError("A data da atividade deve estar entre 2000 e 2150")
    return valor


class AtividadeEntrada(BaseModel):  # ENTRA no cadastro
    tipo: str
    nome: str
    data: date
    local: str | None = None
    descricao: str | None = None

    aluno_ids: list[int] = Field(default_factory=list)
    aluno_ids_confirmados: list[int] = Field(default_factory=list, validation_alias=AliasChoices("aluno_ids_confirmados", "aluno_ids_pagos"))
    nova_faixa: str | None = None
    presenca: bool | None = None

    @model_validator(mode="after")
    def confirmacoes_sao_de_participantes(self):
        if not set(self.aluno_ids_confirmados).issubset(self.aluno_ids):
            raise ValueError("Somente alunos participantes podem ter confirmacao")
        return self

    @field_validator("tipo")
    @classmethod
    def tipo_legivel(cls, v):
        return _texto_legivel(v, "tipo")

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return _texto_legivel(v, "nome")

    @field_validator("local")
    @classmethod
    def local_legivel(cls, v):
        return v if v is None else _texto_legivel(v, "local")

    @field_validator("descricao")
    @classmethod
    def descricao_legivel(cls, v):
        return v if v is None else v.strip()

    @field_validator("data")
    @classmethod
    def data_no_periodo_permitido(cls, valor: date) -> date:
        return _validar_data_atividade(valor)


class AtividadePublico(BaseModel):  # SAI na resposta
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    nome: str
    data: date
    local: str | None = None
    descricao: str | None = None

    aluno_ids: list[int]
    aluno_ids_confirmados: list[int]
    nova_faixa: str | None = None
    presenca: bool | None = None


class AtividadeAtualizar(BaseModel):  # ENTRA na edição, tudo opcional
    tipo: str | None = None
    nome: str | None = None
    data: date | None = None
    local: str | None = None
    descricao: str | None = None

    aluno_ids: list[int] | None = None
    aluno_ids_confirmados: list[int] | None = Field(default=None, validation_alias=AliasChoices("aluno_ids_confirmados", "aluno_ids_pagos"))
    nova_faixa: str | None = None
    presenca: bool | None = None

    @model_validator(mode="after")
    def confirmacoes_sao_de_participantes(self):
        if self.aluno_ids_confirmados is not None:
            if self.aluno_ids is None:
                raise ValueError("Envie aluno_ids junto com aluno_ids_confirmados")
            if not set(self.aluno_ids_confirmados).issubset(self.aluno_ids):
                raise ValueError("Somente alunos participantes podem ter confirmacao")
        return self

    @field_validator("tipo")
    @classmethod
    def tipo_legivel(cls, v):
        return v if v is None else _texto_legivel(v, "tipo")

    @field_validator("nome")
    @classmethod
    def nome_legivel(cls, v):
        return v if v is None else _texto_legivel(v, "nome")

    @field_validator("local")
    @classmethod
    def local_legivel(cls, v):
        return v if v is None else _texto_legivel(v, "local")

    @field_validator("descricao")
    @classmethod
    def descricao_legivel(cls, v):
        return v if v is None else v.strip()

    @field_validator("data")
    @classmethod
    def data_no_periodo_permitido(cls, valor: date | None) -> date | None:
        return None if valor is None else _validar_data_atividade(valor)


class GraduacaoAluno(BaseModel):
    aluno_id: int
    faixa_id: int
    tamanho_faixa: str | None = None
    faixa_grossa: bool = False


class GraduacaoEmLote(BaseModel):
    alunos: list[GraduacaoAluno] = Field(min_length=1)

    @model_validator(mode="after")
    def alunos_sem_duplicatas(self):
        ids = [aluno.aluno_id for aluno in self.alunos]
        if len(ids) != len(set(ids)):
            raise ValueError("Cada aluno pode aparecer apenas uma vez")
        return self