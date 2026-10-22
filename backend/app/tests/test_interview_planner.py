import pytest
from backend.app.services.interview_planner import (
    calculate_question_count,
    generate_interview_plan,
)


def test_question_count_adaptation():
    assert calculate_question_count(10) == 3
    assert calculate_question_count(20) == 5
    assert calculate_question_count(30) == 7
    assert calculate_question_count(45) == 10


@pytest.mark.asyncio
async def test_generate_interview_plan_standard_rigor():
    plan = await generate_interview_plan(
        job_role="Senior Backend Engineer",
        duration_minutes=20,
        evaluation_rigor="standard",
    )
    assert len(plan["questions"]) == 5
    assert len(plan["interview_objectives"]) > 0
    assert "competency_weights" in plan

    # Validate first question structure
    q1 = plan["questions"][0]
    assert q1["id"] == 1
    assert "Senior Backend Engineer" in q1["question_text"]
    assert len(q1["expected_evidence"]) > 0


@pytest.mark.asyncio
async def test_generate_interview_plan_stress_test_rigor():
    plan = await generate_interview_plan(
        job_role="Staff Systems Architect",
        duration_minutes=45,
        evaluation_rigor="stress_test",
    )
    assert len(plan["questions"]) == 10
    difficulties = [q["difficulty"] for q in plan["questions"]]
    assert "Staff" in difficulties


@pytest.mark.asyncio
async def test_generate_interview_plan_dynamic_skills_and_competencies():
    jd = {
        "job_title": "Senior AI Technical Program Manager",
        "seniority": "Senior",
        "required_skills": ["LLMs", "RAG & Vector DBs", "Prompt Engineering", "Telemetry & SLOs"],
        "responsibilities": [
            "Drive delivery milestones for generative AI copilots and ensure 99.9% uptime",
            "Coordinate cross-functional work across data science, safety, and infra teams",
        ],
        "competencies": ["Generative AI Governance", "Cross-functional Milestones"],
    }
    plan = await generate_interview_plan(
        job_role="Senior AI Technical Program Manager",
        duration_minutes=30,
        evaluation_rigor="target_bar",
        job_description=jd,
    )
    assert len(plan["questions"]) == 7
    all_q_text = " ".join([q["question_text"] + " " + q["competency"] for q in plan["questions"]])
    # The questions should dynamically reference the JD's specific skills & competencies
    assert "LLMs" in all_q_text or "RAG" in all_q_text or "Generative AI" in all_q_text
    assert "Senior AI Technical Program Manager" in plan["questions"][0]["question_text"]

