"""
HalluciGuard — FastAPI Application Entry Point
LLM Hallucination Firewall Backend
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env at project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Add project root to Python path so imports work
project_root = str(Path(__file__).resolve().parent.parent)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models.database import init_db
from backend.routers.routes import router as routes_router
from backend.routers.auth import router as auth_router

# ─── Create FastAPI app ──────────────────────────────────────────
app = FastAPI(
    title="HalluciGuard",
    description="LLM Hallucination Firewall — Real-time response verification engine",
    version="1.0.0",
)

# ─── CORS (allow Vite dev server) ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include routers ─────────────────────────────────────────────
app.include_router(routes_router)
app.include_router(auth_router)


# ─── Startup event ───────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    """Initialize database tables on startup."""
    print("=" * 46)
    print("    HalluciGuard Firewall v1.0")
    print("    LLM Hallucination Detection Engine")
    print("=" * 46)
    init_db()
    print("[STARTUP] Database initialized")
    print(f"[STARTUP] watsonx URL: {os.getenv('WATSONX_URL', 'not set')}")
    print(f"[STARTUP] Ollama URL: {os.getenv('OLLAMA_URL', 'not set')}")
    print(f"[STARTUP] Smart Eval: {os.getenv('ENABLE_SMART_EVAL', 'true')}")


@app.get("/")
def root():
    return {
        "name": "HalluciGuard",
        "version": "1.0.0",
        "status": "operational",
        "description": "LLM Hallucination Firewall API"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
