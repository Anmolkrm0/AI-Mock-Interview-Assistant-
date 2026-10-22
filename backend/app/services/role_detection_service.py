import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.schemas.role import RoleDetectionResponse, DetectedRole
from backend.app.services.document_service import extract_seniority_from_text


async def detect_roles_from_job_description(jd_text: str, filename: str = "") -> Dict[str, Any]:
    """
    Detects plausible candidate roles with seniority levels and confidence scores.
    Leverages explicit regex patterns, header heuristics, JD text content, uploaded filename, and Gemini AI.
    """
    combined_context = f"{filename} {jd_text}".strip()
    text_lower = combined_context.lower()

    # 1. Seniority detection
    seniority = extract_seniority_from_text(jd_text, filename=filename)

    # 2. Check for explicit job title labels in text or filename
    explicit_title: Optional[str] = None
    title_match = re.search(
        r"(?:job\s*title|job\s*role|position(?:\s*title)?|role(?:\s*title)?|title|about\s+the\s+role|role\s+overview|position\s+summary|job\s+summary|target\s+role|target\s+position)\s*[:\-–]\s*([A-Za-z0-9\s\/\-_()&+]+)",
        jd_text,
        re.IGNORECASE,
    )
    if title_match:
        candidate_t = title_match.group(1).strip().split("\n")[0].strip()
        candidate_t = re.sub(r"[,;].*$", "", candidate_t).strip()
        candidate_t = re.sub(r"^(?:an?|the)\s+", "", candidate_t, flags=re.IGNORECASE).strip()
        if 3 <= len(candidate_t) <= 65 and not any(w in candidate_t.lower() for w in ["description", "overview", "summary", "about us", "location", "salary", "responsibilities", "qualifications"]):
            candidate_t = re.sub(r"\bTPM\b", "Technical Program Manager", candidate_t, flags=re.IGNORECASE)
            candidate_t = re.sub(r"\bPM\b", "Product Manager", candidate_t, flags=re.IGNORECASE)
            candidate_t = re.sub(r"\bSRE\b", "Site Reliability Engineer", candidate_t, flags=re.IGNORECASE)
            candidate_t = re.sub(r"\bEM\b", "Engineering Manager", candidate_t, flags=re.IGNORECASE)
            candidate_t = re.sub(r"\bSDET\b", "QA Automation Engineer (SDET)", candidate_t, flags=re.IGNORECASE)
            explicit_title = candidate_t.strip()

    # 3. Document header lines heuristic (often lines 1-4 contain the title directly)
    if not explicit_title:
        lines = [l.strip() for l in jd_text.splitlines() if l.strip()]
        for line in lines[:4]:
            clean_l = re.sub(r"^(?:an?|the)\s+", "", line, flags=re.IGNORECASE).strip()
            clean_l = re.sub(r"\s*[\(\[].*?[\)\]]", "", clean_l).strip()  # remove (Remote), [Full-Time]
            if 3 <= len(clean_l) <= 65 and any(rw in clean_l.lower() for rw in [
                "engineer", "developer", "architect", "manager", "program manager", "product manager",
                "lead", "specialist", "scientist", "analyst", "director", "sre", "devops", "tpm", "sdet", "consultant"
            ]) and not any(bad in clean_l.lower() for bad in ["http", "@", "about us", "who we are", "equal opportunity", "benefits", "requirements", "responsibilities"]):
                clean_l = re.sub(r"\bTPM\b", "Technical Program Manager", clean_l, flags=re.IGNORECASE)
                clean_l = re.sub(r"\bPM\b", "Product Manager", clean_l, flags=re.IGNORECASE)
                clean_l = re.sub(r"\bSRE\b", "Site Reliability Engineer", clean_l, flags=re.IGNORECASE)
                explicit_title = clean_l.strip()
                break

    # 4. Hiring sentence match
    if not explicit_title:
        hiring_match = re.search(
            r"(?:we(?:'re|\s+are)\s+(?:hiring|looking\s+for|seeking)|seeking\s+an?|hiring\s+an?)\s+([A-Za-z0-9\s\/\-_()&+]+?)(?:\s+to|\s+who|\s+for|\.|\n|,|;)",
            jd_text,
            re.IGNORECASE,
        )
        if hiring_match:
            candidate_t = hiring_match.group(1).strip()
            candidate_t = re.sub(r"^(?:an?|the)\s+", "", candidate_t, flags=re.IGNORECASE).strip()
            if 3 <= len(candidate_t) <= 65 and any(w in candidate_t.lower() for w in ["engineer", "developer", "manager", "architect", "lead", "specialist", "scientist", "analyst", "director", "pm", "tpm", "sre", "devops"]):
                candidate_t = re.sub(r"\bTPM\b", "Technical Program Manager", candidate_t, flags=re.IGNORECASE)
                candidate_t = re.sub(r"\bPM\b", "Product Manager", candidate_t, flags=re.IGNORECASE)
                candidate_t = re.sub(r"\bSRE\b", "Site Reliability Engineer", candidate_t, flags=re.IGNORECASE)
                explicit_title = candidate_t.strip()

    # 5. Clean filename fallback
    if not explicit_title and filename:
        clean_fname = re.sub(r"\.(pdf|docx|txt)$", "", filename, flags=re.IGNORECASE)
        clean_fname = re.sub(r"[_\-]+", " ", clean_fname)
        clean_fname = re.sub(r"(?i)\b(jd|job\s*description|resume|cv|posting|specification)\b", "", clean_fname).strip()
        clean_fname = re.sub(r"^(?:an?|the)\s+", "", clean_fname, flags=re.IGNORECASE).strip()
        if 3 <= len(clean_fname) <= 65 and any(w in clean_fname.lower() for w in ["engineer", "developer", "manager", "architect", "lead", "specialist", "scientist", "analyst", "director", "pm", "tpm", "sre", "devops"]):
            clean_fname = re.sub(r"\bTPM\b", "Technical Program Manager", clean_fname, flags=re.IGNORECASE)
            clean_fname = re.sub(r"\bPM\b", "Product Manager", clean_fname, flags=re.IGNORECASE)
            clean_fname = re.sub(r"\bSRE\b", "Site Reliability Engineer", clean_fname, flags=re.IGNORECASE)
            explicit_title = clean_fname.strip()

    # If title starts with seniority prefix, extract seniority
    base_role = explicit_title or ""
    if explicit_title:
        for sen_kw in ["Director", "Principal", "Staff", "Lead", "Senior", "Mid-Level", "Junior", "Intern"]:
            pattern = rf"^(?:{sen_kw}|Sr\.?|Jr\.?)\s+"
            if re.search(pattern, base_role, flags=re.IGNORECASE):
                base_role = re.sub(pattern, "", base_role, flags=re.IGNORECASE).strip()
                seniority = sen_kw
                break

    # 6. Gemini-based role detection if API key configured
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
                parsed = json.loads(response.text.strip())
                if parsed.get("detected_roles"):
                    if explicit_title and not any(explicit_title.lower() in r.get("title", "").lower() for r in parsed["detected_roles"]):
                        parsed["detected_roles"].insert(0, {
                            "title": explicit_title,
                            "seniority": seniority,
                            "confidence": 0.98,
                            "reasoning": f"Explicit job title extracted from document specification: '{explicit_title}'",
                        })
                        parsed["primary_role"] = explicit_title
                    if not parsed.get("primary_seniority"):
                        parsed["primary_seniority"] = seniority
                    return parsed
        except Exception as err:
            print(f"Gemini role detection failed: {err}")

    # 7. Fallback heuristic role detection
    roles: List[Dict[str, Any]] = []

    # If explicit title found, prioritize it at the top
    if explicit_title:
        roles.append({
            "title": explicit_title,
            "seniority": seniority,
            "confidence": 0.98,
            "reasoning": f"Explicit role title extracted directly from job description: '{explicit_title}'.",
        })

    # Domain keyword matching
    search_context = f"{explicit_title or ''} {text_lower}".lower()

    if any(k in search_context for k in ["program manager", "tpm", "technical program manager"]):
        if any(ai_k in search_context for ai_k in ["ai", "machine learning", "ml", "llm"]):
            roles.extend([
                {
                    "title": f"{seniority} AI Technical Program Manager",
                    "seniority": seniority,
                    "confidence": 0.96,
                    "reasoning": "Job specification emphasizes AI engineering roadmapping, cross-functional dependencies, and model deployment.",
                },
                {
                    "title": f"{seniority} Technical Program Manager",
                    "seniority": seniority,
                    "confidence": 0.90,
                    "reasoning": "Matches core technical program management, dependency mapping, and milestone delivery.",
                },
                {
                    "title": "AI Platform Program Lead",
                    "seniority": "Lead",
                    "confidence": 0.85,
                    "reasoning": "Large-scale platform delivery across AI infrastructure and distributed systems.",
                },
            ])
        else:
            roles.extend([
                {
                    "title": f"{seniority} Technical Program Manager",
                    "seniority": seniority,
                    "confidence": 0.95,
                    "reasoning": "Technical program leadership, milestone tracking, and cross-functional engineering alignment.",
                },
                {
                    "title": "Engineering Program Manager",
                    "seniority": seniority,
                    "confidence": 0.88,
                    "reasoning": "Sprint orchestration and multi-team dependency management.",
                },
            ])
    elif any(k in search_context for k in ["ai technical pm", "technical pm", "ai tpm", "technical product manager", "product manager", "product owner", "product management"]):
        if any(ai_k in search_context for ai_k in ["ai", "machine learning", "ml", "llm", "generative"]):
            detected_title = explicit_title or f"{seniority} AI Technical Product Manager"
            roles.extend([
                {
                    "title": f"{seniority} AI Technical Product Manager",
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
            ])
        else:
            detected_title = explicit_title or f"{seniority} Technical Product Manager"
            roles.extend([
                {
                    "title": f"{seniority} Technical Product Manager",
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
            ])
    elif any(k in search_context for k in ["devops", "sre", "site reliability", "platform engineer", "infrastructure engineer", "cloud engineer"]):
        detected_title = explicit_title or f"{seniority} DevOps / Site Reliability Engineer"
        roles.extend([
            {
                "title": f"{seniority} DevOps / Site Reliability Engineer",
                "seniority": seniority,
                "confidence": 0.95,
                "reasoning": "Emphasizes infrastructure as code, CI/CD pipelines, Kubernetes, and production site reliability.",
            },
            {
                "title": f"{seniority} Cloud Platform Engineer",
                "seniority": seniority,
                "confidence": 0.89,
                "reasoning": "Scalable cloud architecture, infrastructure automation, and Terraform provisioning.",
            },
            {
                "title": f"{seniority} Systems Administrator / SRE",
                "seniority": seniority,
                "confidence": 0.81,
                "reasoning": "Linux operations, observability, incident management, and SLO governance.",
            },
        ])
    elif any(k in search_context for k in ["data engineer", "data platform", "etl engineer", "big data", "data pipeline"]):
        detected_title = explicit_title or f"{seniority} Data Engineer"
        roles.extend([
            {
                "title": f"{seniority} Data Engineer",
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Data pipelines, warehousing, ETL, Spark, Kafka, and stream processing.",
            },
            {
                "title": f"{seniority} Analytics Engineer",
                "seniority": seniority,
                "confidence": 0.86,
                "reasoning": "Data modeling in dbt, SQL transformation, and business intelligence pipelines.",
            },
            {
                "title": f"{seniority} Big Data Architect",
                "seniority": seniority,
                "confidence": 0.80,
                "reasoning": "High-throughput data storage, distributed querying, and data lake architecture.",
            },
        ])
    elif any(k in search_context for k in ["machine learning", "ai engineer", "deep learning", "llm engineer", "nlp engineer", "computer vision"]):
        detected_title = explicit_title or f"{seniority} AI / Machine Learning Engineer"
        roles.extend([
            {
                "title": f"{seniority} AI / Machine Learning Engineer",
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
        ])
    elif any(k in search_context for k in ["distributed systems", "systems engineer", "distributed"]):
        detected_title = explicit_title or f"{seniority} Distributed Systems Engineer"
        roles.extend([
            {
                "title": f"{seniority} Distributed Systems Engineer",
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
        ])
    elif any(k in search_context for k in ["ios", "swift", "apple developer"]):
        detected_title = explicit_title or f"{seniority} iOS Engineer"
        roles.extend([
            {
                "title": f"{seniority} iOS Engineer",
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Native iOS mobile application development with Swift and SwiftUI.",
            },
            {
                "title": f"{seniority} Mobile Engineer",
                "seniority": seniority,
                "confidence": 0.86,
                "reasoning": "Cross-platform and native mobile software architecture.",
            },
        ])
    elif any(k in search_context for k in ["android", "kotlin"]):
        detected_title = explicit_title or f"{seniority} Android Engineer"
        roles.extend([
            {
                "title": f"{seniority} Android Engineer",
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Native Android development with Kotlin and Jetpack Compose.",
            },
            {
                "title": f"{seniority} Mobile Engineer",
                "seniority": seniority,
                "confidence": 0.86,
                "reasoning": "Mobile client architecture and offline data synchronization.",
            },
        ])
    elif any(k in search_context for k in ["security engineer", "cybersecurity", "infosec", "appsec"]):
        detected_title = explicit_title or f"{seniority} Security Engineer"
        roles.extend([
            {
                "title": f"{seniority} Security Engineer",
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Application security, penetration testing, threat modeling, and IAM.",
            },
            {
                "title": f"{seniority} Cloud Security Architect",
                "seniority": seniority,
                "confidence": 0.85,
                "reasoning": "Zero-trust architecture, cloud compliance, and security policy automation.",
            },
        ])
    elif any(k in search_context for k in ["qa", "sdet", "test automation", "quality assurance"]):
        detected_title = explicit_title or f"{seniority} QA Automation Engineer (SDET)"
        roles.extend([
            {
                "title": f"{seniority} QA Automation Engineer (SDET)",
                "seniority": seniority,
                "confidence": 0.94,
                "reasoning": "Test automation frameworks, E2E test suites, and CI/CD quality gate enforcement.",
            },
            {
                "title": f"{seniority} Software Engineer in Test",
                "seniority": seniority,
                "confidence": 0.88,
                "reasoning": "Automated regression testing, performance benchmarking, and test architecture.",
            },
        ])
    elif any(k in search_context for k in ["data scientist", "data science"]):
        detected_title = explicit_title or f"{seniority} Data Scientist"
        roles.extend([
            {
                "title": f"{seniority} Data Scientist",
                "seniority": seniority,
                "confidence": 0.93,
                "reasoning": "Statistical modeling, exploratory analysis, hypothesis testing, and business impact.",
            },
            {
                "title": f"{seniority} Machine Learning Engineer",
                "seniority": seniority,
                "confidence": 0.85,
                "reasoning": "Translating statistical prototypes into production predictive models.",
            },
        ])
    elif any(k in search_context for k in ["backend", "api engineer", "server", "microservices"]):
        detected_title = explicit_title or f"{seniority} Backend Engineer"
        roles.extend([
            {
                "title": f"{seniority} Backend Engineer",
                "seniority": seniority,
                "confidence": 0.92,
                "reasoning": "API development, relational data models, and backend business logic.",
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
        ])
    elif any(k in search_context for k in ["frontend", "react", "ui engineer", "web developer"]):
        detected_title = explicit_title or f"{seniority} Frontend Engineer"
        roles.extend([
            {
                "title": f"{seniority} Frontend Engineer",
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
        ])
    else:
        detected_title = explicit_title or f"{seniority} Full-Stack Software Engineer"
        roles.extend([
            {
                "title": detected_title,
                "seniority": seniority,
                "confidence": 0.85,
                "reasoning": f"End-to-end software delivery and architecture for {detected_title}.",
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
        ])

    # Deduplicate roles by title
    seen_titles = set()
    deduped_roles = []
    for r in roles:
        t_key = r["title"].strip().lower()
        if t_key not in seen_titles:
            seen_titles.add(t_key)
            deduped_roles.append(r)

    primary_role = deduped_roles[0]["title"] if deduped_roles else (explicit_title or f"{seniority} Software Engineer")

    return {
        "detected_roles": deduped_roles,
        "primary_role": primary_role,
        "primary_seniority": seniority,
    }

