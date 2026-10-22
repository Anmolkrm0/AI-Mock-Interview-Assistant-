import io
import fitz  # PyMuPDF
from docx import Document as DocxDocument
import pytest
from fastapi import HTTPException

from backend.app.services.document_service import (
    validate_document_file,
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_with_ai,
    parse_job_description_with_ai,
)


def create_sample_pdf_bytes(text: str = "Alex Chen\nSenior Backend Engineer\nSkills: Python, FastAPI, Kubernetes") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_sample_docx_bytes(text: str = "Jane Doe\nPrincipal Architect\nSkills: Distributed Systems, Kafka") -> bytes:
    doc = DocxDocument()
    doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_validate_document_empty():
    with pytest.raises(HTTPException) as exc:
        validate_document_file(b"", "resume.pdf")
    assert exc.value.status_code == 400


def test_validate_document_oversized():
    # 11MB file exceeds 10MB limit
    oversized = b"%PDF" + b"0" * (11 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc:
        validate_document_file(oversized, "huge.pdf")
    assert exc.value.status_code == 413


def test_validate_document_invalid_magic_bytes():
    with pytest.raises(HTTPException) as exc:
        validate_document_file(b"This is just raw text", "test.txt")
    assert exc.value.status_code == 415


def test_extract_text_from_valid_pdf():
    pdf_bytes = create_sample_pdf_bytes("Sarah Jenkins\nStaff Cloud Engineer\n5 YOE AWS, Terraform")
    text = extract_text_from_pdf(pdf_bytes)
    assert "Sarah Jenkins" in text
    assert "Staff Cloud Engineer" in text


def test_extract_text_from_valid_docx():
    docx_bytes = create_sample_docx_bytes("Michael Scott\nRegional Director\nSkills: Leadership, Sales")
    text = extract_text_from_docx(docx_bytes)
    assert "Michael Scott" in text
    assert "Leadership" in text


@pytest.mark.asyncio
async def test_parse_resume_structured():
    raw_text = "Alex Rivera\nSenior Distributed Systems Engineer\nSkills: Python, Go, Docker, Kafka, PostgreSQL\nLed database migration with zero downtime."
    profile = await parse_resume_with_ai(raw_text)
    assert "skills" in profile
    assert len(profile["skills"]) > 0
    assert "Python" in profile["skills"]
    assert "Go" in profile["skills"]


@pytest.mark.asyncio
async def test_parse_job_description_structured():
    raw_jd = "We are seeking a Lead Backend Engineer to design high-throughput distributed streaming architectures using Kafka and PostgreSQL. Must have 7+ YOE."
    jd_parsed = await parse_job_description_with_ai(raw_jd)
    assert "required_skills" in jd_parsed
    assert "competencies" in jd_parsed
    assert len(jd_parsed["competencies"]) > 0


@pytest.mark.asyncio
async def test_extract_skills_comprehensive_taxonomy():
    resume_text = """
    Candidate Name
    AI Technical Product Manager
    TECHNICAL SKILLS & COMPETENCIES
    • Languages & Frameworks: Python, TypeScript, React, Next.js, FastAPI, Node.js, PyTorch
    • AI & Data: LLMs, LangChain, RAG, OpenAI API, Vector Databases (Pinecone, ChromaDB), Pandas, NumPy, Scikit-learn
    • Cloud & Infrastructure: AWS (S3, Lambda, ECS), Docker, Kubernetes, CI/CD, GitHub Actions, Terraform
    • Databases & Messaging: PostgreSQL, Redis, MongoDB, Apache Kafka
    • Product Management: Product Roadmapping, PRDs, User Stories, A/B Testing, Feature Prioritization, Agile, Scrum, JIRA, Figma, OKRs
    """
    profile = await parse_resume_with_ai(resume_text)
    extracted = profile["skills"]

    # Verify all domains are extracted
    assert "Python" in extracted
    assert "React" in extracted
    assert "FastAPI" in extracted
    assert "PyTorch" in extracted
    assert "LangChain" in extracted
    assert "RAG" in extracted
    assert "Pinecone" in extracted
    assert "AWS" in extracted
    assert "Docker" in extracted
    assert "Kubernetes" in extracted
    assert "CI/CD" in extracted
    assert "PostgreSQL" in extracted
    assert "Apache Kafka" in extracted
    assert "Product Roadmapping" in extracted
    assert "PRDs" in extracted
    assert "A/B Testing" in extracted
    assert "JIRA" in extracted
    assert "Figma" in extracted
    assert len(extracted) >= 20


@pytest.mark.asyncio
async def test_parse_job_description_ai_technical_pm():
    jd_text = """
    We are seeking a Senior AI Technical Product Manager to drive generative AI roadmaps,
    author comprehensive PRDs, and partner with ML engineers and backend systems teams.
    """
    parsed = await parse_job_description_with_ai(jd_text, filename="JD_AI Technical PM.pdf")
    assert "AI Technical Product Manager" in parsed["job_title"]
    assert any("Roadmap" in comp or "Vision" in comp or "PRD" in comp for comp in parsed["competencies"])
    assert "Product Roadmapping" in parsed["required_skills"] or "PRDs" in parsed["required_skills"]


@pytest.mark.asyncio
async def test_role_detection_service_ai_pm():
    from backend.app.services.role_detection_service import detect_roles_from_job_description
    res = await detect_roles_from_job_description(
        "Drive product roadmaps for enterprise LLM systems. Collaborate on technical architecture.",
        filename="JD_AI Technical PM.pdf",
    )
    assert "detected_roles" in res
    assert len(res["detected_roles"]) >= 1
    assert "AI Technical Product Manager" in res["primary_role"]
    assert res["detected_roles"][0]["confidence"] >= 0.85

