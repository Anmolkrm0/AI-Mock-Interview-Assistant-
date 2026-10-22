import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.schemas.role import RoleDetectionResponse, DetectedRole


async def detect_roles_from_job_description(jd_text: str, filename: str = "") -> Dict[str, Any]:

    """
    Detects plausible candidate roles with seniority levels and confidence scores.
    Leverages both JD text content and uploaded filename for maximum precision.
    """
    combined_context = f"{filename} {jd_text}".strip()

    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
Analyze this job description and uploaded document filename to identify the top plausible target job roles with seniority.
Determine which role is the primary exact match.

Document Filename: {filename}
Job Description:
{jd_text[:6000]}
"""
            response = await client.aio.models.generate_content(
                model=settings.GEMINI_TEXT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RoleDetectionResponse,
                ),
            )
            if response.text:
                return json.loads(response.text.strip())
        except Exception as err:
            print(f"Gemini role detection failed: {err}")

    # Fallback heuristic role detection
    text_lower = combined_context.lower()
    seniority = "Senior"
    if any(w in text_lower for w in ["lead", "principal", "staff", "director", "head of", "vp"]):
        seniority = "Staff"
    elif any(w in text_lower for w in ["junior", "associate", "entry", "intern"]):
        seniority = "Junior"

    # Match role
    if any(k in text_lower for k in ["ai technical pm", "technical pm", "ai tpm", "technical product manager", "product manager", "product owner", "product management", "tpm"]):
        if any(ai_k in text_lower for ai_k in ["ai", "machine learning", "ml", "llm", "generative"]):
            detected_title = f"{seniority} AI Technical Product Manager"
            roles = [
                {
                    "title": detected_title,
                    "seniority": seniority,
                    "confidence": 0.95,
                    "reasoning": "Job specification emphasizes AI product roadmapping, technical architecture, and cross-functional engineering leadership.",
                },
                {
                    "title": f"{seniority} Technical Product Manager",
                    "seniority": seniority,
                    "confidence": 0.89,
                    "reasoning": "Matches core technical product management competencies and agile delivery.",
                },
                {
                    "title": "AI / Machine Learning Product Lead",
                    "seniority": "Lead",
                    "confidence": 0.83,
                    "reasoning": "Focus on AI/LLM platform strategy, model integration, and engineering alignment.",
                },
            ]
        else:
            detected_title = f"{seniority} Technical Product Manager"
            roles = [
                {
                    "title": detected_title,
                    "seniority": seniority,
                    "confidence": 0.94,
                    "reasoning": "Matches technical product leadership, PRD specification, and cross-functional delivery.",
                },
                {
                    "title": f"{seniority} Product Manager",
                    "seniority": seniority,
                    "confidence": 0.88,
                    "reasoning": "Strong product roadmapping and customer discovery focus.",
                },
                {
                    "title": "Product Owner",
                    "seniority": "Mid-Senior",
                    "confidence": 0.78,
                    "reasoning": "Backlog prioritization and sprint execution.",
                },
            ]
    elif any(k in text_lower for k in ["machine learning", "ai engineer", "deep learning", "llm engineer", "nlp engineer"]):
        detected_title = f"{seniority} AI / Machine Learning Engineer"
        roles = [
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Deep focus on machine learning algorithms, model training, and AI system design.",
            },
            {
                "title": f"{seniority} MLOps / Platform Engineer",
                "seniority": seniority,
                "confidence": 0.87,
                "reasoning": "Infrastructure for model serving, inference pipelines, and distributed training.",
            },
            {
                "title": f"{seniority} Data Scientist",
                "seniority": seniority,
                "confidence": 0.80,
                "reasoning": "Statistical analysis, model evaluation, and machine learning research.",
            },
        ]
    elif any(k in text_lower for k in ["distributed systems", "systems engineer", "distributed"]):
        detected_title = f"{seniority} Distributed Systems Engineer"
        roles = [
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.93,
                "reasoning": "High-throughput distributed systems, consensus protocols, and fault-tolerant architecture.",
            },
            {
                "title": f"{seniority} Backend Systems Engineer",
                "seniority": seniority,
                "confidence": 0.88,
                "reasoning": "Core backend services and high-scale data infrastructure.",
            },
            {
                "title": f"{seniority} Platform Engineer",
                "seniority": seniority,
                "confidence": 0.82,
                "reasoning": "Underlying cloud infrastructure and service mesh reliability.",
            },
        ]
    elif any(k in text_lower for k in ["backend", "api engineer", "server"]):
        detected_title = f"{seniority} Backend Engineer"
        roles = [
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.92,
                "reasoning": "API development, data models, and backend business logic.",
            },
            {
                "title": "Full-Stack Software Engineer",
                "seniority": "Senior",
                "confidence": 0.81,
                "reasoning": "Broader software engineering stack across frontend and backend.",
            },
            {
                "title": f"{seniority} Platform Engineer",
                "seniority": seniority,
                "confidence": 0.77,
                "reasoning": "Infrastructure, CI/CD, and service reliability.",
            },
        ]
    elif any(k in text_lower for k in ["frontend", "react", "ui engineer", "web developer"]):
        detected_title = f"{seniority} Frontend Engineer"
        roles = [
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.93,
                "reasoning": "Modern client-side web development and user experience architecture.",
            },
            {
                "title": "Full-Stack Software Engineer",
                "seniority": "Senior",
                "confidence": 0.82,
                "reasoning": "Client-facing features backed by API integration.",
            },
            {
                "title": f"{seniority} UI/UX Engineer",
                "seniority": seniority,
                "confidence": 0.76,
                "reasoning": "Design systems and interface performance.",
            },
        ]
    elif any(k in text_lower for k in ["data engineer", "pipeline", "etl", "data warehouse"]):
        detected_title = f"{seniority} Data Engineer"
        roles = [
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.92,
                "reasoning": "Data pipelines, warehousing, ETL, and stream processing.",
            },
            {
                "title": f"{seniority} Analytics Engineer",
                "seniority": seniority,
                "confidence": 0.83,
                "reasoning": "Data modeling and business intelligence pipelines.",
            },
            {
                "title": f"{seniority} Backend Engineer",
                "seniority": seniority,
                "confidence": 0.78,
                "reasoning": "Database design and scalable data access layers.",
            },
        ]
    else:
        detected_title = "Full-Stack Software Engineer"
        roles = [
            {
                "title": "Full-Stack Software Engineer",
                "seniority": "Mid-Senior",
                "confidence": 0.85,
                "reasoning": "General end-to-end software delivery and client-server development.",
            },
            {
                "title": f"{seniority} Backend Engineer",
                "seniority": seniority,
                "confidence": 0.80,
                "reasoning": "Core service and API architecture.",
            },
            {
                "title": f"{seniority} Platform Engineer",
                "seniority": seniority,
                "confidence": 0.75,
                "reasoning": "Reliability and scalability.",
            },
        ]

    return {
        "detected_roles": roles,
        "primary_role": detected_title,
    }

