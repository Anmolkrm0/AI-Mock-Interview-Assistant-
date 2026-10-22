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
