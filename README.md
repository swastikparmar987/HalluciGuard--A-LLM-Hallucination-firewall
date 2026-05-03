# 🛡️ HalluciGuard — LLM Hallucination Firewall

A real-time firewall that **intercepts LLM responses before showing them to users**, scores them for hallucination risk using a **4-signal detection pipeline**, and **blocks high-risk answers** automatically. Built as an educational tool to demonstrate how AI can be made safer.

![HalluciGuard](https://img.shields.io/badge/version-2.4.0-F7931A) ![Python](https://img.shields.io/badge/Python-3.11-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688)

---

## 🏗️ Architecture

```
User Query → LLM Response → HalluciGuard Firewall → 4 Signal Analysis → SAFE / CAUTION / BLOCKED
```

### 4 Detection Signals

| Signal | Weight | Method |
|--------|--------|--------|
| **S1: Self-Consistency** | 25% | Call LLM multiple times, compare via TF-IDF cosine similarity |
| **S2: Confidence Calibration** | 20% | Regex scan for hedge words across 3 severity tiers |
| **S3: Factual Grounding** | 25% | SpaCy NER entity density analysis |
| **S4: Web Verification** | 30% | Real-time internet audit cross-checking claims against live search results |

### Risk Zones

- 🟢 **SAFE** (0–35): Response verified, shown to user
- 🟡 **CAUTION** (36–65): Possible issues, shown with warning highlights
- 🔴 **BLOCKED** (66–100): High hallucination risk, response is blocked

---

## ✨ Features

- **Authentication Wall** — Users must sign up / sign in before accessing the app. Each account gets a unique auto-generated robot avatar (via DiceBear API).
- **Per-User Data Isolation** — Every query, log, and stat is tied to the logged-in user's email. New accounts start fresh; returning users see their full history.
- **Multi-Model Fallback** — Gemini API key rotation (multiple keys) with automatic fallback to local Ollama if all cloud keys are exhausted.
- **Settings Panel** — Adjust signal weights, toggle between Gemini (Cloud) and Ollama (Local), enable/disable web verification.
- **Interactive Chat** — Decoupled generate → evaluate flow with real-time "Did You Know?" facts during evaluation.
- **Dashboard / History** — Visual charts (area chart, radial bar) showing accuracy trends, result mix, and recent query logs.
- **Error Boundary Protection** — UI never crashes to a black screen; graceful fallback for any rendering errors.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Ollama (local LLM fallback): [Install Ollama](https://ollama.ai)
- At least one Gemini API key (or Ollama as sole provider)

### 1. Clone & Configure

```bash
cd llm_hallucination2
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Ollama (Fallback LLM)

```bash
ollama pull llama3.2:1b
ollama serve
```

### 3. Start Backend

```bash
pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
├── .env                        # Environment variables
├── .env.example                # Template for env vars
├── README.md
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt
│   ├── firewall/
│   │   ├── engine.py           # Scoring orchestration + overrides
│   │   ├── signals.py          # 4 detection signals
│   │   ├── llm_client.py       # Gemini + Ollama multi-model client
│   │   ├── search_util.py      # Web verification utility
│   │   └── cloudant_client.py  # IBM Cloudant telemetry logging
│   ├── models/
│   │   ├── database.py         # SQLAlchemy + SQLite config (auto-migration)
│   │   └── schemas.py          # ORM models + Pydantic schemas
│   └── routers/
│       ├── routes.py           # Core API endpoints
│       ├── auth.py             # Signup / Login endpoints
│       └── benchmark.py        # TruthfulQA benchmark
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Routing, ProtectedRoute, AppShell with sidebar
        ├── main.jsx
        ├── index.css
        ├── assets/
        │   └── logo.png        # HalluciGuard logo
        ├── data/
        │   └── facts.js        # "Did You Know?" LLM facts
        ├── components/
        │   ├── PostCard.jsx    # Chat message card (with Error Boundary)
        │   ├── RiskMeter.jsx   # Gauge-style risk visualization
        │   ├── SignalBreakdown.jsx  # 4-signal bar chart
        │   └── HallucinationReport.jsx # Detailed evaluation report
        └── pages/
            ├── HomePage.jsx    # Landing page with animations
            ├── AuthPage.jsx    # Sign In / Sign Up
            ├── Chat.jsx        # Chat interface
            ├── Dashboard.jsx   # History & analytics
            └── Settings.jsx    # Firewall tuning settings
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive user session |
| `POST` | `/api/generate` | Generate raw LLM response (Step 1) |
| `POST` | `/api/evaluate` | Evaluate response for hallucinations (Step 2) |
| `POST` | `/api/query` | Full pipeline: generate + evaluate in one call |
| `GET`  | `/api/logs?user_email=...` | Last 50 query logs (filtered by user) |
| `GET`  | `/api/stats?user_email=...` | Aggregated stats (filtered by user) |
| `GET`  | `/api/provider-stats` | Current LLM provider status |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY_1` | Primary Gemini API key | _(required)_ |
| `GEMINI_API_KEY_2` | Secondary Gemini key (rotation) | _(optional)_ |
| `GEMINI_API_KEY_3` | Tertiary Gemini key (rotation) | _(optional)_ |
| `OLLAMA_URL` | Local Ollama URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.2:1b` |
| `ENABLE_SMART_EVAL` | Enable S4 web verification | `true` |
| `CLOUDANT_URL` | IBM Cloudant URL for telemetry | _(optional)_ |
| `CLOUDANT_API_KEY` | Cloudant API key | _(optional)_ |

---

## 🔐 Authentication

- Users must create an account or sign in to access Chat, History, and Settings.
- User data is stored in IBM Cloudant (signup/login) and SQLite (query logs).
- Each user gets a **unique robot avatar** auto-generated from their email via the DiceBear API.
- All query logs and stats are **isolated per user** — no cross-account data leakage.

---

## 📄 License

MIT
