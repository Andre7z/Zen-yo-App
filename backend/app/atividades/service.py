"""As regras das atividades, e mais nada.

Este arquivo decide. Ele nao levanta erro de protocolo, nao monta consulta
e nao abre conexao: quem fala HTTP e o controller, quem fala SQL e o
repository.

O `db` atravessa este arquivo sem ser aberto: o Service so o repassa para
o repository, que e quem sabe o que fazer com ele.

Cada usuario enxerga e altera somente as suas proprias atividades.
"""

from . import repository
from .erros import AtividadeNaoEncontrada
from .politicas import RelatorioFactory


def listar(db, usuario, tipo=None, nome=None):
    return repository.listar(
        db,
        usuario.id,
        tipo,
        nome,
    )


def buscar(db, usuario, atividade_id):
    atividade = repository.buscar(db, atividade_id)

    # Cada usuario pode acessar somente as suas atividades.
    if atividade is None or atividade.dono_id != usuario.id:
        raise AtividadeNaoEncontrada(
            f"Atividade {atividade_id} nao esta cadastrada"
        )

    return atividade


def criar(db, usuario, dados):
    return repository.criar(
        db,
        {
            **dados,
            "dono_id": usuario.id
        }
    )
    
def atualizar(db, usuario, atividade_id, mudancas):
    atividade = buscar(
        db,
        usuario,
        atividade_id
    )

    return repository.atualizar(
        db,
        atividade,
        mudancas
    )


def apagar(db, usuario, atividade_id):
    atividade = buscar(
        db,
        usuario,
        atividade_id
    )

    repository.apagar(
        db,
        atividade
    )


def gerar_relatorio(db, usuario, atividade_id):
    atividade = buscar(
        db,
        usuario,
        atividade_id
    )

    estrategia = RelatorioFactory.criar(atividade.tipo)

    return estrategia.gerar(atividade)