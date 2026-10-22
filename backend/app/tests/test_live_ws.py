import uuid
import asyncio
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import Profile, Interview, Question, InterviewPlan
from backend.app.api.v1.auth import create_token

def test_live_websocket_full_flow():
    client = TestClient(app)
    db = SessionLocal()

    user_id = uuid.uuid4()
    profile = Profile(id=user_id, display_name="Live WS Candidate")
    db.add(profile)

    interview = Interview(
        user_id=user_id,
        job_role="Senior Platform Engineer",
        duration_minutes=20,
        evaluation_rigor="target_bar",
        status="ready",
    )
    db.add(interview)
    db.flush()

    q1 = Question(
        interview_id=interview.id,
        sequence_number=1,
        question_text="How do you architect a multi-region Kubernetes control plane?",
        competency="System Design & Platform",
        difficulty="Hard",
        status="pending",
    )
    q2 = Question(
        interview_id=interview.id,
        sequence_number=2,
        question_text="Describe how you isolate noisy neighbors in shared multi-tenant clusters.",
        competency="Resource Governance",
        difficulty="Hard",
        status="pending",
    )
    db.add(q1)
    db.add(q2)
    db.commit()

    token = create_token(user_id, "candidate@live.test")

    # Connect WebSocket
    with client.websocket_connect(f"/api/v1/interviews/{interview.id}/live-ws?token={token}") as ws:
        # Step 1: Expect session_init
        init_data = ws.receive_json()
        print("Received init payload:", init_data)
        assert init_data["type"] == "session_init"
        assert init_data["status"] == "in_progress"
        assert init_data["current_question"]["id"] == str(q1.id)
        assert init_data["current_question"]["sequence"] == 1
        assert "multi-region Kubernetes" in init_data["current_question"]["text"]
        assert "Executive Interview Coach" in init_data["welcome_message"]

        # Step 2: Submit candidate answer
        ws.send_json({
            "type": "text_answer",
            "text": "We deploy federated clusters across three regions with global ingress routing, synchronized etcd snapshots, and local statefulsets for fault domain isolation."
        })

        # Step 3: Expect question_update
        update_data = ws.receive_json()
        print("Received update payload:", update_data)
        assert update_data["type"] == "question_update"
        assert update_data["current_question_index"] == 1
        assert update_data["current_question"]["id"] == str(q2.id)
        assert "noisy neighbors" in update_data["current_question"]["text"]
        assert "Strong breakdown on" in update_data["ai_speech_text"]

        # Step 4: Finish interview
        ws.send_json({"type": "end_interview"})
        final_data = ws.receive_json()
        print("Received final payload:", final_data)
        assert final_data["type"] == "interview_finalized"

    # Verify interview status in DB
    db.refresh(interview)
    print("Interview status after finalization:", interview.status)
    assert interview.status in ("finalizing", "evaluating", "completed")
    db.close()
    print("ALL LIVE WEBSOCKET CHECKS PASSED!")

if __name__ == "__main__":
    test_live_websocket_full_flow()
