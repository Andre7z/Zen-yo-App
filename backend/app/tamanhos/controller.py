from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import TamanhoAtualizar, TamanhoEntrada, TamanhoPublico

router = APIRouter(
    prefix="/tamanhos",
    tags=["Tamanhos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[TamanhoPublico])
def listar(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(db, usuario)


@router.post("/", response_model=TamanhoPublico, status_code=201)
def criar(
    dados: TamanhoEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.criar(db, usuario, dados.model_dump())


@router.patch("/{tamanho_id}", response_model=TamanhoPublico)
def atualizar(
    tamanho_id: int,
    dados: TamanhoAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.atualizar(db, usuario, tamanho_id, dados.model_dump(exclude_unset=True))


@router.delete("/{tamanho_id}", status_code=204)
def apagar(
    tamanho_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, usuario, tamanho_id)
