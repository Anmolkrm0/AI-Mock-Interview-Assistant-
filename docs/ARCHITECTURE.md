# Architecture Documentation: AI Mock Interview Platform

## 1. System Overview

The AI Mock Interview Platform is a production-minded web application engineered for real-time conversational practice, structured competency assessment, and evidence-based candidate feedback.

The system is designed as a modular monorepo:
- **Frontend (`frontend/`)**: Next.js 14 App Router, TypeScript (strict), Tailwind CSS, Lucide icons, MediaRecorder / MediaDevices APIs.
- **Backend (`backend/`)**: FastAPI asynchronous service layer, Pydantic v2 data contracts, SQLAlchemy 2 ORM with Alembic migrations, PyMuPDF / python-docx document parsers.
- **Database & Storage**: Supabase PostgreSQL with Row Level Security (RLS) policies and private Supabase Storage buckets.
- **AI Engine**: Google Gemini API (Multimodal Live API over WebSocket relay for real-time voice; Gemini 2.5 Flash for document parsing, planning, and evaluation).

---

## 2. Component Diagram

```
+-------------------------------------------------------------+
|                     Next.js 14 Frontend                     |
|                                                             |
|  - Landing (/)                    - Interview Setup         |
|  - Auth (/login, /signup)         - Live Session (/live)    |
|  - Dashboard (/dashboard)         - Feedback Report         |
+------------------------------+------------------------------+
                               |
                   HTTPS REST  |  WSS (Live Voice)
                               v
+-------------------------------------------------------------+
|                    FastAPI Async Backend                    |
|                                                             |
|  - Auth & Security Middleware (Supabase JWT Verification)   |
|  - Document Extraction Service (PyMuPDF / python-docx)      |
|  - Role Detection & Interview Planning Engine               |
|  - WebSocket Live Relay Service (Gemini Live Bidi Stream)   |
|  - Authoritative Interview State Machine                    |
|  - Evaluation Engine (1-5 Rubric & Evidence Extraction)     |
|  - Recording Retention Service (1-per-user lifecycle)       |
+----------------+-----------------------------+--------------+
                 |                             |
                 v                             v
+--------------------------------+   +------------------------+
|       Supabase Platform        |   |   Google Gemini API    |
|                                |   |                        |
|  - PostgreSQL Database         |   |  - Gemini Multimodal   |
|  - Row Level Security          |   |    Live API (voice)    |
|  - Private Storage Bucket      |   |  - Gemini 2.5 Flash    |
|    ('interview-recordings')    |   |    (parsing & eval)    |
+--------------------------------+   +------------------------+
```

---

## 3. Key Design Principles

1. **Separation of Concerns**: API routes only handle serialization and dependency injection; all business logic resides in dedicated services (`backend/app/services/`).
2. **Authoritative Backend State**: Live session timing, question sequence, and answer attempts are tracked on the server to prevent browser manipulation.
3. **Storage Quota Protection**: To respect free-tier limits (50 MB per file), only the latest recording per user is retained. Previous reports and transcripts are never deleted.
4. **Zero Client Secret Exposure**: All AI provider tokens and Supabase service credentials remain strictly on the backend. The frontend communicates with Gemini Live via an authenticated FastAPI WebSocket relay.
