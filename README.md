# AI Mock Interview Platform 🎯

A production-minded, full-stack AI mock interview platform featuring real-time conversational voice interviews, evidence-based STAR competency scoring, and persistent cloud storage.

Built with **Next.js 14**, **FastAPI**, **Supabase PostgreSQL & Storage**, and **Google Gemini Multimodal Live API**.

---

## 🌟 Key Features

1. **Document Ingestion & Validation**
   - Drag-and-drop resume upload (PDF & DOCX) with magic byte validation and size checks.
   - Job description parsing via file upload or raw text.
   - Structured skill and experience extraction using Gemini without fabricated data.
2. **Adaptive Interview Planning**
   - Automated role detection with confidence scoring.
   - Dynamic question plan tailored to role seniority, target duration (10, 20, 30, 45 min), and rigor (**Standard**, **Target Bar**, or **Stress Test**).
3. **Real-Time Live Voice Simulation**
   - Conversational voice interview powered by Gemini Multimodal Live API over a secure backend WebSocket relay.
   - Live camera preview, microphone visualizer, and synchronized real-time transcript.
   - Text answer fallback, question skipping, answer retakes, and synchronized server timer.
4. **Evidence-Based Evaluation Reports**
   - 1-to-5 competency rubric evaluating actual candidate responses.
   - Overall composite score (0–100) with peer median benchmarks.
   - Exact transcript quotes, identified architectural/behavioral gaps, and actionable STAR framework outlines.
5. **Single Latest Recording Retention**
   - Preserves candidate history, reports, and transcripts permanently while retaining only the latest audio recording per user to respect storage limits.

---

## 🏗️ Monorepo Structure

```
ai-mock-interview/
├── frontend/             # Next.js 14 App Router, TypeScript, Tailwind, Lucide
│   ├── app/              # Routes: /, /login, /signup, /dashboard, /interview
│   ├── components/       # Modular UI components
│   ├── hooks/            # MediaRecorder, Audio, and Auth hooks
│   └── services/         # API clients
├── backend/              # Python FastAPI, SQLAlchemy 2, Alembic, Pydantic v2
│   ├── app/
│   │   ├── api/v1/       # REST and WebSocket endpoints
│   │   ├── core/         # Config, Database engine, Security
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic v2 validation contracts
│   │   ├── services/     # Core business logic (docs, planning, eval, relay)
│   │   └── providers/    # Gemini Live and Text provider adapters
│   └── alembic/          # Version-controlled database migrations
├── docs/                 # In-depth architectural & deployment specs
├── scripts/              # Automated setup & utility scripts
└── docker-compose.yml    # Local multi-container development environment
```

---

## 🚀 Quickstart: Local Development

### 1. Automated Setup
Run the setup script from the repository root:
```bash
./scripts/setup.sh
```

### 2. Manual Setup

#### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and DATABASE_URL
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Backend API docs are available at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).

---

## 🧪 Testing

### Backend Unit & Integration Tests
```bash
cd backend
source .venv/bin/activate
pytest -v
```

### Frontend Typecheck & Build
```bash
cd frontend
npm run typecheck
npm run build
```

---

## 🚢 Deployment to Render

This repository includes a native [`render.yaml`](render.yaml) blueprint specification for one-click full-stack deployment.

Detailed instructions are available in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

- **Render Blueprint**: Connect repository on Render -> Select **Blueprints** -> Render automatically detects `render.yaml` and deploys both backend and frontend.
- **Backend**: Python Web Service running `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Frontend**: Node Web Service running `npm ci && npm run build` and `npm start`
- **Database**: Supabase PostgreSQL with Alembic migrations (`alembic upgrade head`)

---

## 🔒 Security & Privacy

- **Zero Key Leaks**: All Gemini API keys and Supabase service keys remain strictly on the backend.
- **User Isolation**: Protected with PostgreSQL Row Level Security (RLS) and Supabase JWT authentication.
- **Private Storage**: Audio recordings are saved in private Supabase Storage buckets accessible only through short-lived signed URLs.
