# Testing Guide: AI Mock Interview Platform

## 1. Testing Philosophy

Automated testing covers every layer of the application:
1. **Unit Tests**: State machine transitions, document parsers, scoring calculations, rubric weighting, and recording replacement rules.
2. **Integration Tests**: FastAPI API endpoints, Supabase authentication checks, database transactions.
3. **Frontend Validation**: TypeScript strict compilation, Next.js page generation, and form schemas.

---

## 2. Running Backend Tests

Activate the backend virtual environment and run `pytest`:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

### Targeted Test Suites:
- `pytest app/tests/test_health.py`: Health checks and provider readiness.
- `pytest app/tests/test_document_service.py`: PDF and DOCX extraction, magic byte validation.
- `pytest app/tests/test_interview_planner.py`: Duration and rigor adaptation.
- `pytest app/tests/test_state_machine.py`: Authoritative state transitions.
- `pytest app/tests/test_recording_retention.py`: Verification that only 1 recording is kept per user.
- `pytest app/tests/test_evaluation_scoring.py`: 1-5 rubric and weighted 0-100 score calculations.

---

## 3. Running Frontend Tests & Type Checking

```bash
cd frontend
npm run typecheck
npm run build
```
