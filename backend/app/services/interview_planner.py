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
You are an elite Executive Interview Coach and Principal Bar Raiser adhering to the Interview Coach Standard:
1. Sequencing: Enforce one-question-at-a-time focus. Each question evaluates a distinct technical competency without compound questions.
2. Triage Before Template: Tailor questions dynamically to the role ({job_role}), candidate context, and job requirements.
3. Track-Aware Rigor:
   - For Engineering/Architecture: System boundaries, high-throughput data pipelines, failure modes, CAP trade-offs, and zero-downtime operations.
   - For Technical Product / TPM: Prioritization trade-offs, telemetry metrics, technical feasibility, and cross-functional incident leadership.
4. Expected Evidence: Define concrete STAR signals (Situation, Task, Action, Measurable Result) that distinguish strong hires.

Role: {job_role}
Duration: {duration_minutes} minutes
Evaluation Rigor: {evaluation_rigor}
Target Question Count: {target_count}

Candidate Profile Context:
{json.dumps(candidate_profile or {}, indent=2)[:3000]}

Job Description Requirements:
{json.dumps(job_description or {}, indent=2)[:3000]}

Requirements:
- Provide exactly {target_count} ordered questions.
- For each question provide:
  * id: 1-indexed sequence number
  * question_text: clear, focused question
  * competency: specific capability tested
  * difficulty: Easy, Medium, Hard, or Staff (aligned with {evaluation_rigor})
  * question_type: technical, architectural, behavioral, or trade_off
  * expected_evidence: explicit concrete technical & STAR signals demonstrating mastery
  * suggested_follow_ups: 2-3 adaptive probing questions
  * time_allocation_minutes: estimated time for this turn
