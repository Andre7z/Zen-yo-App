class ErroAnexo(Exception):
    """Qualquer erro que envolve Anexo."""


class AnexoNaoEncontrado(ErroAnexo):
    """Anexo nao existe."""
