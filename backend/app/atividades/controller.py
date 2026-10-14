from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario

from . import service
from .dependencias import obter_facade
from .facade import AtividadeFacade
from .schemas import (
    AtividadeEntrada,
    AtividadeAtualizar,
    AtividadePublico,
)


# A porta continua no router: nenhuma rota roda sem token.
# Cada rota tambem recebe o usuario, porque o Service precisa saber
# quem esta fazendo a operacao.
router = APIRouter(
    prefix="/atividades",
    tags=["Atividades"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[AtividadePublico])
def listar(
    tipo: str | None = None,
    nome: str | None = None,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(
        db,
        usuario,
        tipo,
        nome,
    )


@router.post("/", response_model=AtividadePublico, status_code=201)
def criar(
    dados: AtividadeEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    facade: AtividadeFacade = Depends(obter_facade),
):
    return facade.criar(
        db,
        usuario,
        dados.model_dump(),
    )


@router.get("/{atividade_id}", response_model=AtividadePublico)
def buscar(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(
        db,
        usuario,
        atividade_id
    )


@router.patch("/{atividade_id}", response_model=AtividadePublico)
def atualizar(
    atividade_id: int,
    dados: AtividadeAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    facade: AtividadeFacade = Depends(obter_facade),
):
    return facade.atualizar(
        db,
        usuario,
        atividade_id,
        dados.model_dump(exclude_unset=True),
    )


@router.delete("/{atividade_id}", status_code=204)
def apagar(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(
        db,
        usuario,
        atividade_id
    )


@router.get("/{atividade_id}/relatorio")
def gerar_relatorio(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.gerar_relatorio(
        db,
        usuario,
        atividade_id
    )