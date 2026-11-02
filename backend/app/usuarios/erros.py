class ErroDeUsuario(Exception):
    """Qualquer recusa ligada a contas e login. Quem traduz para HTTP e' o main.py."""


class EmailJaCadastrado(ErroDeUsuario):
    """Ja' existe uma conta com esse e-mail."""


class SenhaAtualIncorreta(ErroDeUsuario):
    """A senha atual nao confere ao tentar trocar e-mail ou senha."""


class CredenciaisInvalidas(ErroDeUsuario):
    """E-mail ou senha errados, ou token invalido.

    A mensagem nao diz QUAL dos dois errou, de proposito: dizer "senha errada"
    confirma que o e-mail existe -- e e' isso que quem esta' adivinhando quer
    saber.
    """
