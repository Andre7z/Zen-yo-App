import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..nomes import primeiro_e_ultimo_nome
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


def _resposta_planilha(conteudo, nome, professor):
    nome_seguro = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '-', nome).strip().upper() or "PLANILHA"
    nome_professor = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '-', primeiro_e_ultimo_nome(professor).upper())
    nome_seguro = f"{nome_seguro} - SENSEI {nome_professor}"
    return Response(
        content=conteudo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(nome_seguro + '.xlsx', safe='')}"},
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


@router.get("/{atividade_id}/planilha")
def gerar_planilha(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.gerar_planilha(
        db,
        usuario,
        atividade_id
    )


@router.get("/{atividade_id}/planilha/controle-de-faixas")
def controle_de_faixas(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_faixas(db, usuario, atividade_id)


@router.get("/{atividade_id}/planilha/controle-de-faixas.xlsx")
def controle_de_faixas_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_faixas_xlsx(db, usuario, atividade_id)
    return _resposta_planilha(conteudo, service.buscar(db, usuario, atividade_id).nome, usuario.nome)


@router.get("/{atividade_id}/planilha/controle-de-kimonos")
def controle_de_kimonos(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_kimonos(db, usuario, atividade_id)


@router.get("/{atividade_id}/planilha/controle-de-kimonos.xlsx")
def controle_de_kimonos_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_kimonos_xlsx(db, usuario, atividade_id)
    return _resposta_planilha(conteudo, service.buscar(db, usuario, atividade_id).nome, usuario.nome)


@router.get("/{atividade_id}/planilha/controle-de-campeonato")
def controle_de_campeonato(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_campeonato(db, usuario, atividade_id)


@router.get("/{atividade_id}/planilha/controle-de-campeonato.xlsx")
def controle_de_campeonato_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_campeonato_xlsx(db, usuario, atividade_id)
    return _resposta_planilha(conteudo, service.buscar(db, usuario, atividade_id).nome, usuario.nome)


@router.get("/{atividade_id}/planilha/controle-de-frequencia")
def controle_de_frequencia(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.controle_de_frequencia(db, usuario, atividade_id)


@router.get("/{atividade_id}/planilha/controle-de-frequencia.xlsx")
def controle_de_frequencia_xlsx(
    atividade_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conteudo = service.controle_de_frequencia_xlsx(db, usuario, atividade_id)
    return _resposta_planilha(conteudo, service.buscar(db, usuario, atividade_id).nome, usuario.nome)