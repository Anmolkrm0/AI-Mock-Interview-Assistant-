import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.schemas.plan import InterviewPlanResponse, PlannedQuestion


def calculate_question_count(duration_minutes: int) -> int:
    """Adapts question count based on configured duration."""
    if duration_minutes <= 10:
        return 3
    elif duration_minutes <= 20:
        return 5
    elif duration_minutes <= 30:
        return 7
    else:
        return 10


async def generate_interview_plan(
    job_role: str,
    duration_minutes: int,
    evaluation_rigor: str,
    candidate_profile: Optional[Dict[str, Any]] = None,
    job_description: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates a structured, tailored interview plan adapted to duration and rigor.
    """
    target_count = calculate_question_count(duration_minutes)

    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
You are an expert Principal Engineer and Lead Interviewer creating an authoritative interview plan.
Role: {job_role}
Duration: {duration_minutes} minutes
Evaluation Rigor: {evaluation_rigor}
Target Question Count: {target_count}

Candidate Profile Context:
{json.dumps(candidate_profile or {}, indent=2)[:3000]}

Job Description Requirements:
{json.dumps(job_description or {}, indent=2)[:3000]}

Guidelines:
1. Provide exactly {target_count} ordered questions that thoroughly assess technical competency, architecture, and problem-solving for this specific role.
2. For each question, detail:
   - competency: the exact competency tested
   - difficulty: Easy, Medium, Hard, or Staff (adjust for rigor: {evaluation_rigor})
   - question_type: technical, architectural, behavioral, or trade_off
   - expected_evidence: explicit concrete technical signals that demonstrate a strong hire
   - suggested_follow_ups: 2-3 adaptive probing questions
   - time_allocation_minutes: estimated time for this turn
3. Do NOT repeat questions. Start with a foundational inquiry and escalate into architectural trade-offs.
"""
            response = await client.aio.models.generate_content(
                model=settings.GEMINI_TEXT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=InterviewPlanResponse,
                ),
            )
            if response.text:
                return json.loads(response.text.strip())
        except Exception as err:
            print(f"Gemini plan generation failed: {err}")

    # Deterministic tailored plan generation adapted to role, duration, and rigor
    rigor_label = evaluation_rigor.replace("_", " ").title()
    difficulty_map = {
        "standard": "Medium",
        "target_bar": "Hard",
        "stress_test": "Staff",
    }
    diff = difficulty_map.get(evaluation_rigor, "Hard")

    all_questions_bank = [
        {
            "id": 1,
            "question_text": f"Can you walk me through the architecture of a high-impact system you designed or scaled relevant to the {job_role} position?",
            "competency": "System Architecture & Breadth",
            "difficulty": "Medium",
            "question_type": "architectural",
            "expected_evidence": "Clearly states requirements, traffic volumes, component boundaries, and technology trade-offs.",
            "suggested_follow_ups": [
                "What was the single biggest bottleneck in that design?",
                "How did you monitor data consistency under peak load?"
            ],
            "time_allocation_minutes": 5,
        },
        {
            "id": 2,
            "question_text": "Suppose a critical production service begins experiencing intermittent 504 timeouts and elevated tail-latency (p99). How do you systematically triage and isolate the root cause?",
            "competency": "Production Incident Triage & Resilience",
            "difficulty": diff,
            "question_type": "technical",
            "expected_evidence": "Methodical triage using distributed traces, metrics, connection pool starvation, and database slow-log inspection before remediation.",
            "suggested_follow_ups": [
                "How would you prevent cascading failures across downstream services?",
                "When would you trip a circuit breaker vs shedding load?"
            ],
            "time_allocation_minutes": 5,
        },
        {
            "id": 3,
            "question_text": "How do you evaluate consistency vs availability trade-offs when designing a distributed event-driven data pipeline under network partitions?",
            "competency": "Distributed Systems & Consistency",
            "difficulty": diff,
            "question_type": "trade_off",
            "expected_evidence": "Grounds answer in CAP/PACELC theorem, compares linearizable consensus (Raft) with eventual consistency, and addresses idempotent message deduplication.",
            "suggested_follow_ups": [
                "How do you handle out-of-order event delivery?",
                "What is your dead-letter queue replay strategy?"
            ],
            "time_allocation_minutes": 6,
        },
        {
            "id": 4,
            "question_text": "Tell me about a time you had a strong technical disagreement with a team member or stakeholder regarding system design. How did you resolve it?",
            "competency": "Technical Leadership & Communication",
            "difficulty": "Medium",
            "question_type": "behavioral",
            "expected_evidence": "Structured using STAR method; demonstrates data-driven benchmarking and constructive team alignment without ego.",
            "suggested_follow_ups": [
                "If the benchmark data was inconclusive, how would you have broken the tie?",
                "What would you do differently in retrospect?"
            ],
            "time_allocation_minutes": 4,
        },
        {
            "id": 5,
            "question_text": "How would you design a database schema migration for a zero-downtime table containing 500 million rows that is actively taking writes?",
            "competency": "Data Modeling & Zero-Downtime Operations",
            "difficulty": diff,
            "question_type": "technical",
            "expected_evidence": "Explains dual-writing, backfill batching with rate-limiting, shadow reads, and final switch-over without taking table locks.",
            "suggested_follow_ups": [
                "How do you guarantee write order between the old and new columns?",
                "What rollback safety checks are in place?"
            ],
            "time_allocation_minutes": 5,
        },
        {
            "id": 6,
            "question_text": "In a microservices architecture, how do you manage distributed transactions without relying on heavy two-phase commit (2PC)?",
            "competency": "Microservice Architecture & Sagas",
            "difficulty": diff,
            "question_type": "architectural",
            "expected_evidence": "Articulates the Saga pattern (choreography vs orchestration) and compensating transactions with idempotent handlers.",
            "suggested_follow_ups": [
                "How do you handle compensating transaction failures?",
                "How do you surface transaction state to client UIs?"
            ],
            "time_allocation_minutes": 5,
        },
        {
            "id": 7,
            "question_text": "What strategies do you employ to prevent SSRF, SQL injection, and broken object-level authorization (BOLA) in high-throughput API gateways?",
            "competency": "API Security & Defensive Engineering",
            "difficulty": diff,
            "question_type": "technical",
            "expected_evidence": "Private IP subnet validation, parameterization, cryptographic token claims verification, and tenant ownership scoping.",
            "suggested_follow_ups": [
                "How do you protect internal cloud metadata endpoints (169.254.169.254)?",
                "How is rate limiting enforced at scale?"
            ],
            "time_allocation_minutes": 4,
        },
        {
            "id": 8,
            "question_text": "If our primary database cluster suffered complete data-center failure, describe the recovery process to restore operations with minimal RPO and RTO.",
            "competency": "Disaster Recovery & Business Continuity",
            "difficulty": "Staff",
            "question_type": "architectural",
            "expected_evidence": "Differentiates RPO vs RTO, active-active vs active-passive replication topologies, and automated DNS failover.",
            "suggested_follow_ups": [
                "How do you verify backup integrity before a crisis?"
            ],
            "time_allocation_minutes": 5,
        },
        {
            "id": 9,
            "question_text": "How do you measure and optimize frontend web vitals (LCP, FID/INP, CLS) in complex single-page or SSR applications?",
            "competency": "Performance Optimization",
            "difficulty": "Medium",
            "question_type": "technical",
            "expected_evidence": "Identifies critical render paths, asset preloading, server-side caching, and DOM hydration cost reduction.",
            "suggested_follow_ups": [
                "How do third-party script tags affect LCP?"
            ],
            "time_allocation_minutes": 4,
        },
        {
            "id": 10,
            "question_text": "Reflecting on your technical journey, what is the most challenging technical mistake you made in production, and what institutional safeguards did you implement afterward?",
            "competency": "Continuous Improvement & Resilience",
            "difficulty": "Medium",
            "question_type": "behavioral",
            "expected_evidence": "Transparent post-mortem culture, root-cause depth, automated regression testing, and blameless retrospective leadership.",
            "suggested_follow_ups": [
                "How did you communicate the issue to leadership and impacted customers?"
            ],
            "time_allocation_minutes": 5,
        },
    ]

    selected_questions = all_questions_bank[:target_count]

    return {
        "interview_objectives": [
            f"Assess core competencies for {job_role} under {rigor_label} evaluation standards.",
            "Probe technical architecture, trade-offs, and failure recovery depth.",
            "Evaluate structured articulation, problem-solving, and communication clarity.",
        ],
        "questions": selected_questions,
        "total_estimated_minutes": sum(q["time_allocation_minutes"] for q in selected_questions),
        "competency_weights": {
            "System Architecture & Breadth": 0.30,
            "Distributed Systems & Consistency": 0.25,
            "Production Incident Triage & Resilience": 0.25,
            "Technical Leadership & Communication": 0.20,
        },
    }
