import re


def _digito(digitos: str) -> int:
    pesos = range(len(digitos) + 1, 1, -1)
    resto = sum(int(d) * p for d, p in zip(digitos, pesos)) * 10 % 11
    return 0 if resto == 10 else resto


def cpf_valido(numeros: str) -> bool:
    if len(numeros) != 11 or numeros == numeros[0] * 11:
        return False
    primeiro = _digito(numeros[:9])
    segundo = _digito(numeros[:9] + str(primeiro))
    return numeros[9:] == f"{primeiro}{segundo}"


def normalizar_cpf(valor: str | None) -> str | None:
    """Vazio vira None; CPF válido volta no formato 000.000.000-00."""
    if valor is None or not valor.strip():
        return None
    numeros = re.sub(r"[.\-\s]", "", valor)
    if not numeros.isdigit() or not cpf_valido(numeros):
        raise ValueError("CPF inválido. Confira os números digitados.")
    return f"{numeros[:3]}.{numeros[3:6]}.{numeros[6:9]}-{numeros[9:]}"
