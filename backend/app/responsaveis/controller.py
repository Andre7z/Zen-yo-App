from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..alunos import service as alunos_service
from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import ResponsavelEntrada, ResponsavelPublico

router = APIRouter(
    prefix="/aluno/{aluno_id}/responsavel",
    tags=["Responsaveis"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=ResponsavelPublico)
def buscar(
    aluno_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    aluno = alunos_service.buscar(db, usuario, aluno_id)
    return service.buscar(db, aluno)


@router.put("/", response_model=ResponsavelPublico)
def salvar(
    aluno_id: int,
    dados: ResponsavelEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    aluno = alunos_service.buscar(db, usuario, aluno_id)
    return service.salvar(db, aluno, dados.model_dump())


@router.delete("/", status_code=204)
def apagar(
    aluno_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    aluno = alunos_service.buscar(db, usuario, aluno_id)
    service.apagar(db, aluno)
