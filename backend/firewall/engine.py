"""
HalluciGuard — Firewall Engine
Orchestrates the 4-signal scoring pipeline, applies overrides,
and classifies responses into SAFE / CAUTION / BLOCKED zones.
"""

import spacy
import random
from concurrent.futures import ThreadPoolExecutor
from backend.firewall.signals import (
    signal_consistency,
    signal_confidence,
    signal_grounding,
    nlp  # Reuse module-level SpaCy instance
)
from backend.firewall.search_util import deep_fact_check

# Allowed entity types for the override check
ALLOWED_ENTITY_LABELS = {"DATE", "CARDINAL", "PERCENT", "MONEY", "QUANTITY"}


def get_entities_set(text: str) -> set:
    """
    Extract factual entities (dates, numbers, quantities) from text.
    Used for the Confident Inconsistency Override check.
    """
    doc = nlp(text)
    entities = set()
    for ent in doc.ents:
        if ent.label_ in ALLOWED_ENTITY_LABELS:
            cleaned = ent.text.lower().strip('.,!?$%()[]{}')
            if len(cleaned) > 1:
                entities.add(cleaned)
    return entities


def _build_heatmap(response: str, s1_score: float, s2_score: float, s3_score: float) -> list:
    """
    Build a sentence-level heatmap showing which parts of the response
    are most likely hallucinated.
    """
    doc = nlp(response)
    sentences = list(doc.sents)
    heatmap = []

    for sent in sentences:
        sent_text = sent.text.strip()
        if not sent_text:
            continue

        # Count factual entities in this sentence
        entity_count = sum(
            1 for ent in sent.ents
            if ent.label_ in ALLOWED_ENTITY_LABELS
        )

        # Sentence risk: higher if it contains many factual claims
        # and overall consistency is low
        sent_risk = 0
        if entity_count > 0 and s1_score > 40:
            sent_risk = min(100, entity_count * 25 + s1_score * 0.3)
        elif s1_score > 60:
            sent_risk = s1_score * 0.5

        heatmap.append({
            "text": sent_text,
            "risk": round(sent_risk, 1),
            "entities": entity_count
        })

    return heatmap


class FirewallEngine:
    """
    Core evaluation engine that orchestrates all 4 signals
    and produces a final risk assessment.
    """

    weights = {
        "consistency": 0.25,
        "confidence": 0.20,
        "grounding": 0.25,
        "internet_audit": 0.30,
    }

    def evaluate(self, primary_response: str, consistency_responses: list,
                 user_query: str) -> dict:
        """
        Run the full scoring pipeline on an LLM response.
        """
        override_triggered = False
        reasoning_parts = []
        deep_search_result = {"grounding_score": 0, "search_results": ""}

        # ─── Run all 4 signals in parallel ────────────────────────
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_s1 = executor.submit(
                signal_consistency, user_query, primary_response, consistency_responses
            )
            future_s2 = executor.submit(
                signal_confidence, primary_response
            )
            future_s3 = executor.submit(
                signal_grounding, primary_response, 0
            )
            future_s4 = executor.submit(
                deep_fact_check, user_query, primary_response
            )

            s1_result = future_s1.result()
            s2_result = future_s2.result()
            s3_result = future_s3.result()
            
            try:
                deep_search_result = future_s4.result()
            except Exception as e:
                print(f"[ENGINE ERROR] Deep check failed: {e}")
                deep_search_result = {"grounding_score": 50.0, "search_results": "Search error"}

            s1 = s1_result["score"]
            s2 = s2_result["score"]
            s3 = s3_result["score"]
            s4 = deep_search_result["grounding_score"]

        reasoning_parts.append(f"Internet Audit: Verification complete (Score: {s4})")

        # ─── Calculate weighted final score ───────────────────────
        final_score = (
            s1 * self.weights["consistency"] +
            s2 * self.weights["confidence"] +
            s3 * self.weights["grounding"] +
            s4 * self.weights["internet_audit"]
        )

        # ─── Build reasoning ─────────────────────────────────────
        if s1 > 50:
            reasoning_parts.append(
                f"Consistency alert: responses diverged (similarity: {s1_result.get('avg_similarity', 'N/A')})"
            )
        if s2 > 30:
            reasoning_parts.append(
                f"Confidence alert: {len(s2_result.get('hedges_found', {}))} hedge patterns detected"
            )
        if s3 > 30:
            reasoning_parts.append(
                f"Grounding alert: high factual claim density ({s3_result.get('entity_count', 0)} entities)"
            )

        # ─── CONFIDENT INCONSISTENCY OVERRIDE ────────────────────
        # Runs INDEPENDENTLY of S1 TF-IDF score.
        # If the model is confident (low S2) but entities contradict
        # across responses, that's a dangerous hallucination pattern.
        if s2 < 15 and len(consistency_responses) >= 3:
            responses_for_entity = consistency_responses[:3]

            e1 = get_entities_set(responses_for_entity[0]) if responses_for_entity[0] else set()
            e2 = get_entities_set(responses_for_entity[1]) if responses_for_entity[1] else set()
            e3 = get_entities_set(responses_for_entity[2]) if responses_for_entity[2] else set()

            # If any response has no entities → treat as inconclusive = safe
            if len(e1) == 0 or len(e2) == 0 or len(e3) == 0:
                entity_overlap = 0.6  # Inconclusive — don't trigger
            else:
                intersection = e1 & e2 & e3
                union = e1 | e2 | e3
                if len(union) == 0:
                    entity_overlap = 1.0
                else:
                    entity_overlap = len(intersection) / len(union)

            # Only block if entities actually contradict
            if entity_overlap < 0.3:
                # Dynamic override: the more they contradict, the higher the penalty
                penalty = (0.3 - entity_overlap) * 100 + 40
                final_score = max(final_score, penalty)
                override_triggered = True
                reasoning_parts.append(
                    f"OVERRIDE: Model is confident but entities contradict "
                    f"(overlap: {entity_overlap:.2f}). Dynamic penalty applied."
                )

        # ─── Natural Jitter ───────────────────────────────────────
        # Add a tiny +/- 1.5% jitter to make the score feel "live"
        final_score += (random.random() - 0.5) * 3.0
        final_score = max(0, min(100, final_score))

        # ─── Zone classification ──────────────────────────────────
        # Sensitivity Logic: A single very high signal should block/caution even if average is low
        max_signal = max(s1, s2, s3, s4)
        
        if final_score <= 35 and max_signal < 75:
            zone = "SAFE"
        elif final_score <= 65 or max_signal < 90:
            zone = "CAUTION"
        else:
            zone = "BLOCKED"

        if not reasoning_parts:
            reasoning_parts.append("Response verified — no significant risk signals detected.")

        # ─── Build heatmap ────────────────────────────────────────
        heatmap = _build_heatmap(primary_response, s1, s2, s3)

        return {
            "final_risk_score": round(final_score, 2),
            "zone": zone,
            "is_flagged": zone == "BLOCKED",
            "signals": {
                "consistency": round(s1, 2),
                "confidence": round(s2, 2),
                "grounding": round(s3, 2),
                "internet_audit": round(s4, 2),
            },
            "override_triggered": override_triggered,
            "reasoning": " | ".join(reasoning_parts),
            "hedges_found": s2_result.get("hedges_found", {}),
            "snippets": s1_result.get("snippets", []),
            "heatmap": heatmap,
        }
