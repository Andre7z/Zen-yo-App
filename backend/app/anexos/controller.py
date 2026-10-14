from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import AnexoAtualizar, AnexoEntrada, AnexoPublico

router = APIRouter(
    prefix="/anexos",
    tags=["Anexos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[AnexoPublico])
def listar(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(db, usuario)


@router.post("/", response_model=AnexoPublico, status_code=201)
def criar(
    dados: AnexoEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.criar(db, usuario, dados.model_dump())


@router.get("/{anexo_id}", response_model=AnexoPublico)
def buscar(
    anexo_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(db, usuario, anexo_id)


@router.patch("/{anexo_id}", response_model=AnexoPublico)
def atualizar(
    anexo_id: int,
    dados: AnexoAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.atualizar(
        db,
        usuario,
        anexo_id,
        dados.model_dump(exclude_unset=True),
    )


@router.delete("/{anexo_id}", status_code=204)
def apagar(
    anexo_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, usuario, anexo_id)
