"""
HalluciGuard — Database Models & Pydantic Schemas
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.sql import func
from backend.models.database import Base
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime


# ─── SQLAlchemy ORM Model ───────────────────────────────────────

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    final_score = Column(Float, nullable=False)
    zone = Column(String(20), nullable=False)
    user_email = Column(String(100), index=True) # Associated user email
    mode = Column(String(20), default="generate") # "generate" or "analyze"

    # Individual signal scores
    s1_score = Column(Float, default=0.0)  # Self-Consistency
    s2_score = Column(Float, default=0.0)  # Confidence Calibration
    s3_score = Column(Float, default=0.0)  # Factual Grounding
    s4_score = Column(Float, default=0.0)  # Internet Audit
    s5_score = Column(Float, default=0.0)  # Smart Eval (LLM-as-judge)

    override_triggered = Column(Boolean, default=False)
    reasoning = Column(Text, default="")
    hedges_found = Column(Text, default="{}")  # JSON string

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Pydantic Schemas ───────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    user_email: Optional[str] = None


class SignalScores(BaseModel):
    consistency: float
    confidence: float
    grounding: float
    internet_audit: float


class EvaluationResult(BaseModel):
    final_risk_score: float
    zone: str
    is_flagged: bool
    signals: SignalScores
    override_triggered: bool
    reasoning: str
    hedges_found: Dict[str, int]
    snippets: List[str]
    heatmap: List[Dict[str, Any]]


class QueryResponse(BaseModel):
    response: str
    evaluation: EvaluationResult

class GenerateRequest(BaseModel):
    query: str
    user_email: Optional[str] = None
    demo_mode: bool = False

class GenerateResponse(BaseModel):
    response: str

class EvaluateRequest(BaseModel):
    query: str
    response: str
    user_email: Optional[str] = None
    demo_mode: bool = False

class EvaluateResponse(BaseModel):
    evaluation: EvaluationResult


class LogEntry(BaseModel):
    id: int
    query: str
    response: str
    final_score: float
    zone: str
    s1_score: float
    s2_score: float
    s3_score: float
    s4_score: float  # Internet Audit
    s5_score: Optional[float] = 0.0
    override_triggered: bool
    reasoning: str
    hedges_found: str
    mode: str = "generate"
    created_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_queries: int
    total_blocked: int
    total_caution: int
    total_safe: int
    interception_rate: float
    most_common_triggers: List[Dict[str, Any]]


class BenchmarkQuestion(BaseModel):
    question: str
    score: float
    zone: str
    response: str
    signals: SignalScores


class BenchmarkResult(BaseModel):
    questions: List[BenchmarkQuestion]
    overall_efficacy: float
    avg_score: float
    blocked_count: int
    caution_count: int
    safe_count: int
