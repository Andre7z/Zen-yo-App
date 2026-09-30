from ..alunos import service as alunos_service
from . import service as atividades_service
from .facade import AtividadeFacade


def obter_facade():
    """Monta a fachada com os services que coordenam o caso de uso."""
    return AtividadeFacade(
        atividades_service=atividades_service,
        alunos_service=alunos_service,
    )
