def textos_em_maiusculas(arquivo):
    for folha in arquivo.worksheets:
        for linha in folha.iter_rows():
            for celula in linha:
                if celula.data_type in ("s", "inlineStr") and isinstance(celula.value, str):
                    tipo = celula.data_type
                    celula.value = celula.value.upper()
                    celula.data_type = tipo
