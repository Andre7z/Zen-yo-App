import re
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..database import get_db
from ..seguranca import get_current_user
from ..usuarios.models import Usuario
from . import service
from .schemas import AnexoAtualizar, AnexoEntrada, AnexoPublico

_DIRETORIO_ARQUIVOS = Path(__file__).resolve().parents[2] / "uploads" / "anexos"
_TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024

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


async def _salvar_arquivo(arquivo: UploadFile):
    nome = (arquivo.filename or "").replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not nome:
        raise HTTPException(status_code=422, detail="Selecione um arquivo.")

    conteudo = await arquivo.read(_TAMANHO_MAXIMO_ARQUIVO + 1)
    await arquivo.close()
    if len(conteudo) > _TAMANHO_MAXIMO_ARQUIVO:
        raise HTTPException(status_code=413, detail="O arquivo deve ter no máximo 10 MB.")

    chave = uuid4().hex
    caminho = _DIRETORIO_ARQUIVOS / chave
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_bytes(conteudo)
    return caminho, nome[:160], f"/anexos/arquivos/{chave}"


def _remover_arquivo(arquivo_url: str | None):
    if not arquivo_url:
        return
    correspondencia = re.fullmatch(r"/anexos/arquivos/([a-f0-9]{32})", arquivo_url)
    if correspondencia:
        (_DIRETORIO_ARQUIVOS / correspondencia.group(1)).unlink(missing_ok=True)


@router.post("/upload", response_model=AnexoPublico, status_code=201)
async def criar_com_arquivo(
    titulo: str = Form(...),
    categoria: str = Form(...),
    descricao: str | None = Form(None),
    link: str | None = Form(None),
    arquivo: UploadFile = File(...),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        dados = AnexoEntrada(titulo=titulo, categoria=categoria, descricao=descricao, link=link).model_dump()
    except ValidationError as falha:
        raise HTTPException(status_code=422, detail=falha.errors()) from falha
    caminho, nome, url = await _salvar_arquivo(arquivo)
    dados.update(nome_arquivo=nome, arquivo_url=url)
    try:
        return service.criar(db, usuario, dados)
    except Exception:
        caminho.unlink(missing_ok=True)
        raise


@router.post("/{anexo_id}/upload", response_model=AnexoPublico)
async def substituir_arquivo(
    anexo_id: int,
    arquivo: UploadFile = File(...),
    titulo: str | None = Form(None),
    categoria: str | None = Form(None),
    descricao: str | None = Form(None),
    link: str | None = Form(None),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    anexo = service.buscar(db, usuario, anexo_id)
    mudancas = {
        chave: valor
        for chave, valor in {
            "titulo": titulo,
            "categoria": categoria,
            "descricao": descricao,
            "link": link,
        }.items()
        if valor is not None
    }
    try:
        mudancas = AnexoAtualizar(**mudancas).model_dump(exclude_unset=True)
    except ValidationError as falha:
        raise HTTPException(status_code=422, detail=falha.errors()) from falha
    caminho, nome, url = await _salvar_arquivo(arquivo)
    mudancas.update(nome_arquivo=nome, arquivo_url=url)
    try:
        atualizado = service.atualizar(
            db,
            usuario,
            anexo_id,
            mudancas,
        )
    except Exception:
        caminho.unlink(missing_ok=True)
        raise
    _remover_arquivo(anexo.arquivo_url)
    return atualizado


@router.get("/arquivos/{chave}")
def baixar_arquivo(
    chave: str,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not re.fullmatch(r"[a-f0-9]{32}", chave):
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    url = f"/anexos/arquivos/{chave}"
    anexo = service.buscar_por_url(db, usuario, url)
    caminho = _DIRETORIO_ARQUIVOS / chave
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    return FileResponse(caminho, filename=anexo.nome_arquivo or "arquivo")


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
    anexo = service.apagar(db, usuario, anexo_id)
    _remover_arquivo(anexo.arquivo_url)
