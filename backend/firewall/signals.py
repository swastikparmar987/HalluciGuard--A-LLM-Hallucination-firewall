"""
HalluciGuard — Scoring Pipeline
4 parallel signals for hallucination detection:
  S1: Self-Consistency (TF-IDF cosine similarity)
  S2: Confidence Calibration (hedge word detection)
  S3: Factual Grounding (Regex Entity density - Vercel Optimized)
  S4: Smart Eval (LLM-as-judge)
"""

import re
import os
import spacy
from concurrent.futures import ThreadPoolExecutor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.firewall.llm_client import call_llm

# Initialize SpaCy once at module level
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    # Fallback if model not found
    nlp = None

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
    try:
        words = response.split()
        if len(words) < 20:
            return {"score": 0, "hedges_found": {}}

        response_lower = response.lower()
        hedges_found = {}
        score = 0

        for pattern in HEDGE_TIER_1:
            matches = len(re.findall(pattern, response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 15

        for pattern in HEDGE_TIER_2:
            matches = len(re.findall(r'\b' + pattern + r'\b', response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 10

        for pattern in HEDGE_TIER_3:
            matches = len(re.findall(r'\b' + pattern + r'\b', response_lower))
            if matches > 0:
                hedges_found[pattern] = matches
                score += matches * 5

        density_multiplier = 100 / max(len(words), 1)
        score = score * density_multiplier * 0.8
        
        if hedges_found:
            score += 5
            
        score = max(0, min(100, score))
        return {"score": round(score, 2), "hedges_found": hedges_found}

    except Exception as e:
        print(f"[SIGNAL 2 ERROR] {e}")
        return {"score": 0, "hedges_found": {}}


# ═══════════════════════════════════════════════════════════════
# SIGNAL 3: Factual Grounding (Weight: 25%) - VERCEL OPTIMIZED
# ═══════════════════════════════════════════════════════════════

def signal_grounding(response: str, s1_score: float) -> dict:
    """
    Vercel-Friendly version: Uses Regex instead of SpaCy for entity detection.
    Detects Dates, Numbers, Money, and months.
    """
    try:
        # Entity patterns
        patterns = [
            r'\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b', # Dates (01-01-2024)
            r'\b\d+(?:\.\d+)?%\b',                # Percentages
            r'\$\d+(?:\.\d+)?(?:\s*[kmbtk])?\b',   # Money ($100k)
            r'\b\d{4,}\b',                         # Large numbers (4+ digits)
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b',
            r'\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b'
        ]
        
        entity_count = 0
        for p in patterns:
            entity_count += len(re.findall(p, response, re.IGNORECASE))

        word_count = len(response.split())
        if word_count == 0:
            return {"score": 0, "entity_count": 0}

        entity_density = entity_count / word_count

        if s1_score == -1:
            amplifier = 1.5
        else:
            amplifier = 2.0 if s1_score > 50 else 0.8

        score = entity_density * amplifier * 100
        score = min(score, 100)

        return {"score": round(score, 2), "entity_count": entity_count}

    except Exception as e:
        print(f"[SIGNAL 3 ERROR] {e}")
        return {"score": 0, "entity_count": 0}


# ═══════════════════════════════════════════════════════════════
# SIGNAL 4: Smart Eval (Weight: 20%)
# ═══════════════════════════════════════════════════════════════

def signal_smart_eval(user_query: str, response: str) -> dict:
    """
    Uses a strong LLM as a judge to evaluate hallucination risk.
    Returns a score from 0 (Safe) to 100 (Hallucinated).
    """
    if os.getenv("ENABLE_SMART_EVAL", "true").lower() != "true":
        return {"score": 0, "reasoning": "Smart Eval disabled"}

    prompt = f"""
You are a Hallucination Detection Judge. Your task is to score a given LLM response for factual accuracy and hallucination risk based on the user's query.

User Query: {user_query}
LLM Response: {response}

Analyze the response for:
1. Factual contradictions or fabrications.
2. Over-confidence in uncertain claims.
3. Logical inconsistencies.

Return ONLY a numeric score from 0 to 100, where:
- 0-20: Highly accurate, no hallucinations.
- 21-50: Likely accurate but contains minor unverified claims or hedges.
- 51-80: Contains clear factual errors or fabricated details.
- 81-100: Major hallucination or completely fabricated response.

SCORE (0-100):"""

    try:
        judge_response = call_llm(prompt)
        # Extract the first number found in the response
        import re
        match = re.search(r'(\d+)', judge_response)
        if match:
            score = float(match.group(1))
            score = max(0, min(100, score))
            return {"score": score}
        return {"score": 50, "error": "Could not parse judge score"}
    except Exception as e:
        print(f"[SIGNAL 4 ERROR] {e}")
        return {"score": 50, "error": str(e)}
