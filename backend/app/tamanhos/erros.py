class ErroTamanho(Exception):
    """Qualquer erro que envolve Tamanho."""


class TamanhoNaoEncontrado(ErroTamanho):
    """Tamanho nao existe."""


class TamanhoEmUso(ErroTamanho):
    """Tamanho usado por algum aluno nao pode ser removido."""


class TamanhoDuplicado(ErroTamanho):
    """Ja existe um tamanho com esse nome."""