- Set competency_weights as a list of items with competency and weight (summing to ~1.0).
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

    # Deterministic dynamic plan generation adapted to role, JD skills, responsibilities, and seniority
    rigor_label = evaluation_rigor.replace("_", " ").title()
    difficulty_map = {
        "standard": "Medium",
        "target_bar": "Hard",
        "stress_test": "Staff",
    }
    diff = difficulty_map.get(evaluation_rigor, "Hard")

    # Extract rich context from Job Description and Candidate Profile
    jd = job_description or {}
    jd_skills = jd.get("required_skills", []) + jd.get("preferred_skills", [])
    jd_responsibilities = jd.get("responsibilities", [])
    jd_competencies = jd.get("competencies", [])
    seniority = jd.get("seniority") or ("Staff" if any(w in job_role.lower() for w in ["staff", "principal", "lead", "director"]) else ("Junior" if "junior" in job_role.lower() else "Senior"))

    # Determine skills to feature in questions
    if not jd_skills:
        # Fallback to skills extracted from role name or common technical domains
        role_lower = job_role.lower()
        if "program manager" in role_lower or "tpm" in role_lower:
            jd_skills = ["Technical Program Management", "System Architecture", "Dependency Mapping", "Telemetry & SLOs", "Agile / Scrum"]
        elif "product manager" in role_lower or "pm" in role_lower:
            jd_skills = ["Product Strategy", "PRD Authoring", "Telemetry & Metrics", "A/B Testing", "System Design"]
        elif "ai" in role_lower or "machine learning" in role_lower or "ml" in role_lower:
            jd_skills = ["LLMs", "RAG & Vector DBs", "PyTorch", "Model Inference Latency", "Python"]
        elif "devops" in role_lower or "sre" in role_lower or "cloud" in role_lower:
            jd_skills = ["Kubernetes", "Docker", "Terraform", "CI/CD Automation", "AWS/Cloud"]
        elif "data" in role_lower:
            jd_skills = ["Apache Kafka", "Apache Spark", "SQL", "Snowflake", "Data Warehousing"]
        elif "security" in role_lower:
            jd_skills = ["IAM", "Application Security", "Threat Modeling", "OWASP", "Cloud Security"]
        else:
            jd_skills = ["System Architecture", "API Design", "Distributed Systems", "Cloud Infrastructure", "Performance Optimization"]

    s1 = jd_skills[0] if len(jd_skills) > 0 else "System Architecture"
    s2 = jd_skills[1] if len(jd_skills) > 1 else "Scalable Distributed Services"
    s3 = jd_skills[2] if len(jd_skills) > 2 else "Data Reliability & Consistency"
    s4 = jd_skills[3] if len(jd_skills) > 3 else "Cloud Infrastructure"

    resp1 = jd_responsibilities[0] if jd_responsibilities else f"lead core technical architecture and delivery for {job_role}"
    resp2 = jd_responsibilities[1] if len(jd_responsibilities) > 1 else "orchestrate cross-functional engineering execution and trade-offs"

    role_lower = job_role.lower()
    is_tpm_or_pm = any(k in role_lower for k in ["program manager", "product manager", "tpm", "pm"])
    is_ai_ml = any(k in role_lower for k in ["ai", "machine learning", "ml", "deep learning", "llm"])
    is_devops_sre = any(k in role_lower for k in ["devops", "sre", "site reliability", "infrastructure", "cloud platform"])
    is_data = any(k in role_lower for k in ["data engineer", "data platform", "etl", "big data", "data science"])

    generated_questions: List[Dict[str, Any]] = []

    # Question 1: System & Technical Breadth / Scoping
    if is_tpm_or_pm:
        q1_text = f"Can you walk me through how you architected and delivered a complex technical program involving {s1} and {s2} for a {job_role} scope? How did you define system boundaries and map critical path dependencies?"
        q1_comp = "Technical Architecture & Program Scoping"
        q1_ev = "Clearly articulates technical system boundaries, multi-team dependencies, critical path sequencing, and architectural trade-offs using STAR."
        q1_followups = ["What was the most critical technical dependency that had the highest risk of delaying the program?", "How did you establish measurable launch milestones with engineering leads?"]
    elif is_ai_ml:
        q1_text = f"Can you walk me through the end-to-end architecture of a production AI/ML system you designed or scaled using {s1} and {s2}? How did you optimize inference latency, context limits, and throughput?"
        q1_comp = "AI System Architecture & Model Serving"
        q1_ev = "Explains model serving topology, embedding/retrieval caching, batching trade-offs, and throughput SLAs under high load."
        q1_followups = ["How did you prevent GPU memory fragmentation during peak traffic?", "What was your strategy for measuring and preventing model hallucinations or drift?"]
    elif is_devops_sre:
        q1_text = f"Can you walk me through how you architected resilient cloud infrastructure and deployment pipelines utilizing {s1} and {s2} for a {job_role} scope?"
        q1_comp = "Infrastructure as Code & Cloud Automation"
        q1_ev = "Detailed explanation of multi-region topology, automated CI/CD rollback safety, and immutable infrastructure practices."
        q1_followups = ["How did you isolate blast radiuses across development and production clusters?", "What telemetry signals did you monitor during canary releases?"]
    elif is_data:
        q1_text = f"Can you walk me through the architecture of a high-throughput data platform you built using {s1} and {s2}? How did you ensure data consistency, partitioning efficiency, and schema evolution?"
        q1_comp = "Data Pipeline Architecture & Stream Processing"
        q1_ev = "Explains stream/batch ingestion boundaries, partition keys, compaction, and schema registry management."
        q1_followups = ["How did you handle late-arriving or out-of-order data events?", "What was your backfill strategy without impacting production consumer latency?"]
    else:
        q1_text = f"Can you walk me through the architecture of a high-impact system you designed or scaled relevant to the {job_role} position using {s1} and {s2}?"
        q1_comp = "System Architecture & Breadth"
        q1_ev = "Clearly states requirements, traffic volumes, component boundaries, and technology trade-offs."
        q1_followups = ["What was the single biggest bottleneck in that design?", "How did you monitor data consistency under peak load?"]

    generated_questions.append({
        "id": 1,
        "question_text": q1_text,
        "competency": q1_comp,
        "difficulty": "Medium",
        "question_type": "architectural",
        "expected_evidence": q1_ev,
        "suggested_follow_ups": q1_followups,
        "time_allocation_minutes": 5,
    })

    # Question 2: Production Incident / Risk Mitigation Scenario
    if is_tpm_or_pm:
        q2_text = f"Suppose a critical breaking change or severe performance bottleneck emerges in {s1} two weeks before a major launch milestone. Walk me through your playbook for technical triage, impact isolation, and alignment across engineering teams."
        q2_comp = "Technical Risk Mitigation & Incident Triage"
        q2_ev = "Methodical incident triage: dependency chain tracing, contingency/rollback branches, technical compromise evaluation, and transparent status communication."
        q2_followups = ["How did you handle the trade-off between delaying the milestone vs shipping with degraded functionality?", "How did you communicate the risk to executive stakeholders?"]
    elif is_ai_ml:
        q2_text = f"Suppose your production {s1} service begins experiencing intermittent 504 timeouts and elevated tail latency (p99 > 2s) under unexpected traffic surges. How do you systematically isolate and remediate the root cause?"
        q2_comp = "Inference Resilience & Production Triage"
        q2_ev = "Diagnostic triage using distributed traces, queue depths, model memory profiles, and token-streaming bottlenecks before executing mitigations."
        q2_followups = ["When would you shed load or degrade retrieval depth vs spinning up additional GPU worker nodes?", "How do you prevent cascading failures in upstream client applications?"]
    else:
        q2_text = f"Suppose a critical service running {s1} experiences sudden tail-latency degradation (p99) and intermittent timeouts under heavy load. How do you systematically triage, isolate, and remediate the root cause?"
        q2_comp = "Production Incident Triage & Resilience"
        q2_ev = "Methodical triage using distributed traces, metrics, connection pool starvation, and database slow-log inspection before remediation."
        q2_followups = ["How would you prevent cascading failures across downstream services?", "When would you trip a circuit breaker vs shedding load?"]

    generated_questions.append({
        "id": 2,
        "question_text": q2_text,
        "competency": q2_comp,
        "difficulty": diff,
        "question_type": "technical",
        "expected_evidence": q2_ev,
        "suggested_follow_ups": q2_followups,
        "time_allocation_minutes": 5,
    })

    # Question 3: Deep Technical Trade-offs on JD Tech Stack
    if is_tpm_or_pm:
        q3_text = f"When partnering with engineering architects on {resp1}, how do you evaluate technical trade-offs between deliverable velocity, system technical debt, and scalability constraints involving {s3}?"
        q3_comp = "Engineering Trade-offs & Architecture Governance"
        q3_ev = "Structured non-functional requirement framework, data-driven POC evaluation, cost-of-delay analysis, and objective consensus building."
        q3_followups = ["How do you push back on premature optimization that threatens delivery dates?", "What criteria do you use to approve technical debt paydown in program roadmaps?"]
    elif is_ai_ml:
        q3_text = f"When implementing {resp1}, how do you evaluate the architectural trade-offs between fine-tuning a specialized model vs utilizing RAG retrieval with vector databases ({s3}) regarding latency, accuracy, cost, and data freshness?"
        q3_comp = "Model Architecture & Retrieval Trade-offs"
        q3_ev = "Compares context window limits, embedding drift, token costs, latency frontiers, and training iteration cycles."
        q3_followups = ["How do you benchmark retrieval accuracy (MRR, NDCG) against human eval sets?", "When does fine-tuning become economically justified over RAG?"]
    else:
        q3_text = f"How do you evaluate consistency vs availability and performance trade-offs when designing distributed systems with {s1} and {s3} under network partition events?"
        q3_comp = "Distributed Systems & Consistency"
        q3_ev = "Grounds answer in CAP/PACELC theorem, compares linearizable consensus with eventual consistency, and addresses idempotent deduplication."
        q3_followups = ["How do you handle out-of-order event delivery?", "What is your dead-letter queue replay strategy?"]

    generated_questions.append({
        "id": 3,
        "question_text": q3_text,
        "competency": q3_comp,
        "difficulty": diff,
        "question_type": "trade_off",
        "expected_evidence": q3_ev,
        "suggested_follow_ups": q3_followups,
        "time_allocation_minutes": 6,
    })

    # Question 4: Behavioral & Cross-Functional Alignment (STAR)
    q4_text = f"Tell me about a time in your {seniority} {job_role} experience where an engineering lead, architect, or stakeholder strongly disagreed with your proposed technical approach or roadmap for {resp2}. How did you resolve the friction and reach alignment?"
    q4_comp = "Technical Leadership & Stakeholder Alignment"
    q4_ev = "Structured using STAR method; demonstrates objective data benchmarking, active listening, executive communication, and constructive alignment without ego."
    q4_followups = ["If the consensus could not be reached, what escalation framework did you use?", "What lasting safeguards or team processes came out of that disagreement?"]

    generated_questions.append({
        "id": 4,
        "question_text": q4_text,
        "competency": q4_comp,
        "difficulty": "Medium",
        "question_type": "behavioral",
        "expected_evidence": q4_ev,
        "suggested_follow_ups": q4_followups,
        "time_allocation_minutes": 4,
    })

    # Question 5: Zero-Downtime Operations, Telemetry & Quality Standards
    if is_tpm_or_pm:
        q5_text = f"How do you establish quantitative program telemetry, launch verification gates, and operational SLOs when rolling out new systems built on {s1} and {s4} across distributed engineering teams?"
        q5_comp = "Program Telemetry & Launch Governance"
        q5_ev = "Defines quantifiable success metrics, automated CI/CD canary verification, error budgets, and post-launch rollback criteria."
        q5_followups = ["What specific telemetry signals tell you that a launch is failing before customers complain?", "How do you align multiple engineering teams on shared SLO definitions?"]
    else:
        q5_text = f"How would you design a zero-downtime migration and automated rollback strategy for a high-throughput production service running {s1} that is actively processing live traffic?"
        q5_comp = "Zero-Downtime Operations & Reliability"
        q5_ev = "Explains dual-writing, backfill batching with rate-limiting, shadow reads, canary gating, and final switch-over without locking."
        q5_followups = ["How do you guarantee write consistency between old and new paths?", "What automated rollback safety checks are in place?"]

    generated_questions.append({
        "id": 5,
        "question_text": q5_text,
        "competency": q5_comp,
        "difficulty": diff,
        "question_type": "technical",
        "expected_evidence": q5_ev,
        "suggested_follow_ups": q5_followups,
        "time_allocation_minutes": 5,
    })

    # Question 6: Scaling & Distributed Coordination
    generated_questions.append({
        "id": 6,
        "question_text": f"In a multi-service architecture utilizing {s1} and {s2}, how do you manage distributed coordination, service-to-service authentication, and data integrity without introducing single points of failure?",
        "competency": "Scalable Systems & Distributed Coordination",
        "difficulty": diff,
        "question_type": "architectural",
        "expected_evidence": "Articulates async event-driven patterns, token verification, circuit breaking, and idempotent consumers.",
        "suggested_follow_ups": ["How do you manage cross-service transaction failures?", "How do you enforce tenant isolation at scale?"],
        "time_allocation_minutes": 5,
    })

    # Question 7: Security & Defensive Architecture
    generated_questions.append({
        "id": 7,
        "question_text": f"What defensive security engineering strategies do you enforce to protect API endpoints and data flows in {job_role} systems against unauthorized access, credential leakage, and injection attacks?",
        "competency": "API Security & Defensive Engineering",
        "difficulty": diff,
        "question_type": "technical",
        "expected_evidence": "Network boundary validation, cryptographic claims verification, least-privilege IAM policies, and automated vulnerability scanning.",
        "suggested_follow_ups": ["How do you safeguard internal service credentials in cloud environments?", "How is rate limiting enforced across distributed edges?"],
        "time_allocation_minutes": 4,
    })

    # Question 8: Disaster Recovery & Business Continuity
    generated_questions.append({
        "id": 8,
        "question_text": f"If your primary {s1} cluster or cloud availability zone suffered complete outage, describe your recovery protocol to restore {job_role} operations with minimal RPO and RTO.",
        "competency": "Disaster Recovery & Business Continuity",
        "difficulty": "Staff",
        "question_type": "architectural",
        "expected_evidence": "Differentiates RPO vs RTO, active-active vs active-passive replication topologies, automated health checks, and DNS failover.",
        "suggested_follow_ups": ["How do you test and verify disaster recovery before an incident happens?"],
        "time_allocation_minutes": 5,
    })

    # Question 9: Performance Optimization & Bottlenecks
    generated_questions.append({
        "id": 9,
        "question_text": f"How do you profile, identify, and eliminate subtle performance bottlenecks in {s1} and {s2} systems when scaling from prototype to production load?",
        "competency": "Performance Optimization & Benchmarking",
        "difficulty": "Medium",
        "question_type": "technical",
        "expected_evidence": "Flame graphs, CPU/memory profiling, query plan inspection, connection pooling, and caching layer design.",
        "suggested_follow_ups": ["What metrics indicate a memory leak vs expected garbage collection overhead?"],
        "time_allocation_minutes": 4,
    })

    # Question 10: Retrospective & Institutional Safeguards
    generated_questions.append({
        "id": 10,
        "question_text": f"Reflecting on your {seniority} {job_role} journey, tell me about the most challenging production bug, delivery misstep, or architecture oversight you encountered, and what institutional safeguards you built afterward.",
        "competency": "Continuous Improvement & Resilience",
        "difficulty": "Medium",
        "question_type": "behavioral",
        "expected_evidence": "Blameless post-mortem culture, root-cause depth, automated regression testing, and systemic process improvements.",
        "suggested_follow_ups": ["How did you communicate the issue to leadership and impacted customers?"],
        "time_allocation_minutes": 5,
    })

    selected_questions = generated_questions[:target_count]

    # Dynamically build competency weights matching the selected questions
    weight_per_question = round(1.0 / len(selected_questions), 2)
    competency_weights = {}
    for q in selected_questions:
        competency_weights[q["competency"]] = competency_weights.get(q["competency"], 0.0) + weight_per_question

    return {
        "interview_objectives": [
            f"Assess core competencies for {seniority} {job_role} under {rigor_label} evaluation standards.",
            f"Probe technical architecture, trade-offs, and failure recovery depth with {s1} and {s2}.",
            f"Evaluate structured articulation, problem-solving, and communication clarity derived from JD requirements.",
        ],
        "questions": selected_questions,
        "total_estimated_minutes": sum(q["time_allocation_minutes"] for q in selected_questions),
        "competency_weights": competency_weights,
    }
