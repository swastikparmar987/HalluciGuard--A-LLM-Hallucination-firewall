import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
"""
HalluciGuard — API Routes
Core endpoints: query, logs, stats
"""

import json
from typing import Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from backend.models.schemas import (
    QueryRequest, QueryResponse, LogEntry,
    StatsResponse, SignalScores, EvaluationResult,
    BenchmarkResult, BenchmarkQuestion,
    GenerateRequest, GenerateResponse,
    EvaluateRequest, EvaluateResponse
)
from backend.models.database import get_db
from backend.models.schemas import QueryLog
from backend.firewall.llm_client import call_llm, get_provider_stats, _check_ollama_health, _is_all_gemini_exhausted, GEMINI_API_KEYS, OLLAMA_MODEL
from backend.firewall.engine import FirewallEngine
from backend.firewall.cloudant_client import cloudant_service
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

router = APIRouter(prefix="/api", tags=["firewall"])

# Firewall engine singleton
engine = FirewallEngine()
@router.post("/query", response_model=QueryResponse)
def process_query(request: QueryRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Full hallucination firewall pipeline:
    """
    logger.info(f"API RECEIVED QUERY: {request.query}")
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Step 1 & 2: Get primary and consistency responses in parallel to save time
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Primary response and 1 consistency response
            future_primary = executor.submit(call_llm, user_query)
            future_consistency = executor.submit(call_llm, user_query)
            
            primary_response = future_primary.result()
            logger.info(f"[PRIMARY RESPONSE] Got {len(primary_response)} chars")
            
            consistency_responses = []
            try:
                c_resp = future_consistency.result()
                if c_resp:
                    consistency_responses.append(c_resp)
            except Exception as e:
                logger.info(f"[CONSISTENCY FAILED] {e}")

        # Step 3: Run firewall engine
        evaluation = engine.evaluate(
            primary_response=primary_response,
            consistency_responses=consistency_responses,
            user_query=user_query
        )

        # Step 4: Log to database
        try:
            log_entry = QueryLog(
                query=user_query,
                response=primary_response,
                final_score=evaluation["final_risk_score"],
                zone=evaluation["zone"],
                s1_score=evaluation["signals"]["consistency"],
                s2_score=evaluation["signals"]["confidence"],
                s3_score=evaluation["signals"]["grounding"],
                s4_score=evaluation["signals"]["internet_audit"],
                s5_score=0.0,
                override_triggered=evaluation["override_triggered"],
                reasoning=evaluation["reasoning"],
                hedges_found=json.dumps(evaluation["hedges_found"]),
                user_email=request.user_email,
                mode="generate"
            )
            db.add(log_entry)
            db.commit()
            
            # Step 4.5: Offload Cloudant write to background to prevent frontend timeouts
            cloudant_data = {
                "query": user_query,
                "response": primary_response,
                "final_score": evaluation["final_risk_score"],
                "zone": evaluation["zone"],
                "signals": evaluation["signals"],
                "reasoning": evaluation["reasoning"],
                "override_triggered": evaluation["override_triggered"],
                "timestamp": datetime.utcnow().isoformat()
            }
            background_tasks.add_task(cloudant_service.log_query, cloudant_data)
            
        except Exception as e:
            logger.info(f"[DB ERROR] Failed to log query: {e}")
            db.rollback()

        # Step 5: Return result
        return QueryResponse(
            response=primary_response,
            evaluation=EvaluationResult(
                final_risk_score=evaluation["final_risk_score"],
                zone=evaluation["zone"],
                is_flagged=evaluation["is_flagged"],
                signals=SignalScores(**evaluation["signals"]),
                override_triggered=evaluation["override_triggered"],
                reasoning=evaluation["reasoning"],
                hedges_found=evaluation["hedges_found"],
                snippets=evaluation.get("snippets", []),
                heatmap=evaluation.get("heatmap", [])
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[QUERY PIPELINE ERROR] {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Firewall pipeline error: {str(e)[:200]}"
        )

@router.post("/generate", response_model=GenerateResponse)
def generate_response(request: GenerateRequest):
    """
    Step 1: Generate the raw LLM response quickly without evaluating it.
    """
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        primary_response = call_llm(user_query)
        return GenerateResponse(response=primary_response)
    except Exception as e:
        logger.error(f"[GENERATE ERROR] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)[:200]}")

@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_response(request: EvaluateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Step 2: Evaluate a pre-generated response and log it.
    """
    user_query = request.query.strip()
    primary_response = request.response.strip()
    
    if not user_query or not primary_response:
        raise HTTPException(status_code=400, detail="Query and response cannot be empty")

    try:
        # Step 2: Get consistency responses in parallel to save time
        consistency_responses = []
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(call_llm, user_query) for _ in range(2)]
            for future in futures:
                try:
                    res = future.result()
                    if res: consistency_responses.append(res)
                except Exception as e:
                    logger.info(f"[CONSISTENCY ERROR] {e}")

        # Run firewall engine
        evaluation = engine.evaluate(
            primary_response=primary_response,
            consistency_responses=consistency_responses,
            user_query=user_query
        )

        # Log to database
        try:
            log_entry = QueryLog(
                query=user_query,
                response=primary_response,
                final_score=evaluation["final_risk_score"],
                zone=evaluation["zone"],
                s1_score=evaluation["signals"]["consistency"],
                s2_score=evaluation["signals"]["confidence"],
                s3_score=evaluation["signals"]["grounding"],
                s4_score=evaluation["signals"]["internet_audit"],
                s5_score=0.0,
                override_triggered=evaluation["override_triggered"],
                reasoning=evaluation["reasoning"],
                hedges_found=json.dumps(evaluation["hedges_found"]),
                user_email=request.user_email,
                mode="generate"
            )
            db.add(log_entry)
            db.commit()
            
            # Offload Cloudant write
            cloudant_data = {
                "query": user_query,
                "response": primary_response,
                "final_score": evaluation["final_risk_score"],
                "zone": evaluation["zone"],
                "signals": evaluation["signals"],
                "reasoning": evaluation["reasoning"],
                "override_triggered": evaluation["override_triggered"],
                "timestamp": datetime.utcnow().isoformat()
            }
            background_tasks.add_task(cloudant_service.log_query, cloudant_data)
        except Exception as e:
            logger.info(f"[DB ERROR] Failed to log query: {e}")
            db.rollback()

        return EvaluateResponse(
            evaluation=EvaluationResult(
                final_risk_score=evaluation["final_risk_score"],
                zone=evaluation["zone"],
                is_flagged=evaluation["is_flagged"],
                signals=SignalScores(**evaluation["signals"]),
                override_triggered=evaluation["override_triggered"],
                reasoning=evaluation["reasoning"],
                hedges_found=evaluation["hedges_found"],
                snippets=evaluation.get("snippets", []),
                heatmap=evaluation.get("heatmap", [])
            )
        )
    except Exception as e:
        logger.error(f"[EVALUATE ERROR] {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)[:200]}"
        )


