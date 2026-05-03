import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from backend.firewall.search_util import search_internet, deep_fact_check
from backend.firewall.llm_client import call_llm
from backend.firewall.signals import nlp

query = "how many continents on earth"
primary_response = "The Earth has seven continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America."

print(f"Query: {query}")
print(f"Response: {primary_response}\n")

search_results = search_internet(query)
print("=== DUCKDUCKGO SEARCH RESULTS ===")
print(search_results)
print("=================================\n")

response_doc = nlp(primary_response)
search_doc = nlp(search_results)

FACTUAL_TYPES = {"DATE", "EVENT", "FAC", "GPE", "LOC", "MONEY", "NORP", "ORG", "PERSON", "PRODUCT", "QUANTITY", "PERCENT"}

response_entities = {ent.text.lower().strip() for ent in response_doc.ents if ent.label_ in FACTUAL_TYPES}
search_entities = {ent.text.lower().strip() for ent in search_doc.ents if ent.label_ in FACTUAL_TYPES}

print(f"Response Entities: {response_entities}")
print(f"Search Entities: {search_entities}")

verified = response_entities.intersection(search_entities)
missing = response_entities - search_entities
print(f"Verified: {verified}")
print(f"Missing: {missing}")

overlap = len(verified) / len(response_entities) if len(response_entities) > 0 else 1.0
print(f"Overlap Ratio: {overlap:.2f}")

if overlap >= 0.8: score = (1.0 - overlap) * 20
elif overlap >= 0.4: score = 20 + (0.8 - overlap) / 0.4 * 40
else: score = 60 + (0.4 - overlap) / 0.4 * 40

print(f"Calculated Score: {score}")
