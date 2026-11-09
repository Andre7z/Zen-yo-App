from datetime import date
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from openpyxl import load_workbook
from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.alunos.models import Aluno
from app.atividades import service as atividades_service
from app.atividades.models import Atividade
from app.database import Base, get_db
from app.faixas.models import Faixa
from app.main import app
from app.nomes import primeiro_e_ultimo_nome
from app.seguranca import get_current_user
from app.turmas import service
from app.turmas.erros import ErroTurma, TurmaNaoEncontrada
from app.turmas.models import Turma
from app.turmas.schemas import PresencaEntrada
from app.usuarios.models import Usuario


@pytest.fixture
def dados():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        sensei = Usuario(nome="Ana", email="ana@teste.com", senha_hash="hash")
        outro = Usuario(nome="Beto", email="beto@teste.com", senha_hash="hash")
        db.add_all([sensei, outro])
        db.flush()
        faixa = Faixa(nome="Branca", tipo="Iniciante", dono_id=sensei.id)
        db.add(faixa)
        db.flush()
        ana = Aluno(nome="Ana Aluna", faixa_id=faixa.id, dono_id=sensei.id)
        bia = Aluno(nome="Bia Aluna", faixa_id=faixa.id, dono_id=sensei.id)
        turma = Turma(nome="Infantil", nucleo="Centro", dono_id=sensei.id)
        turma.alunos.append(ana)
        outra = Turma(nome="Adultos", nucleo="Bairro", dono_id=sensei.id)
        privada = Turma(nome="Privada", dono_id=outro.id)
        db.add_all([ana, bia, turma, outra, privada])
        db.commit()
        yield db, sensei, outro, turma, outra, privada, ana, bia
    engine.dispose()


def marcar(*pares):
    return [PresencaEntrada(aluno_id=aluno.id, presente=presente) for aluno, presente in pares]


@pytest.mark.parametrize(("nome", "esperado"), [
    ("Luiz Rocha Moraes", "Luiz Moraes"),
    ("  José   da  Silva  ", "José Silva"),
    ("Ana", "Ana"),
    ("Ana Silva", "Ana Silva"),
])
def test_primeiro_e_ultimo_nome(nome, esperado):
    assert primeiro_e_ultimo_nome(nome) == esperado


def test_chamada_preserva_alunos_do_dia_e_exige_marcacoes_completas(dados):
    db, usuario, _, turma, _, _, ana, bia = dados
    dia = date(2026, 11, 1)
    consulta = service.consultar_chamada(db, usuario, turma.id, dia)
    assert consulta["registrada"] is False
    assert consulta["alunos"] == [{"aluno_id": ana.id, "nome": "Ana Aluna", "presente": True}]
    with pytest.raises(ErroTurma):
        service.salvar_chamada(db, usuario, turma.id, dia, [])
    with pytest.raises(ErroTurma):
        service.salvar_chamada(db, usuario, turma.id, dia, marcar((bia, True)))
    service.salvar_chamada(db, usuario, turma.id, dia, marcar((ana, True)))
    service.remover_aluno(db, usuario, turma.id, ana.id)
    service.adicionar_alunos(db, usuario, turma.id, [bia.id])
    assert service.consultar_chamada(db, usuario, turma.id, dia)["alunos"][0]["aluno_id"] == ana.id
    service.salvar_chamada(db, usuario, turma.id, dia, marcar((ana, False)))
    assert service.consultar_chamada(db, usuario, turma.id, dia)["alunos"][0]["presente"] is False
    with pytest.raises(ErroTurma):
        service.salvar_chamada(db, usuario, turma.id, dia, marcar((bia, True)))


