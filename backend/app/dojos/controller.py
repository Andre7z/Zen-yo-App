from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import DojoAtualizar, DojoEntrada, DojoPublico

router = APIRouter(
    prefix="/dojos",
    tags=["Dojos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[DojoPublico])
def listar(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(db)


@router.post("/", response_model=DojoPublico, status_code=201)
def criar(
    dados: DojoEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.criar(db, dados.model_dump())


@router.get("/{dojo_id}", response_model=DojoPublico)
def buscar(
    dojo_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(db, dojo_id)


@router.patch("/{dojo_id}", response_model=DojoPublico)
def atualizar(
    dojo_id: int,
    dados: DojoAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.atualizar(db, dojo_id, dados.model_dump(exclude_unset=True))


@router.delete("/{dojo_id}", status_code=204)
def apagar(
    dojo_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, dojo_id)
