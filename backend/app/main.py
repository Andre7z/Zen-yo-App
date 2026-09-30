import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .alunos import controller as alunos_controller
from .alunos.erros import ErroAluno, AlunoNaoEncontrado

from .anexos import controller as anexos_controller
from .anexos.erros import AnexoNaoEncontrado, ErroAnexo

from .atividades import controller as atividades_controller
from .atividades.erros import ErroAtividade, AtividadeNaoEncontrada

from .dojos import controller as dojos_controller
from .dojos.erros import DojoNaoEncontrado, ErroDojo

from .faixas import controller as faixas_controller
from .faixas.erros import ErroFaixa, FaixaNaoEncontrada

from .turmas import controller as turmas_controller
from .turmas.erros import ErroTurma, TurmaNaoEncontrada

from .usuarios import controller as usuarios_controller
from .usuarios.erros import CredenciaisInvalidas, ErroDeUsuario


# Nao ha' mais create_all aqui. Quem cria -- e MUDA -- tabelas agora e'
# o Alembic: poetry run alembic upgrade head
# Uma vez ao clonar o projeto, e de novo a cada migracao nova.

app = FastAPI(title="API do Meu Projeto", version="0.4.0")
origens_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origem.strip() for origem in origens_cors if origem.strip()],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(usuarios_controller.router)
app.include_router(alunos_controller.router)
app.include_router(atividades_controller.router)
app.include_router(anexos_controller.router)
app.include_router(faixas_controller.router)
app.include_router(dojos_controller.router)
app.include_router(turmas_controller.router)


@app.exception_handler(ErroAluno)
def traduzir_recusa(request: Request, erro: ErroAluno):
    """O unico lugar do sistema que transforma recusa em numero HTTP."""
    codigo = 404 if isinstance(erro, AlunoNaoEncontrado) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroAtividade)
def traduzir_recusa_de_atividade(request: Request, erro: ErroAtividade):
    codigo = 404 if isinstance(erro, AtividadeNaoEncontrada) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroAnexo)
def traduzir_recusa_de_anexo(request: Request, erro: ErroAnexo):
    codigo = 404 if isinstance(erro, AnexoNaoEncontrado) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroFaixa)
def traduzir_recusa_de_faixa(request: Request, erro: ErroFaixa):
    codigo = 404 if isinstance(erro, FaixaNaoEncontrada) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroDojo)
def traduzir_recusa_de_dojo(request: Request, erro: ErroDojo):
    codigo = 404 if isinstance(erro, DojoNaoEncontrado) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroTurma)
def traduzir_recusa_de_turma(request: Request, erro: ErroTurma):
    codigo = 404 if isinstance(erro, TurmaNaoEncontrada) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroDeUsuario)
def traduzir_recusa_de_usuario(request: Request, erro: ErroDeUsuario):
    if isinstance(erro, CredenciaisInvalidas):
        # 401 e' "nao sei quem voce e'". O cabecalho diz como se apresentar.
        return JSONResponse(
            status_code=401,
            content={"detail": str(erro)},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return JSONResponse(status_code=409, content={"detail": str(erro)})