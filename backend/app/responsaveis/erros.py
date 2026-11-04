class ErroResponsavel(Exception):
    """Qualquer erro que envolve Responsavel."""


class ResponsavelNaoEncontrado(ErroResponsavel):
    """O aluno nao tem responsavel cadastrado."""


class ResponsavelSemDados(ErroResponsavel):
    """Responsavel precisa de ao menos um dado informado."""
