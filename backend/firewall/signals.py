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
import spacy
from concurrent.futures import ThreadPoolExecutor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.firewall.llm_client import call_llm

# ─── Load SpaCy model ONCE at module level ──────────────────────
nlp = spacy.load("en_core_web_sm")


# ═══════════════════════════════════════════════════════════════
# SIGNAL 1: Self-Consistency (Weight: 25%)
# ═══════════════════════════════════════════════════════════════

def signal_consistency(user_query: str, primary_response: str, consistency_responses: list) -> dict:
    """
    Call LLM 3 times and compare responses using TF-IDF cosine similarity.
    High divergence = high hallucination risk.
    """
    try:
        all_responses = [primary_response] + consistency_responses
        # Filter out None/empty responses
        valid_responses = [r for r in all_responses if r and len(r.strip()) > 0]

        if len(valid_responses) < 2:
            return {
                "score": 50,
                "avg_similarity": 0.0,
                "snippets": [r[:200] if r else "" for r in all_responses[:3]]
            }

        # TF-IDF vectorization + cosine similarity
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(valid_responses)
        sim_matrix = cosine_similarity(tfidf_matrix)

        # Average pairwise similarity (exclude self-comparison diagonal)
        n = len(valid_responses)
        total_sim = 0.0
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                total_sim += sim_matrix[i][j]
                count += 1

        avg_sim = total_sim / count if count > 0 else 0.0

        # Continuous scoring formula (linear interpolation)
        # 0.95+ -> 0-10
        # 0.70-0.95 -> 10-60
        # < 0.70 -> 60-100
        if avg_sim >= 0.95:
            score = (1.0 - avg_sim) / 0.05 * 10
        elif avg_sim >= 0.70:
            score = 10 + (0.95 - avg_sim) / 0.25 * 50
        else:
            score = 60 + (0.70 - avg_sim) / 0.70 * 40

        score = max(0, min(100, score))

        snippets = [r[:200] for r in valid_responses[:3]]

        return {
            "score": score,
            "avg_similarity": round(avg_sim, 4),
            "snippets": snippets
        }

    except Exception as e:
        print(f"[SIGNAL 1 ERROR] {e}")
        return {"score": 50, "avg_similarity": 0.0, "snippets": []}


# ═══════════════════════════════════════════════════════════════
# SIGNAL 2: Confidence Calibration (Weight: 20%)
# ═══════════════════════════════════════════════════════════════

# Hedge word tiers
HEDGE_TIER_1 = [
    r"i'm not sure", r"i don't know", r"i cannot confirm",
    r"i'm unable to verify", r"this may be incorrect"
]
HEDGE_TIER_2 = [
    r"probably", r"possibly", r"i believe", r"i think",
    r"might", r"could be", r"perhaps", r"approximately"
]
HEDGE_TIER_3 = [
    r"around", r"roughly", r"estimated",
    r"allegedly", r"unclear", r"reportedly"
]


def signal_confidence(response: str) -> dict:
    """
    Scan response for hedge words / uncertainty markers.
    More hedging = higher risk.
    """
    try:
        words = response.split()
        if len(words) < 20:
            return {"score": 0, "hedges_found": {}}

        response_lower = response.lower()
        hedges_found = {}
        score = 0

        # Tier 1: 15 points each
        for pattern in HEDGE_TIER_1:
            matches = len(re.findall(pattern, response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 15

        # Tier 2: 10 points each
        for pattern in HEDGE_TIER_2:
            matches = len(re.findall(r'\b' + pattern + r'\b', response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 10

        # Tier 3: 5 points each
        for pattern in HEDGE_TIER_3:
            matches = len(re.findall(r'\b' + pattern + r'\b', response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 5

        # Calculate density-based score
        # A single hedge in 20 words is more suspicious than one in 200 words
        density_multiplier = 100 / max(len(words), 1)  # Normalize to "per 100 words"
        score = score * density_multiplier * 0.8  # Soften the impact
        
        # Add a tiny "uncertainty base" if any hedges are found
        if hedges_found:
            score += 5
            
        # Cap at 100 and round for variety
        score = max(0, min(100, score))

        return {"score": round(score, 2), "hedges_found": hedges_found}

    except Exception as e:
        print(f"[SIGNAL 2 ERROR] {e}")
        return {"score": 0, "hedges_found": {}}


# ═══════════════════════════════════════════════════════════════
# SIGNAL 3: Factual Grounding (Weight: 25%)
# ═══════════════════════════════════════════════════════════════

def signal_grounding(response: str, s1_score: float) -> dict:
    """
    Use SpaCy NER to detect factual claims (numbers, dates, quantities).
    High entity density in an inconsistent response = higher risk.
    """
    try:
        doc = nlp(response)
        allowed_labels = {"DATE", "CARDINAL", "PERCENT", "MONEY", "QUANTITY", "PERSON", "ORG", "GPE", "LOC"}

        entity_count = 0
        for ent in doc.ents:
            if ent.label_ in allowed_labels:
                entity_count += 1

        word_count = len(response.split())
        if word_count == 0:
            return {"score": 0, "entity_count": 0}

        entity_density = entity_count / word_count

        # Amplifier based on S1 (consistency) score
        # s1_score == -1 indicates "Paste Mode" (no consistency check possible)
        if s1_score == -1:
            amplifier = 1.5  # Neutral-high for unverified pasted claims
        else:
            amplifier = 2.0 if s1_score > 50 else 0.8

        score = entity_density * amplifier * 100
        score = min(score, 100)

        return {"score": round(score, 2), "entity_count": entity_count}

    except Exception as e:
        print(f"[SIGNAL 3 ERROR] {e}")
        return {"score": 0, "entity_count": 0}