def test_xlsx_multiplas_turmas_dias_e_aluno_fora_da_turma(dados):
    db, usuario, _, turma, outra, _, ana, bia = dados
    service.salvar_chamada(db, usuario, turma.id, date(2026, 11, 2), marcar((ana, True)))
    service.adicionar_alunos(db, usuario, turma.id, [bia.id])
    service.salvar_chamada(db, usuario, turma.id, date(2026, 11, 5), marcar((ana, False), (bia, True)))
    service.adicionar_alunos(db, usuario, outra.id, [bia.id])
    service.salvar_chamada(db, usuario, outra.id, date(2026, 11, 6), marcar((bia, False)))
    service.salvar_chamada(db, usuario, turma.id, date(2026, 12, 1), marcar((ana, True), (bia, True)))
    conteudo = service.planilha_frequencia(db, usuario, [turma.id, outra.id], 2026, 11)
    folha = load_workbook(BytesIO(conteudo)).active
    assert folha["A1"].value == "FREQUÊNCIA DE NOVEMBRO 2026 - SENSEI ANA"
    assert folha["A3"].value == "CENTRO - INFANTIL"
    assert [folha.cell(4, i).value for i in range(1, 5)] == ["ORDEM", "NOME", 2, 5]
    assert [folha.cell(5, i).value for i in range(1, 5)] == [1, "ANA ALUNA", "V", "X"]
    assert [folha.cell(6, i).value for i in range(1, 5)] == [2, "BIA ALUNA", "-", "V"]
    assert folha.title == "FREQUÊNCIA"
    assert all(celula.value == celula.value.upper() for linha in folha.iter_rows() for celula in linha if celula.data_type == "s" and isinstance(celula.value, str))
    assert ana.nome == "Ana Aluna"
    assert folha["C5"].font.color.rgb.endswith("008000")
    assert folha["D5"].font.color.rgb.endswith("FF0000")
    assert folha["A9"].value == "BAIRRO - ADULTOS"
    assert folha["C10"].value == 6
    assert folha["C11"].value == "X"
    assert "A1:D1" in {str(celulas) for celulas in folha.merged_cells.ranges}
    assert "A3:D3" in {str(celulas) for celulas in folha.merged_cells.ranges}
    assert "A9:C9" in {str(celulas) for celulas in folha.merged_cells.ranges}
    assert folha["A3"].border.left.style == "thin"
    assert folha["D3"].border.right.style == "thin"
    assert folha["D3"].border.bottom.style == "thin"
    assert folha["C9"].border.right.style == "thin"
    assert folha["C9"].border.bottom.style == "thin"
    assert folha["D9"].border.right.style is None
    assert folha["A1"].font.sz == 11
    assert folha["A3"].font.sz == 11
    assert folha["A1"].fill.patternType is None
    assert folha["C4"].fill.patternType is None
    assert folha["C4"].border.left.style == "thin"


def test_turma_sem_nucleo_mantem_apenas_o_nome_com_borda(dados):
    db, usuario, _, turma, _, _, _, _ = dados
    turma.nome = "Rendimento"
    turma.nucleo = None
    folha = load_workbook(BytesIO(service.planilha_frequencia(db, usuario, [turma.id], 2026, 11))).active
    assert folha["A3"].value == "RENDIMENTO"
    assert "A3:B3" in {str(celulas) for celulas in folha.merged_cells.ranges}
    assert folha["B3"].border.right.style == "thin"


def test_isolamento_e_validacao_da_planilha(dados):
    db, usuario, outro, turma, _, privada, ana, _ = dados
    service.salvar_chamada(db, usuario, turma.id, date(2026, 11, 1), marcar((ana, True)))
    with pytest.raises(TurmaNaoEncontrada):
        service.consultar_chamada(db, outro, turma.id, date(2026, 11, 1))
    with pytest.raises(TurmaNaoEncontrada):
        service.planilha_frequencia(db, usuario, [turma.id, privada.id], 2026, 11)
    with pytest.raises(ErroTurma):
        service.planilha_frequencia(db, usuario, [turma.id, turma.id], 2026, 11)


def test_historico_lista_apenas_chamadas_da_turma_em_ordem_decrescente(dados):
    db, usuario, outro, turma, outra, _, ana, bia = dados
    service.adicionar_alunos(db, usuario, outra.id, [bia.id])
    service.salvar_chamada(db, usuario, turma.id, date(2026, 10, 5), marcar((ana, True)))
    service.salvar_chamada(db, usuario, turma.id, date(2026, 12, 2), marcar((ana, False)))
    service.salvar_chamada(db, usuario, turma.id, date(2026, 11, 3), marcar((ana, True)))
    service.salvar_chamada(db, usuario, outra.id, date(2026, 12, 10), marcar((bia, True)))
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    try:
        with TestClient(app) as cliente:
            resposta = cliente.get(f"/turmas/{turma.id}/frequencias")
            assert resposta.status_code == 200
            assert resposta.json() == ["2026-12-02", "2026-11-03", "2026-10-05"]
            app.dependency_overrides[get_current_user] = lambda: outro
            assert cliente.get(f"/turmas/{turma.id}/frequencias").status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_cadastro_e_edicao_de_nucleo(dados):
    db, usuario, _, turma, _, antiga, _, _ = dados
    antiga.dono_id = usuario.id
    db.commit()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    try:
        with TestClient(app) as cliente:
            assert cliente.post("/turmas/", json={"nome": "Nova"}).status_code == 422
            for invalido in (" ", None, "A", "A" * 121):
                assert cliente.post("/turmas/", json={"nome": "Nova", "nucleo": invalido}).status_code == 422
                assert cliente.patch(f"/turmas/{turma.id}", json={"nucleo": invalido}).status_code == 422
            resposta = cliente.post("/turmas/", json={"nome": "Nova", "nucleo": " Centro "})
            assert resposta.status_code == 201
            assert resposta.json()["nucleo"] == "Centro"
            assert cliente.get(f"/turmas/{antiga.id}").json()["nucleo"] is None
            assert cliente.patch(f"/turmas/{antiga.id}", json={"nome": "Existente"}).status_code == 409
            resposta = cliente.patch(f"/turmas/{antiga.id}", json={"nome": "Existente", "nucleo": " Bairro "})
            assert resposta.status_code == 200
            assert resposta.json()["nucleo"] == "Bairro"
            assert cliente.patch(f"/turmas/{antiga.id}", json={"nome": "Atualizada"}).json()["nucleo"] == "Bairro"
    finally:
        app.dependency_overrides.clear()


