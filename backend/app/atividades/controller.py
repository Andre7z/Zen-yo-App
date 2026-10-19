from fastapi import APIRouter, Depends, Response
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


@router.get("/{atividade_id}/relatorio/controle-de-faixas")
def controle_de_faixas(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_faixas(db, usuario, atividade_id)


@router.get("/{atividade_id}/relatorio/controle-de-faixas.xlsx")
def controle_de_faixas_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_faixas_xlsx(db, usuario, atividade_id)
    return Response(
        content=conteudo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="controle-de-faixas.xlsx"'},
    )


@router.get("/{atividade_id}/relatorio/controle-de-kimonos")
def controle_de_kimonos(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_kimonos(db, usuario, atividade_id)


@router.get("/{atividade_id}/relatorio/controle-de-kimonos.xlsx")
def controle_de_kimonos_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_kimonos_xlsx(db, usuario, atividade_id)
    return Response(
        content=conteudo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="controle-de-kimonos.xlsx"'},
    )


@router.get("/{atividade_id}/relatorio/controle-de-frequencia")
def controle_de_frequencia(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_frequencia(db, usuario, atividade_id)


@router.get("/{atividade_id}/relatorio/controle-de-frequencia.xlsx")
def controle_de_frequencia_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_frequencia_xlsx(db, usuario, atividade_id)
    return Response(
        content=conteudo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="controle-de-frequencia.xlsx"'},
    )