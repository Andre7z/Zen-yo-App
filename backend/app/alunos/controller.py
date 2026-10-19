from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import AlunoAtualizar, AlunoCriar, AlunoPublico

router = APIRouter(
    prefix="/aluno",
    tags=["Aluno"],
    dependencies=[Depends(get_current_user)],
)

# Nenhum `if` de regra e nenhum `try` aqui: as recusas do Service viram
# HTTP no tradutor registrado no main.py, uma vez para todas as rotas.


@router.get("/", response_model=list[AlunoPublico])
def listar(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    return service.listar(db, usuario)


@router.post("/", response_model=AlunoPublico, status_code=201)
def criar(
    dados: AlunoCriar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.criar(db, usuario, dados.model_dump())


@router.get("/{aluno_id}", response_model=AlunoPublico)
def buscar(
    aluno_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.buscar(db, usuario, aluno_id)


@router.patch("/{aluno_id}", response_model=AlunoPublico)
def atualizar(
    aluno_id: int,
    dados: AlunoAtualizar,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.atualizar(db, usuario, aluno_id, dados.model_dump(exclude_unset=True))


@router.delete("/{aluno_id}", status_code=204)
def apagar(
    aluno_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.apagar(db, usuario, aluno_id)
