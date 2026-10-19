from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import FaixaAtualizar, FaixaEntrada, FaixaPublico

router = APIRouter(
    prefix="/faixas",
    tags=["Faixas"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[FaixaPublico])
def listar(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(db, usuario)


@router.post("/", response_model=FaixaPublico, status_code=201)
def criar(
    dados: FaixaEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.criar(db, usuario, dados.model_dump())


@router.get("/{faixa_id}", response_model=FaixaPublico)
def buscar(
    faixa_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(db, usuario, faixa_id)


@router.patch("/{faixa_id}", response_model=FaixaPublico)
def atualizar(
    faixa_id: int,
    dados: FaixaAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.atualizar(db, usuario, faixa_id, dados.model_dump(exclude_unset=True))


@router.delete("/{faixa_id}", status_code=204)
def apagar(
    faixa_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, usuario, faixa_id)