def test_conflito_de_chamadas_concorrentes_pede_atualizacao(dados, monkeypatch):
    db, usuario, _, turma, _, _, ana, _ = dados
    salvar = service.repository.salvar_chamada

    def conflito(*args):
        salvar(*args)
        raise IntegrityError("insert", {}, Exception("chamada duplicada"))

    monkeypatch.setattr(service.repository, "salvar_chamada", conflito)
    with pytest.raises(ErroTurma, match="Atualize"):
        service.salvar_chamada(db, usuario, turma.id, date(2026, 11, 1), marcar((ana, True)))


def test_rotas_de_frequencia_e_planilha(dados):
    db, usuario, _, turma, _, privada, ana, _ = dados
    usuario.nome = "Luiz Rocha Moraes"
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    try:
        with TestClient(app) as cliente:
            caminho = f"/turmas/{turma.id}/frequencias/2026-11-02"
            assert cliente.get(caminho).json()["alunos"][0]["presente"] is True
            assert cliente.put(caminho, json={"alunos": [{"aluno_id": ana.id, "presente": True}]}).status_code == 200
            resposta = cliente.get("/turmas/planilha-de-frequencia.xlsx", params={"ano": 2026, "mes": 11, "turma_ids": turma.id})
            assert resposta.status_code == 200
            assert "SENSEI%20LUIZ%20MORAES.xlsx" in resposta.headers["content-disposition"]
            folha = load_workbook(BytesIO(resposta.content)).active
            assert folha["A1"].value == "FREQUÊNCIA DE NOVEMBRO 2026 - SENSEI LUIZ MORAES"
            assert folha["C5"].value == "V"
            assert cliente.get("/turmas/planilha-de-frequencia.xlsx", params={"ano": 2026, "mes": 13, "turma_ids": turma.id}).status_code == 422
            assert cliente.get(f"/turmas/{privada.id}/frequencias/2026-11-02").status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize(
    ("tipo", "exportar"),
    [
        ("frequencia", atividades_service.controle_de_frequencia_xlsx),
        ("campeonato", atividades_service.controle_de_campeonato_xlsx),
        ("troca_de_faixa", atividades_service.controle_de_faixas_xlsx),
        ("entrega_de_kimono", atividades_service.controle_de_kimonos_xlsx),
    ],
)
def test_planilha_de_atividade_tem_nome_no_arquivo(tipo, exportar, dados):
    db, usuario, _, _, _, _, ana, _ = dados
    atividade = Atividade(tipo=tipo, nome="Treino especial", data=date(2026, 11, 3), dono_id=usuario.id)
    atividade.alunos.append(ana)
    db.add(atividade)
    db.commit()
    arquivo = load_workbook(BytesIO(exportar(db, usuario, atividade.id)))
    assert arquivo.active.title == "TREINO ESPECIAL"
    assert "TREINO ESPECIAL" in arquivo.active["A1"].value
    assert arquivo.active["A3"].value == "ANA ALUNA"
    assert all(celula.value == celula.value.upper() for linha in arquivo.active.iter_rows() for celula in linha if celula.data_type == "s" and isinstance(celula.value, str))


