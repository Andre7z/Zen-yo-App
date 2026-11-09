"""As regras das atividades, e mais nada.

Este arquivo decide. Ele nao levanta erro de protocolo, nao monta consulta
e nao abre conexao: quem fala HTTP e o controller, quem fala SQL e o
repository.

O `db` atravessa este arquivo sem ser aberto: o Service so o repassa para
o repository, que e quem sabe o que fazer com ele.

Cada usuario enxerga e altera somente as suas proprias atividades.
"""

from . import controle_campeonato, controle_faixas, controle_frequencia, controle_kimonos, repository
from ..tamanhos import service as tamanhos_service
from ..faixas import service as faixas_service
from .erros import AtividadeNaoEncontrada, ErroAtividade, TipoDeAtividadeDesconhecido
from .politicas import PlanilhaFactory
from ._estilo_xlsx import nomear_planilha


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


def gerar_planilha(db, usuario, atividade_id):
    atividade = buscar(
        db,
        usuario,
        atividade_id
    )

    estrategia = PlanilhaFactory.criar(atividade.tipo)

    return estrategia.gerar(atividade)


def _atividade_de_troca(db, usuario, atividade_id):
    atividade = buscar(db, usuario, atividade_id)
    if atividade.tipo != "troca_de_faixa":
        raise TipoDeAtividadeDesconhecido(
            "O controle de faixas so existe para atividades de troca de faixa"
        )
    return atividade, list(atividade.alunos)


def graduar_em_lote(db, usuario, atividade_id, alunos):
    _, participantes = _atividade_de_troca(db, usuario, atividade_id)
    por_id = {aluno.id: aluno for aluno in participantes}
    if any(item.aluno_id not in por_id for item in alunos):
        raise ErroAtividade("Todos os alunos devem participar da atividade")
    atualizacoes = []
    for item in alunos:
        faixas_service.buscar(db, usuario, item.faixa_id)
        atualizacoes.append((por_id[item.aluno_id], {
            "faixa_id": item.faixa_id,
            "proxima_faixa": None,
            "tamanho_faixa": item.tamanho_faixa,
            "faixa_grossa": item.faixa_grossa,
        }))
    return repository.graduar_em_lote(db, atualizacoes)


def controle_de_faixas(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_troca(db, usuario, atividade_id)
    return controle_faixas.gerar_planilha(atividade, alunos, tamanhos_service.nomes(db, usuario, "faixa"))


def controle_de_faixas_xlsx(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_troca(db, usuario, atividade_id)
    return nomear_planilha(controle_faixas.gerar_xlsx(atividade, alunos, tamanhos_service.nomes(db, usuario, "faixa")), atividade.nome, usuario.nome)


def _atividade_de_entrega_kimono(db, usuario, atividade_id):
    atividade = buscar(db, usuario, atividade_id)
    if atividade.tipo != "entrega_de_kimono":
        raise TipoDeAtividadeDesconhecido(
            "O controle de judogis so existe para atividades de entrega de judogi"
        )
    return atividade, list(atividade.alunos)


def _confirmados(atividade):
    return set(getattr(atividade, "aluno_ids_confirmados", []) or [])


def controle_de_kimonos(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_entrega_kimono(db, usuario, atividade_id)
    return controle_kimonos.gerar_planilha(alunos, tamanhos_service.nomes(db, usuario, "kimono"), _confirmados(atividade))


def controle_de_kimonos_xlsx(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_entrega_kimono(db, usuario, atividade_id)
    return nomear_planilha(controle_kimonos.gerar_xlsx(alunos, tamanhos_service.nomes(db, usuario, "kimono"), _confirmados(atividade)), atividade.nome, usuario.nome)


def _atividade_de_campeonato(db, usuario, atividade_id):
    atividade = buscar(db, usuario, atividade_id)
    if atividade.tipo != "campeonato":
        raise TipoDeAtividadeDesconhecido(
            "O controle de campeonato so existe para atividades de campeonato"
        )
    return atividade, list(atividade.alunos)


def controle_de_campeonato(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_campeonato(db, usuario, atividade_id)
    return controle_campeonato.gerar_planilha(alunos, _confirmados(atividade))


def controle_de_campeonato_xlsx(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_campeonato(db, usuario, atividade_id)
    return nomear_planilha(controle_campeonato.gerar_xlsx(alunos, _confirmados(atividade)), atividade.nome, usuario.nome)


def _atividade_de_frequencia(db, usuario, atividade_id):
    atividade = buscar(db, usuario, atividade_id)
    if atividade.tipo != "frequencia":
        raise TipoDeAtividadeDesconhecido(
            "O controle de frequencia so existe para atividades de frequencia"
        )
    return atividade, list(atividade.alunos)


def controle_de_frequencia(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_frequencia(db, usuario, atividade_id)
    return controle_frequencia.gerar_planilha(atividade, alunos)


def controle_de_frequencia_xlsx(db, usuario, atividade_id):
    atividade, alunos = _atividade_de_frequencia(db, usuario, atividade_id)
    return nomear_planilha(controle_frequencia.gerar_xlsx(atividade, alunos), atividade.nome, usuario.nome)