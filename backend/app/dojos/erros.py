class ErroDojo(Exception):
    """Qualquer erro que envolve Dojo."""


class DojoNaoEncontrado(ErroDojo):
    """Dojo nao existe."""
