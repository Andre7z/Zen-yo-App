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

from .faixas import controller as faixas_controller
from .faixas.erros import ErroFaixa, FaixaNaoEncontrada

from .turmas import controller as turmas_controller
from .turmas.erros import ErroTurma, TurmaNaoEncontrada

from .tamanhos import controller as tamanhos_controller
from .tamanhos.erros import ErroTamanho, TamanhoNaoEncontrado

from .usuarios import controller as usuarios_controller
from .usuarios.erros import CredenciaisInvalidas, ErroDeUsuario


# Nao ha' mais create_all aqui. Quem cria -- e MUDA -- tabelas agora e'
# o Alembic: poetry run alembic upgrade head
# Uma vez ao clonar o projeto, e de novo a cada migracao nova.

app = FastAPI(title="API do Meu Projeto", version="0.4.0")
origens_cors = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
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
app.include_router(turmas_controller.router)
app.include_router(tamanhos_controller.router)


def _resposta_erro_de_dominio(erro: Exception, tipo_nao_encontrado: type[Exception]):
    codigo = 404 if isinstance(erro, tipo_nao_encontrado) else 409
    return JSONResponse(status_code=codigo, content={"detail": str(erro)})


@app.exception_handler(ErroAluno)
def traduzir_recusa(request: Request, erro: ErroAluno):
    """O unico lugar do sistema que transforma recusa em numero HTTP."""
    return _resposta_erro_de_dominio(erro, AlunoNaoEncontrado)


@app.exception_handler(ErroAtividade)
def traduzir_recusa_de_atividade(request: Request, erro: ErroAtividade):
    return _resposta_erro_de_dominio(erro, AtividadeNaoEncontrada)


@app.exception_handler(ErroAnexo)
def traduzir_recusa_de_anexo(request: Request, erro: ErroAnexo):
    return _resposta_erro_de_dominio(erro, AnexoNaoEncontrado)


@app.exception_handler(ErroFaixa)
def traduzir_recusa_de_faixa(request: Request, erro: ErroFaixa):
    return _resposta_erro_de_dominio(erro, FaixaNaoEncontrada)


@app.exception_handler(ErroTurma)
def traduzir_recusa_de_turma(request: Request, erro: ErroTurma):
    return _resposta_erro_de_dominio(erro, TurmaNaoEncontrada)


@app.exception_handler(ErroTamanho)
def traduzir_recusa_de_tamanho(request: Request, erro: ErroTamanho):
    return _resposta_erro_de_dominio(erro, TamanhoNaoEncontrado)


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