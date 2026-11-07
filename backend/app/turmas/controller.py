from datetime import date
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..nomes import primeiro_e_ultimo_nome
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .dependencias import obter_facade
from .facade import TurmaFacade
from .schemas import AlunosTurmaEntrada, ChamadaEntrada, ChamadaPublico, TurmaAtualizar, TurmaEntrada, TurmaPublico

router = APIRouter(
    prefix="/turmas",
    tags=["Turmas"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/planilha-de-frequencia.xlsx")
def exportar_frequencia(
    turma_ids: list[int] = Query(min_length=1),
    ano: int = Query(ge=1, le=9999),
    mes: int = Query(ge=1, le=12),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from .planilha_frequencia import MESES

    conteudo = service.planilha_frequencia(db, usuario, turma_ids, ano, mes)
    nome = re.sub(r'[\\/:*?"<>|\x00-\x1f]', '-', f"FREQUÊNCIA DE {MESES[mes - 1]} {ano} - SENSEI {primeiro_e_ultimo_nome(usuario.nome).upper()}.xlsx")
    return Response(
        content=conteudo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(nome, safe='')}"},
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


@router.post("/{turma_id}/alunos", status_code=204)
def adicionar_alunos(
    turma_id: int,
    dados: AlunosTurmaEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.adicionar_alunos(db, usuario, turma_id, dados.aluno_ids)


@router.delete("/{turma_id}/alunos/{aluno_id}", status_code=204)
def remover_aluno(
    turma_id: int,
    aluno_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.remover_aluno(db, usuario, turma_id, aluno_id)


@router.get("/{turma_id}/frequencias/{data}", response_model=ChamadaPublico)
def consultar_frequencia(
    turma_id: int,
    data: date,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.consultar_chamada(db, usuario, turma_id, data)


@router.get("/{turma_id}/frequencias", response_model=list[date])
def listar_frequencias(
    turma_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.listar_datas_chamadas(db, usuario, turma_id)


@router.put("/{turma_id}/frequencias/{data}", response_model=ChamadaPublico)
def registrar_frequencia(
    turma_id: int,
    data: date,
    dados: ChamadaEntrada,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.salvar_chamada(db, usuario, turma_id, data, dados.alunos)
