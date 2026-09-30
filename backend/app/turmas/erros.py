class ErroTurma(Exception):
    """Qualquer erro que envolve Turma."""


class TurmaNaoEncontrada(ErroTurma):
    """Turma nao existe."""


class ProfessorForaDoDojo(ErroTurma):
    """Professor precisa pertencer ao mesmo dojo da turma."""
