import logging
from duckduckgo_search import DDGS
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

def search_internet(query: str, max_results: int = 5) -> str:
    """
    Perform a live search for the given query and return combined snippets.
    - Optimized with a strict timeout to prevent UI freezing.
    """
    try:
        results = []
        # Use a context manager with a shorter timeout if possible
        with DDGS(timeout=5) as ddgs:
            # text() doesn't always support direct timeout, so we limit results
            for i, r in enumerate(ddgs.text(query, max_results=max_results)):
                results.append(f"Source: {r.get('title')}\nSnippet: {r.get('body')}")
                if i >= max_results - 1:
                    break
        
        if not results:
            return "No internet search results found for this query."
            
        return "\n\n---\n\n".join(results)
    except Exception as e:
        logger.error(f"[SEARCH ERROR] {e}")
        return f"Internet search bypassed due to latency: {str(e)}"

def deep_fact_check(user_query: str, primary_response: str) -> dict:
    """
    Perform a deep fact check by searching the internet for key claims.
    Non-LLM implementation using entity overlap and keyword validation.
    """
    logger.info(f"[DEEP CHECK] Initializing for: {user_query}")
    
    # 1. Perform search (Fast timeout, increased context)
    search_results = search_internet(user_query, max_results=5)
    
    if "No internet search results" in search_results or "bypassed" in search_results:
        return {
            "grounding_score": 30,  # Neutral-safe if unverified but not contradicted
            "search_results": search_results,
            "verified_entities": [],
            "missing_entities": []
        }

    # 2. Extract entities using SpaCy
    from backend.firewall.signals import nlp
    
    response_doc = nlp(primary_response)
    
    # Define factual entity types
    FACTUAL_TYPES = {"DATE", "EVENT", "FAC", "GPE", "LOC", "MONEY", "NORP", "ORG", "PERSON", "PRODUCT", "QUANTITY", "PERCENT"}
    
    response_entities = {ent.text.lower().strip() for ent in response_doc.ents if ent.label_ in FACTUAL_TYPES}
    
    if not response_entities:
        return {
            "grounding_score": 10,  # Low risk if no factual claims are made
            "search_results": search_results,
            "verified_entities": [],
            "missing_entities": []
        }
    
    # 3. Flexible Matching (Substring check against raw search results)
    # This is MUCH more lenient and accurate than exact set intersection.
    search_results_lower = search_results.lower()
    verified = []
    missing = []
    
    for ent in response_entities:
        # Check if entity exists anywhere in the search snippets
        if ent in search_results_lower:
            verified.append(ent)
        else:
            missing.append(ent)
    
    overlap_ratio = len(verified) / len(response_entities)
    
    # 4. Refined Scoring (More forgiving of snippet truncation)
    # High overlap (e.g. 0.7+) -> 0-15 score (Safe)
    # Medium overlap (0.3-0.7) -> 15-55 (Caution)
    # Low overlap (< 0.3) -> 55-100 (Hallucination/Unverified)
    
    if overlap_ratio >= 0.7:
        score = (1.0 - overlap_ratio) / 0.3 * 15
    elif overlap_ratio >= 0.3:
        score = 15 + (0.7 - overlap_ratio) / 0.4 * 40
    else:
        score = 55 + (0.3 - overlap_ratio) / 0.3 * 45
        
    logger.info(f"[DEEP CHECK] Overlap: {overlap_ratio:.2f} | Score: {score}")
    
    return {
        "grounding_score": round(score, 2),
        "search_results": search_results,
        "verified_entities": list(verified),
        "missing_entities": list(missing)
    }
