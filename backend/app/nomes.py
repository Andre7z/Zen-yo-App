def primeiro_e_ultimo_nome(nome: str) -> str:
    partes = nome.split()
    if len(partes) <= 1:
        return " ".join(partes)
    return f"{partes[0]} {partes[-1]}"
