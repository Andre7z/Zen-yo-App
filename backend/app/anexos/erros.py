class ErroAnexo(Exception):
    """Qualquer erro que envolve Anexo."""


class AnexoNaoEncontrado(ErroAnexo):
    """Anexo nao existe."""


class AnexoSemConteudo(ErroAnexo):
    """O anexo precisa ter um arquivo ou um link externo."""
