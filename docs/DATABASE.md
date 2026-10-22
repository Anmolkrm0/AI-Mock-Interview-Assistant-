# Database Schema & Migrations: AI Mock Interview Platform

## 1. Database Overview

The system uses **Supabase PostgreSQL** as the persistent source of truth, managed via **SQLAlchemy 2** models and versioned **Alembic** migrations.

PostgreSQL Row Level Security (RLS) guarantees user isolation.

---

## 2. Entity Relationship Model

```
+----------------+          +-------------------+
|    profiles    | 1      * |     documents     |
|----------------|<-------->|-------------------|
| id (UUID, PK)  |          | id (UUID, PK)     |
| display_name   |          | user_id (FK)      |
| created_at     |          | document_type     |
+-------+--------+          | storage_path      |
        | 1                 | extracted_data    |
        |                   +---------+---------+
        | *                           |
+-------v--------+                    |
|   interviews   |<-------------------+ (resume & JD)
|----------------| 1
| id (UUID, PK)  |
| user_id (FK)   |
| job_role       |
| duration_mins  |
| status         |
+-------+--------+
        |
        +---- 1:1 ----> interview_plans
        |
        +---- 1:* ----> questions ---- 1:* ----> answer_attempts
        |
        +---- 1:* ----> interview_events
        |
        +---- 1:1 ----> reports
        |
        +---- 1:1 ----> recordings (PK is user_id -> ensures 1 per user!)
        |
        +---- 1:1 ----> feedback
```

---

## 3. Core Tables

### `profiles`
Maps 1:1 to Supabase `auth.users`.
- `id` (UUID, PK)
- `display_name` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `documents`
Stores metadata and parsed JSON for resumes and job descriptions.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles.id)
- `document_type` (TEXT: `resume` | `job_description`)
- `file_name` (TEXT)
- `storage_path` (TEXT)
- `extracted_data` (JSONB)
- `parsing_status` (TEXT: `pending` | `completed` | `failed`)
- `created_at` (TIMESTAMPTZ)

### `interviews`
Tracks the interview session lifecycle.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles.id)
- `resume_document_id` (UUID, FK -> documents.id)
- `job_description_document_id` (UUID, FK -> documents.id)
- `job_role` (TEXT)
- `duration_minutes` (INTEGER: 10, 20, 30, 45)
- `evaluation_rigor` (TEXT: `standard` | `target_bar` | `stress_test`)
- `status` (TEXT: `created` | `preparing` | `ready` | `connecting` | `in_progress` | `paused` | `finalizing` | `evaluating` | `completed` | `failed` | `cancelled`)
- `started_at` (TIMESTAMPTZ)
- `deadline_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)

### `questions` & `answer_attempts`
Maintains full question order and individual answer attempts without overwriting.
- Retakes link to the same question ID with an incremented `attempt_number`.
- `selected_for_evaluation` flags the attempt chosen for scoring.

### `recordings`
Enforces the **Single Latest Recording** rule:
- `user_id` (UUID, PRIMARY KEY)
- `interview_id` (UUID, FK -> interviews.id)
- `storage_path` (TEXT)
- `mime_type` (TEXT)
- `file_size_bytes` (BIGINT)
- `duration_seconds` (INTEGER)
- `created_at` (TIMESTAMPTZ)
