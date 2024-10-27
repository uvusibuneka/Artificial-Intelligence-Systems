from rdflib import Graph, URIRef, Literal, Namespace, RDF, RDFS, OWL
from rdflib.plugins.sparql import prepareQuery

# Создаем граф и загружаем онтологию
g = Graph()
g.parse("/home/uvusibuneka/Desktop/СИИ/Module 1/lab2/chess_ontology.owl", format="xml")

# Определяем пространство имен
EX = Namespace("http://example.org/")

def get_recommendations(user_input):
    facts = user_input.split(",")  # Разбиваем строку на факты
    recommendations = []

    # Пример обработки ввода
    for fact in facts:
        fact = fact.strip().lower()
        
        if "игрок" in fact:
            player_style = fact.split("игрок")[-1].strip()  # Извлекаем стиль игрока
            query = prepareQuery(f"""
                SELECT ?player WHERE {{
                    ?player rdf:type ex:Player .
                    ?player ex:hasStyle ex:{player_style} .
                }}
            """, initNs={"ex": EX})

            for row in g.query(query):
                recommendations.append(f"Рекомендуем игрока: {row[0].split('/')[-1]}")

        elif "турнир" in fact:
            query = prepareQuery(f"""
                SELECT ?tournament WHERE {{
                    ?tournament rdf:type ex:Tournament .
                }}
            """, initNs={"ex": EX})

            for row in g.query(query):
                recommendations.append(f"Рекомендуемый турнир: {row[0].split('/')[-1]}")

    return recommendations

def main():
    print("Добро пожаловать в рекомендательную систему!")
    user_input = input("Введите о своих интересах (например, 'игрок агрессивный, турнир'): ")
    recommendations = get_recommendations(user_input)

    if recommendations:
        print("Рекомендации:")
        for rec in recommendations:
            print(rec)
    else:
        print("Извините, не удалось найти рекомендации.")

if __name__ == "__main__":
    main()