@pytest.mark.parametrize(("tipo", "controle"), [
    ("frequencia", "frequencia"),
    ("campeonato", "campeonato"),
    ("troca_de_faixa", "faixas"),
    ("entrega_de_kimono", "kimonos"),
])
def test_atividade_usa_rotas_e_nome_de_planilha(dados, tipo, controle):
    db, usuario, _, _, _, _, ana, _ = dados
    usuario.nome = "Luiz Rocha Moraes"
    atividade = Atividade(tipo=tipo, nome="Noite do judogi", data=date(2026, 11, 3), dono_id=usuario.id)
    atividade.alunos.append(ana)
    db.add(atividade)
    db.commit()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    try:
        with TestClient(app) as cliente:
            caminho = f"/atividades/{atividade.id}"
            resposta = cliente.get(f"{caminho}/planilha/controle-de-{controle}.xlsx")
            assert resposta.status_code == 200
            assert "NOITE%20DO%20JUDOGI%20-%20SENSEI%20LUIZ%20MORAES.xlsx" in resposta.headers["content-disposition"]
            folha = load_workbook(BytesIO(resposta.content)).active
            assert folha.title == "NOITE DO JUDOGI"
            assert "SENSEI LUIZ MORAES" in folha["A1"].value
            assert cliente.get(f"{caminho}/relatorio/controle-de-frequencia.xlsx").status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_graduacao_em_lote_e_atomica_e_valida_participantes(dados):
    db, usuario, outro, _, _, _, ana, bia = dados
    faixa_original = ana.faixa_id
    faixa_nova = Faixa(nome="Azul", tipo="Kyu", grau=10, dono_id=usuario.id)
    faixa_privada = Faixa(nome="Privada", tipo="Iniciante", dono_id=outro.id)
    atividade = Atividade(tipo="troca_de_faixa", nome="Exame", data=date(2026, 11, 3), dono_id=usuario.id)
    atividade.alunos.extend([ana, bia])
    db.add_all([faixa_nova, faixa_privada, atividade])
    db.commit()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    try:
        with TestClient(app) as cliente:
            caminho = f"/atividades/{atividade.id}/graduacoes"
            alunos = [
                {"aluno_id": ana.id, "faixa_id": faixa_nova.id, "tamanho_faixa": "G", "faixa_grossa": True},
                {"aluno_id": bia.id, "faixa_id": faixa_privada.id},
            ]
            assert cliente.post(caminho, json={"alunos": alunos}).status_code == 404
            db.refresh(ana)
            assert ana.faixa_id == faixa_original
            alunos[1]["faixa_id"] = faixa_nova.id
            assert cliente.post(caminho, json={"alunos": [alunos[0], alunos[0]]}).status_code == 422
            assert cliente.post(caminho, json={"alunos": [alunos[0], {"aluno_id": 99999, "faixa_id": faixa_nova.id}]}).status_code == 409

            db.execute(text(f"CREATE TRIGGER falha_graduacao BEFORE UPDATE ON alunos WHEN NEW.id = {bia.id} BEGIN SELECT RAISE(ABORT, 'falha'); END"))
            db.commit()
            with pytest.raises(IntegrityError):
                cliente.post(caminho, json={"alunos": alunos})
            db.refresh(ana)
            db.refresh(bia)
            assert (ana.faixa_id, bia.faixa_id) == (faixa_original, faixa_original)
            db.execute(text("DROP TRIGGER falha_graduacao"))
            db.commit()

            resposta = cliente.post(caminho, json={"alunos": alunos})
            assert resposta.status_code == 200
            assert len(resposta.json()) == 2
            db.refresh(ana)
            db.refresh(bia)
            assert (ana.faixa_id, bia.faixa_id) == (faixa_nova.id, faixa_nova.id)
            assert ana.tamanho_faixa == "G" and ana.faixa_grossa is True
    finally:
        app.dependency_overrides.clear()


def test_migracao_de_frequencia_pode_ser_aplicada_e_revertida(tmp_path, monkeypatch):
    from alembic import command
    from alembic.config import Config

    url = f"sqlite:///{(tmp_path / 'migracao.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    engine = create_engine(url)
    assert {"chamadas_turma", "presencas_turma"} <= set(inspect(engine).get_table_names())
    command.downgrade(config, "f3a5b7c9d1e2")
    assert "chamadas_turma" not in inspect(engine).get_table_names()
    command.upgrade(config, "head")
    assert "presencas_turma" in inspect(engine).get_table_names()
    engine.dispose()


def test_migracao_preserva_turma_antiga_com_nucleo_vazio(tmp_path, monkeypatch):
    from alembic import command
    from alembic.config import Config

    url = f"sqlite:///{(tmp_path / 'nucleo.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "a2b3c4d5e6f7")
    engine = create_engine(url)
    with engine.begin() as conexao:
        conexao.execute(text("INSERT INTO turmas (nome) VALUES (:nome)"), {"nome": "Antiga"})
    command.upgrade(config, "head")
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT nome, nucleo FROM turmas")).one() == ("Antiga", None)
    command.downgrade(config, "a2b3c4d5e6f7")
    with engine.connect() as conexao:
        assert conexao.execute(text("SELECT nome FROM turmas")).scalar_one() == "Antiga"
    command.upgrade(config, "head")
    engine.dispose()
