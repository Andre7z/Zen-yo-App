from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioCriar(BaseModel):        # ENTRA no cadastro
    nome: str = Field(min_length=2)
    email: EmailStr                   # "abc" nem chega ao seu codigo: 422
    senha: str = Field(min_length=6)


class UsuarioPublico(BaseModel):      # SAI na resposta -- sem senha, sem hash
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr


class UsuarioAtualizar(BaseModel):    # ENTRA na edicao do perfil, tudo opcional
    nome: str | None = Field(default=None, min_length=2, max_length=80)
    email: EmailStr | None = None
    nova_senha: str | None = Field(default=None, min_length=6)
    # Trocar e-mail ou senha exige provar quem e' com a senha atual.
    senha_atual: str | None = None


class Token(BaseModel):               # SAI no login
    access_token: str
    token_type: str = "bearer"
