# API Documentation: AI Mock Interview Platform

All endpoints are versioned with the prefix `/api/v1`.

## 1. System & Health

### `GET /api/v1/health`
Checks backend health, PostgreSQL connectivity, and provider readiness.

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "connected": true,
    "dialect": "postgresql"
  },
  "providers": {
    "text_ai": {
      "provider": "gemini",
      "configured": true,
      "model": "gemini-2.5-flash"
    },
    "live_ai": {
      "provider": "gemini_live",
      "configured": true,
      "model": "gemini-2.0-flash-exp"
    },
    "supabase": {
      "configured": true
    }
  }
}
```

---

## 2. Document Processing

### `POST /api/v1/documents/resume`
Uploads and validates a candidate resume (`multipart/form-data`).
- Accepts: PDF (`.pdf`) and Word (`.docx`).
- Limit: 10 MB.

### `POST /api/v1/documents/job-description`
Uploads a job description via file or raw text.

### `GET /api/v1/documents/{document_id}`
Retrieves document parsing status and extracted structured JSON data.

---

## 3. Role Detection & Planning

### `POST /api/v1/roles/detect`
Extracts recommended roles from the parsed job description.

### `POST /api/v1/interviews/plan`
Generates a structured interview plan with question objectives and difficulty levels.

---

## 4. Interview Lifecycle & Live Session

### `POST /api/v1/interviews`
Creates an interview session.
- **Request Body:**
  ```json
  {
    "resume_document_id": "uuid",
    "job_description_document_id": "uuid",
    "job_role": "Senior Distributed Systems Engineer",
    "duration_minutes": 30,
    "evaluation_rigor": "target_bar"
  }
  ```

### `GET /api/v1/interviews`
Lists paginated interview history for the authenticated user.

### `GET /api/v1/interviews/{interview_id}`
Retrieves authorized interview details.

### `WSS /api/v1/interviews/{interview_id}/live-ws`
Authenticated WebSocket endpoint for real-time bidirectional audio/transcript relay to Gemini Live.

### `POST /api/v1/interviews/{interview_id}/events`
Logs interview progression events (e.g. `question_asked`, `answer_submitted`, `question_skipped`, `answer_retake`).

### `POST /api/v1/interviews/{interview_id}/complete`
Idempotently marks the interview complete and triggers asynchronous evaluation.

---

## 5. Recordings & Retention

### `POST /api/v1/recordings/upload-url`
Issues a signed upload URL to the private Supabase `interview-recordings` bucket.

### `POST /api/v1/recordings/confirm`
Verifies the uploaded file in Supabase Storage, replaces the single current recording pointer for the user, and schedules cleanup of the prior recording.

### `GET /api/v1/interviews/{interview_id}/recording-url`
Generates a short-lived playback URL for the user's latest recording.

### `DELETE /api/v1/recordings/latest`
Deletes the user's current recording and its underlying storage object.

---

## 6. Reports & Feedback

### `GET /api/v1/interviews/{interview_id}/report`
Fetches the complete evaluation report (overall score 0–100, competency scores, STAR breakdowns).

### `POST /api/v1/interviews/{interview_id}/feedback`
Submits candidate rating (1–5) and qualitative feedback.
