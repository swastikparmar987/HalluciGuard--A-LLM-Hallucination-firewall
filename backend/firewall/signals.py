"""
HalluciGuard — Scoring Pipeline
4 parallel signals for hallucination detection:
  S1: Self-Consistency (TF-IDF cosine similarity)
  S2: Confidence Calibration (hedge word detection)
  S3: Factual Grounding (SpaCy NER density)
  S4: Smart Eval (LLM-as-judge)
"""

import re
import os
from concurrent.futures import ThreadPoolExecutor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.firewall.llm_client import call_llm

# Global cache for SpaCy model
_nlp = None

def get_nlp():
    """Lazy-load SpaCy model."""
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except Exception:
            _nlp = None
    return _nlp

# ═══════════════════════════════════════════════════════════════
# SIGNAL 1: Self-Consistency (Weight: 25%)
# ═══════════════════════════════════════════════════════════════

def signal_consistency(user_query: str, primary_response: str, consistency_responses: list) -> dict:
    try:
        all_responses = [primary_response] + consistency_responses
        valid_responses = [r for r in all_responses if r and len(r.strip()) > 0]

        if len(valid_responses) < 2:
            return {"score": 50, "avg_similarity": 0.0, "snippets": []}

        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(valid_responses)
        sim_matrix = cosine_similarity(tfidf_matrix)

        n = len(valid_responses)
        total_sim = 0.0
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                total_sim += sim_matrix[i][j]
                count += 1

        avg_sim = total_sim / count if count > 0 else 0.0

        if avg_sim >= 0.95:
            score = (1.0 - avg_sim) / 0.05 * 10
        elif avg_sim >= 0.70:
            score = 10 + (0.95 - avg_sim) / 0.25 * 50
        else:
            score = 60 + (0.70 - avg_sim) / 0.70 * 40

        return {"score": round(max(0, min(100, score)), 2), "avg_similarity": round(avg_sim, 4), "snippets": [r[:200] for r in valid_responses[:3]]}
    except Exception:
        return {"score": 50, "avg_similarity": 0.0, "snippets": []}

# ═══════════════════════════════════════════════════════════════
# SIGNAL 2: Confidence Calibration (Weight: 20%)
# ═══════════════════════════════════════════════════════════════

HEDGE_PATTERNS = [r"i'm not sure", r"i don't know", r"probably", r"possibly", r"maybe", r"might"]

def signal_confidence(response: str) -> dict:
    try:
        response_lower = response.lower()
        score = 0
        found = {}
        for p in HEDGE_PATTERNS:
            matches = len(re.findall(p, response_lower))
            if matches > 0:
                found[p] = matches
                score += matches * 15
        
        word_count = len(response.split())
        density = (score / word_count) * 100 if word_count > 0 else 0
        return {"score": min(round(density, 2), 100), "hedges_found": found}
    except Exception:
        return {"score": 0, "hedges_found": {}}

# ═══════════════════════════════════════════════════════════════
# SIGNAL 3: Factual Grounding (Weight: 25%)
# ═══════════════════════════════════════════════════════════════

def signal_grounding(response: str, s1_score: float) -> dict:
    try:
        nlp = get_nlp()
        if not nlp:
            return {"score": 0, "entity_count": 0}
        
        doc = nlp(response)
        allowed = {"DATE", "CARDINAL", "PERCENT", "MONEY", "QUANTITY", "PERSON", "ORG", "GPE"}
        entity_count = sum(1 for ent in doc.ents if ent.label_ in allowed)
        
        word_count = len(response.split())
        density = entity_count / word_count if word_count > 0 else 0
        
        amplifier = 2.0 if s1_score > 50 else 0.8
        score = min(density * amplifier * 100, 100)
        return {"score": round(score, 2), "entity_count": entity_count}
    except Exception:
        return {"score": 0, "entity_count": 0}