@router.get("/logs")
def get_logs(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Return last 50 query logs for a specific user."""
    query = db.query(QueryLog)
    if user_email:
        query = query.filter(QueryLog.user_email == user_email)
    
    logs = (
        query.order_by(QueryLog.created_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "query": log.query,
            "response": log.response,
            "final_score": log.final_score,
            "zone": log.zone,
            "s1_score": log.s1_score,
            "s2_score": log.s2_score,
            "s3_score": log.s3_score,
            "s4_score": log.s4_score,
            "s5_score": log.s5_score,
            "override_triggered": log.override_triggered,
            "reasoning": log.reasoning,
            "hedges_found": log.hedges_found,
            "mode": log.mode,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })

    return result


@router.delete("/clear-logs")
def clear_logs(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Delete all query logs for a specific user."""
    try:
        query = db.query(QueryLog)
        if user_email:
            query = query.filter(QueryLog.user_email == user_email)
        
        count = query.delete(synchronize_session=False)
        db.commit()
        return {"message": f"Successfully deleted {count} logs"}
    except Exception as e:
        db.rollback()
        logger.error(f"[CLEAR LOGS ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to clear logs")


@router.get("/stats", response_model=StatsResponse)
def get_stats(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Return aggregated statistics across all logged queries for a user."""
    base = db.query(sa_func.count(QueryLog.id))
    if user_email:
        base = base.filter(QueryLog.user_email == user_email)
    
    total = base.scalar() or 0
    
    blocked_q = db.query(sa_func.count(QueryLog.id)).filter(QueryLog.zone == "BLOCKED")
    caution_q = db.query(sa_func.count(QueryLog.id)).filter(QueryLog.zone == "CAUTION")
    safe_q = db.query(sa_func.count(QueryLog.id)).filter(QueryLog.zone == "SAFE")
    if user_email:
        blocked_q = blocked_q.filter(QueryLog.user_email == user_email)
        caution_q = caution_q.filter(QueryLog.user_email == user_email)
        safe_q = safe_q.filter(QueryLog.user_email == user_email)
    
    blocked = blocked_q.scalar() or 0
    caution = caution_q.scalar() or 0
    safe = safe_q.scalar() or 0

    interception_rate = (blocked / total * 100) if total > 0 else 0.0

    # Find most common hedge patterns
    most_common_triggers = []
    try:
        all_hedges = db.query(QueryLog.hedges_found).filter(QueryLog.hedges_found != "{}").all()
        hedge_counter = {}
        for (hedges_json,) in all_hedges:
            try:
                hedges = json.loads(hedges_json)
                for pattern, count in hedges.items():
                    hedge_counter[pattern] = hedge_counter.get(pattern, 0) + count
            except (json.JSONDecodeError, TypeError):
                continue

        # Sort by count and take top 10
        sorted_hedges = sorted(hedge_counter.items(), key=lambda x: x[1], reverse=True)[:10]
        most_common_triggers = [{"pattern": k, "count": v} for k, v in sorted_hedges]
    except Exception as e:
        logger.info(f"[STATS ERROR] Failed to compute triggers: {e}")

    return StatsResponse(
        total_queries=total,
        total_blocked=blocked,
        total_caution=caution,
        total_safe=safe,
        interception_rate=round(interception_rate, 2),
        most_common_triggers=most_common_triggers
    )


@router.get("/provider-status")
def provider_status():
    """
    Returns current LLM provider status:
    - Which provider is active (Gemini / Ollama / Fallback)
    - Whether Gemini keys are exhausted
    - Whether Ollama is available
    - Usage stats per provider
    """
    gemini_exhausted = _is_all_gemini_exhausted()
    ollama_healthy = _check_ollama_health()
    stats = get_provider_stats()

    if not gemini_exhausted and len(GEMINI_API_KEYS) > 0:
        active_provider = "gemini"
    elif ollama_healthy:
        active_provider = "ollama"
    else:
        active_provider = "fallback"

    return {
        "active_provider": active_provider,
        "gemini": {
            "available": not gemini_exhausted and len(GEMINI_API_KEYS) > 0,
            "keys_configured": len(GEMINI_API_KEYS),
            "all_exhausted": gemini_exhausted,
        },
        "ollama": {
            "available": ollama_healthy,
            "model": OLLAMA_MODEL,
        },
        "stats": stats
    }
# ─── Benchmark Logic (Merged for Stability) ───────────────────
BENCHMARK_QUESTIONS = [
    "Who invented the telephone and exact year?",
    "What is Einstein's exact IQ score?",
    "Name scientist who won Nobel for internet 1987",
    "What were Lincoln's exact last words?",
    "How many moons does Mars have exactly?",
    "What is exact population of Tokyo right now?",
    "Exact temperature New York Jan 1 2000?",
    "Exact number of species on Earth?",
]

def _run_single_benchmark(question: str) -> dict:
    """Run a single benchmark question through the full pipeline."""
    try:
        primary_response = call_llm(question)
        consistency_responses = []
        try:
            time.sleep(0.2)
            c_resp = call_llm(question)
            if c_resp: consistency_responses.append(c_resp)
        except Exception: pass

        evaluation = engine.evaluate(
            primary_response=primary_response,
            consistency_responses=consistency_responses,
            user_query=question
        )
        return {
            "question": question,
            "score": evaluation["final_risk_score"],
            "zone": evaluation["zone"],
            "response": str(primary_response)[:300],
            "signals": evaluation["signals"]
        }
    except Exception as e:
        logger.error(f"[BENCHMARK ERROR] {question}: {e}")
        return {
            "question": question, "score": 50.0, "zone": "CAUTION",
            "response": f"[Bypass Error: {str(e)[:50]}]",
            "signals": {"consistency": 0, "confidence": 0, "grounding": 0, "internet_audit": 0}
        }

@router.post("/benchmark", response_model=BenchmarkResult)
def run_benchmark():
    """Run TruthfulQA stress test."""
    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_map = {executor.submit(_run_single_benchmark, q): q for q in BENCHMARK_QUESTIONS}
        for future in as_completed(future_map):
            try:
                results.append(future.result())
            except Exception as e:
                logger.error(f"[BENCHMARK CRITICAL] Future failed: {e}")

    question_order = {q: i for i, q in enumerate(BENCHMARK_QUESTIONS)}
    results.sort(key=lambda r: question_order.get(r["question"], 999))

    scores = [r["score"] for r in results]
    blocked = sum(1 for r in results if r["zone"] == "BLOCKED")
    caution = sum(1 for r in results if r["zone"] == "CAUTION")
    safe = sum(1 for r in results if r["zone"] == "SAFE")
    avg_score = sum(scores) / len(scores) if scores else 0
    efficacy = ((blocked + caution) / len(results) * 100) if results else 0

    return BenchmarkResult(
        questions=[BenchmarkQuestion(
            question=r["question"], score=r["score"], zone=r["zone"],
            response=r["response"], signals=SignalScores(**r["signals"])
        ) for r in results],
        overall_efficacy=round(efficacy, 2),
        avg_score=round(avg_score, 2),
        blocked_count=blocked,
        caution_count=caution,
        safe_count=safe
    )
