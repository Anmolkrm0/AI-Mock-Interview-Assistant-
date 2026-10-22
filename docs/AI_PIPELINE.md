# AI Pipeline: Gemini Live & Evaluation Architecture

## 1. Multi-Stage AI Workflow

```
+-------------------------------------------------------------+
| Stage 1: Document Ingestion & Extraction                    |
| - PyMuPDF / python-docx parses raw text                     |
| - Gemini 2.5 Flash extracts skills, timeline, competencies  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Stage 2: Role Detection & Interview Planning                |
| - Identifies target seniority and competencies              |
| - Plans question sequence, target evidence & difficulty     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Stage 3: Live Real-Time Voice Interview                     |
| - Gemini Multimodal Live API via FastAPI WebSocket Relay    |
| - Bidirectional 16kHz PCM audio streaming                   |
| - Live speech recognition and turn synchronization          |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Stage 4: Post-Interview Evaluation & Scoring                |
| - Evaluates answer attempts against planned competencies    |
| - Employs a strict 1-to-5 scoring rubric per competency     |
| - Computes weighted 0-100 overall score and STAR breakdown  |
+-------------------------------------------------------------+
```

---

## 2. Gemini Live WebSocket Integration

The Gemini Live API utilizes persistent WebSocket connections (`wss://`) over the `BidiGenerateContent` protocol.

### Why Backend Relay?
1. **Security**: Permanent Gemini API keys are never leaked to client browsers.
2. **State Synchronization**: Backend intercepts turns, logs answer attempts directly in PostgreSQL, and enforces session deadlines.
3. **Bandwidth Efficiency**: The relay validates and normalizes audio chunks to reduce latency.

---

## 3. Evaluation Rubric & Scoring Engine

Each answered question is scored on a standardized 1–5 scale:
1. **Insufficient Evidence / Incorrect**: Fails to demonstrate basic competency or presents incorrect technical assertions.
2. **Significant Gaps**: Identifies core concept but lacks depth, omitted essential trade-offs.
3. **Competent**: Meets standard hiring expectations; demonstrates solid understanding.
4. **Strong & Well-Supported**: Exceeds standard expectations; provides concrete examples with clear reasoning.
5. **Exceptional**: Principal/Staff caliber; articulates nuanced architectural trade-offs, metrics, and incident edge-cases.

### Score Aggregation:
- Skipped questions are marked `skipped` and excluded from the denominator.
- Competency weights normalize the overall composite score to a 0–100 scale.
- Evidence quotes and STAR framework recommendations are extracted directly from verified transcript lines.
