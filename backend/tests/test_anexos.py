import asyncio
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
from datetime import date

from fastapi import UploadFile

from app.anexos import controller
from app.anexos.models import Anexo
from app.anexos.schemas import AnexoEntrada, AnexoPublico


def test_anexo_aceita_categoria_valida():
    dados = AnexoEntrada(
        titulo="Regulamento 2026",
        categoria="Regulamento",
        descricao="Documento oficial",
        nome_arquivo="regulamento.pdf",
        arquivo_url="https://cdn.exemplo.com/regulamento.pdf",
        link="https://example.com/regulamento",
    )

    assert dados.categoria == "Regulamento"
    assert dados.titulo == "Regulamento 2026"


def test_anexo_model_cria_instancia_com_data():
    anexo = Anexo(
        id=1,
        titulo="Autorização",
        categoria="Autorização",
        descricao="Autorização da academia",
        nome_arquivo="autorizacao.pdf",
        arquivo_url="https://cdn.exemplo.com/autorizacao.pdf",
        link="https://example.com/autorizacao",
        criado_em=date.today(),
    )

    assert anexo.categoria == "Autorização"
    assert anexo.nome_arquivo == "autorizacao.pdf"
    assert isinstance(AnexoPublico.model_validate(anexo).criado_em, date)


def test_upload_salva_arquivo_com_nome_seguro_e_metadados(tmp_path, monkeypatch):
    monkeypatch.setattr(controller, "_DIRETORIO_ARQUIVOS", tmp_path)
    dados_salvos = {}
    usuario = SimpleNamespace(id=12)

    def criar(db, usuario_atual, dados):
        dados_salvos.update(dados)
        return {"id": 5, **dados}

    monkeypatch.setattr(controller.service, "criar", criar)
    anexo = asyncio.run(
        controller.criar_com_arquivo(
            titulo="Ficha",
            categoria="Fichas",
            descricao=None,
            link=None,
            arquivo=UploadFile(file=BytesIO(b"conteudo do arquivo"), filename="../ficha.pdf"),
            usuario=usuario,
            db=object(),
        )
    )

    chave = dados_salvos["arquivo_url"].rsplit("/", 1)[-1]
    assert anexo["nome_arquivo"] == "ficha.pdf"
    assert (tmp_path / chave).read_bytes() == b"conteudo do arquivo"

    monkeypatch.setattr(
        controller.service,
        "buscar_por_url",
        lambda db, usuario_atual, url: SimpleNamespace(nome_arquivo="ficha.pdf"),
    )
    download = controller.baixar_arquivo(chave, usuario, object())
    assert Path(download.path).read_bytes() == b"conteudo do arquivo"
