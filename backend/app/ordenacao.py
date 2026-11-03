import unicodedata


def ordenar_alunos_por_nome(alunos):
    def chave(aluno):
        nome = unicodedata.normalize("NFKD", aluno.nome.casefold())
        return "".join(caractere for caractere in nome if not unicodedata.combining(caractere))

    return sorted(alunos, key=chave)
