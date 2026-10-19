"""Faixas que toda conta nova recebe ao ser criada.

Edite esta lista para mudar o padrao inicial: (nome, tipo, grau).
tipo: "Iniciante" (sem grau, use None), "Kyu" ou "Dan".
A ordem de exibicao e' calculada: Iniciante, Kyu (do maior numero para o 1)
e Dan (do 1 para o maior). A posicao nesta lista nao importa.
Contas ja existentes nao sao alteradas.
"""

FAIXAS_PADRAO = [
    ("BRANCA", "INICIANTE", None),
    ("BRANCA/CINZA", "KYU", 11),
    ("CINZA", "KYU", 10),
    ("CINZA/AZUL", "KYU", 9),
    ("AZUL", "KYU", 8),
    ("AZUL/AMARELA", "KYU", 7),
    ("AMARELA", "KYU", 6),
    ("AMARELA/LARANJA", "KYU", 5),
    ("LARANJA", "KYU", 4),
    ("VERDE", "KYU", 3),
    ("ROXA", "KYU", 2),
    ("MARROM", "KYU", 1),

    ("PRETA", "DAN", 1),
    ("PRETA", "DAN", 2),
    ("PRETA", "DAN", 3),
    ("PRETA", "DAN", 4),
    ("PRETA", "DAN", 5),

    ("VERMELHA E BRANCA", "DAN", 6),
    ("VERMELHA E BRANCA", "DAN", 7),
    ("VERMELHA E BRANCA", "DAN", 8),
    ("VERMELHA", "DAN", 9),
    ("VERMELHA", "DAN", 10),
]
