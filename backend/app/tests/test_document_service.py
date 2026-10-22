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
    assert "Python" in profile["skills"] or "Distributed Systems" in profile["skills"]


@pytest.mark.asyncio
async def test_parse_job_description_structured():
    raw_jd = "We are seeking a Lead Backend Engineer to design high-throughput distributed streaming architectures using Kafka and PostgreSQL. Must have 7+ YOE."
    jd_parsed = await parse_job_description_with_ai(raw_jd)
    assert "required_skills" in jd_parsed
    assert "competencies" in jd_parsed
    assert len(jd_parsed["competencies"]) > 0
