from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .dependencias import obter_facade
from .facade import TurmaFacade
from .schemas import TurmaAtualizar, TurmaEntrada, TurmaPublico

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[TurmaPublico])
def listar(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar(db, usuario)


@router.post("/", response_model=TurmaPublico, status_code=201)
def criar(
    dados: TurmaEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    facade: TurmaFacade = Depends(obter_facade),
):
    return facade.criar(db, usuario, dados.model_dump())


@router.get("/{turma_id}", response_model=TurmaPublico)
def buscar(
    turma_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(db, usuario, turma_id)


@router.patch("/{turma_id}", response_model=TurmaPublico)
def atualizar(
    turma_id: int,
    dados: TurmaAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
    facade: TurmaFacade = Depends(obter_facade),
):
    return facade.atualizar(
        db,
        usuario,
        turma_id,
        dados.model_dump(exclude_unset=True),
    )


@router.delete("/{turma_id}", status_code=204)
def apagar(
    turma_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, usuario, turma_id)
