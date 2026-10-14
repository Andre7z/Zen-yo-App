from ..usuarios import service as usuarios_service
from . import service as turmas_service
from .facade import TurmaFacade


def obter_facade():
    """Monta a fachada com os services que coordenam o caso de uso."""
    return TurmaFacade(
        turmas_service=turmas_service,
        usuarios_service=usuarios_service,
    )