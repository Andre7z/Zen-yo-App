from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator

CATEGORIAS_ANEXO = {
    "Calendarios",
    "Panilhas",
    "Fichas",
    "Regulamento",
    "Regulamentos",
    "Outro",
}


def _texto_legivel(texto, campo):
    if texto is None:
        return None
    valor = texto.strip()
    if len(valor) < 2:
        raise ValueError(f"o {campo} precisa ter pelo menos 2 caracteres")
    return valor


class AnexoEntrada(BaseModel):
    titulo: str
    categoria: str
    descricao: str | None = None
    nome_arquivo: str | None = None
    arquivo_url: str | None = None
    link: str | None = None

    @field_validator("titulo")
    @classmethod
    def titulo_legivel(cls, v):
        return _texto_legivel(v, "titulo")

    @field_validator("categoria")
    @classmethod
    def categoria_valida(cls, v):
        valor = _texto_legivel(v, "categoria")
        if valor not in CATEGORIAS_ANEXO:
            aceitos = ", ".join(sorted(CATEGORIAS_ANEXO))
            raise ValueError(f"categoria invalida: {valor!r}. Aceitos: {aceitos}")
        return valor

    @field_validator("descricao")
    @classmethod
    def descricao_legivel(cls, v):
        return None if v is None else v.strip()

    @field_validator("nome_arquivo")
    @classmethod
    def nome_arquivo_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome_arquivo")

    @field_validator("arquivo_url", "link")
    @classmethod
    def url_legivel(cls, v):
        return None if v is None else v.strip()


class AnexoPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    categoria: str
    descricao: str | None = None
    nome_arquivo: str | None = None
    arquivo_url: str | None = None
    link: str | None = None
    criado_em: date


class AnexoAtualizar(BaseModel):
    titulo: str | None = None
    categoria: str | None = None
    descricao: str | None = None
    nome_arquivo: str | None = None
    arquivo_url: str | None = None
    link: str | None = None

    @field_validator("titulo")
    @classmethod
    def titulo_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "titulo")

    @field_validator("categoria")
    @classmethod
    def categoria_valida(cls, v):
        if v is None:
            return None
        valor = _texto_legivel(v, "categoria")
        if valor not in CATEGORIAS_ANEXO:
            aceitos = ", ".join(sorted(CATEGORIAS_ANEXO))
            raise ValueError(f"categoria invalida: {valor!r}. Aceitos: {aceitos}")
        return valor

    @field_validator("descricao")
    @classmethod
    def descricao_legivel(cls, v):
        return None if v is None else v.strip()

    @field_validator("nome_arquivo")
    @classmethod
    def nome_arquivo_legivel(cls, v):
        return None if v is None else _texto_legivel(v, "nome_arquivo")

    @field_validator("arquivo_url", "link")
    @classmethod
    def url_legivel(cls, v):
        return None if v is None else v.strip()
