from rdflib import Graph, URIRef, Literal, Namespace, RDF, RDFS, OWL

# Создаем граф
g = Graph()

# Определяем пространство имен
EX = Namespace("http://example.org/")

# --- Определяем классы ---
g.add((EX.Player, RDF.type, OWL.Class))
g.add((EX.Style, RDF.type, OWL.Class))
g.add((EX.Tournament, RDF.type, OWL.Class))

# --- Определяем игроков ---
players = [
    "kasparov", "karpov", "fischer", "spassky", "tal",
    "botvinnik", "alehin", "lasker", "capablanca", "petrosian",
    "morphy", "kramnik", "anand", "carlsen", "karjakin",
    "nepomniachtchi", "ding", "nakamura", "so", "grischuk"
]

for player in players:
    g.add((EX[player], RDF.type, EX.Player))

# --- Определяем стили игры ---
styles = [
    "aggressive", "positional", "endgame_specialist",
    "tactical", "strategic", "unpredictable"
]

for style in styles:
    g.add((EX[style], RDF.type, EX.Style))

# --- Определяем турниры ---
tournaments = [
    "candidates_1971", "world_championship_1972",
    "world_championship_1984", "world_championship_1985",
    "world_championship_2000", "world_championship_2008",
    "world_championship_2013", "world_championship_2016",
    "world_championship_2021", "world_championship_2023"
]

for tournament in tournaments:
    g.add((EX[tournament], RDF.type, EX.Tournament))

# --- Связь между игроками и их стилями ---
playing_styles = {
    "kasparov": "aggressive",
    "karpov": "positional",
    "fischer": "tactical",
    "spassky": "strategic",
    "tal": "unpredictable",
    "botvinnik": "strategic",
    "anand": "endgame_specialist",
    "carlsen": "strategic",
    "ding": "tactical",
    "nakamura": "tactical"
}

for player, style in playing_styles.items():
    g.add((EX[player], EX.hasStyle, EX[style]))

# --- Участники турниров ---
tournament_participants = {
    "kasparov": ["world_championship_1985"],
    "karpov": ["world_championship_1985"],
    "fischer": ["world_championship_1972"],
    "spassky": ["world_championship_1972"],
    "tal": ["candidates_1971"],
    "botvinnik": ["world_championship_1961"],
    "anand": ["world_championship_2008"],
    "kramnik": ["world_championship_2000"],
    "carlsen": ["world_championship_2013"],
    "ding": ["world_championship_2023"]
}

for player, tournaments in tournament_participants.items():
    for tournament in tournaments:
        g.add((EX[player], EX.participatedIn, EX[tournament]))

# --- Результаты матчей ---
match_results = [
    ("kasparov", "karpov", "world_championship_1985", "kasparov_win"),
    ("fischer", "spassky", "world_championship_1972", "fischer_win"),
    ("kramnik", "kasparov", "world_championship_2000", "kramnik_win"),
    ("anand", "kramnik", "world_championship_2008", "anand_win"),
    ("carlsen", "anand", "world_championship_2013", "carlsen_win"),
    ("ding", "nepomniachtchi", "world_championship_2023", "ding_win")
]

for player1, player2, tournament, result in match_results:
    g.add((EX[player1], EX.playedAgainst, EX[player2]))
    g.add((EX[player1], EX.wonIn, EX[tournament]))

# Сохраняем граф в файл в формате OWL (RDF/XML)
g.serialize(destination='chess_ontology.owl', format='xml')

print("Онтология успешно создана и сохранена в файл 'chess_ontology.owl'")
