def texto_legivel(texto: str, campo: str) -> str:
    valor = texto.strip()
    if len(valor) < 2:
        raise ValueError(f"o {campo} precisa ter pelo menos 2 caracteres")
    return valor