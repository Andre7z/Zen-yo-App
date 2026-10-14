class ErroFaixa(Exception):
    """Qualquer erro que envolve Faixa."""


class FaixaNaoEncontrada(ErroFaixa):
    """Faixa nao existe."""
