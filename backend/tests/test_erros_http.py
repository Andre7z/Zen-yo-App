import json

import pytest

from app.alunos.erros import AlunoNaoEncontrado, CampoNaoEditavel
from app.anexos.erros import ErroAnexo
from app.atividades.erros import AtividadeNaoEncontrada, TipoDeAtividadeDesconhecido
from app.dojos.erros import DojoNaoEncontrado, ErroDojo
from app.faixas.erros import ErroFaixa, FaixaNaoEncontrada
from app.main import (
    traduzir_recusa,
    traduzir_recusa_de_atividade,
    traduzir_recusa_de_anexo,
    traduzir_recusa_de_dojo,
    traduzir_recusa_de_faixa,
    traduzir_recusa_de_turma,
    traduzir_recusa_de_usuario,
)
from app.turmas.erros import ErroTurma, ProfessorForaDoDojo, TurmaNaoEncontrada
from app.usuarios.erros import CredenciaisInvalidas, EmailJaCadastrado


@pytest.mark.parametrize(
    ("handler", "erro", "status"),
    [
        (traduzir_recusa, AlunoNaoEncontrado, 404),
        (traduzir_recusa, CampoNaoEditavel, 409),
        (traduzir_recusa_de_atividade, AtividadeNaoEncontrada, 404),
        (traduzir_recusa_de_atividade, TipoDeAtividadeDesconhecido, 409),
        (traduzir_recusa_de_anexo, ErroAnexo, 409),
        (traduzir_recusa_de_faixa, FaixaNaoEncontrada, 404),
        (traduzir_recusa_de_faixa, ErroFaixa, 409),
        (traduzir_recusa_de_dojo, DojoNaoEncontrado, 404),
        (traduzir_recusa_de_dojo, ErroDojo, 409),
        (traduzir_recusa_de_turma, TurmaNaoEncontrada, 404),
        (traduzir_recusa_de_turma, ProfessorForaDoDojo, 409),
    ],
)
def test_erros_de_dominio_preservam_status_e_corpo(handler, erro, status):
    resposta = handler(None, erro("recusa de teste"))

    assert resposta.status_code == status
    assert json.loads(resposta.body) == {"detail": "recusa de teste"}


def test_credenciais_invalidas_preservam_401_e_desafio_bearer():
    resposta = traduzir_recusa_de_usuario(None, CredenciaisInvalidas("login invalido"))

    assert resposta.status_code == 401
    assert resposta.headers["www-authenticate"] == "Bearer"
    assert json.loads(resposta.body) == {"detail": "login invalido"}


def test_outras_recusas_de_usuario_preservam_conflito():
    resposta = traduzir_recusa_de_usuario(None, EmailJaCadastrado("email ocupado"))

    assert resposta.status_code == 409
    assert json.loads(resposta.body) == {"detail": "email ocupado"}