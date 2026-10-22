import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function uploadResumeApi(file: File) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/documents/resume`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload and parse resume.");
  }
  return res.json();
}

export async function uploadJobDescriptionApi(params: { file?: File; textContent?: string }) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const formData = new FormData();
  if (params.file) {
    formData.append("file", params.file);
  }
  if (params.textContent) {
    formData.append("text_content", params.textContent);
  }

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/documents/job-description`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to process job description.");
  }
  return res.json();
}

export async function detectRolesApi(jobDescriptionText: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/roles/detect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ job_description_text: jobDescriptionText }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to detect roles.");
  }
  return res.json();
}

export async function createInterviewApi(params: {
  resume_document_id?: string;
  job_description_document_id?: string;
  job_role: string;
  duration_minutes: number;
  evaluation_rigor: string;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create interview session.");
  }
  return res.json();
}

export async function getInterviewApi(interviewId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch interview details.");
  }
  return res.json();
}

export async function getInterviewStatusApi(interviewId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/status`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch interview status.");
  }
  return res.json();
}

export async function triggerEvaluationApi(interviewId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/evaluate`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to evaluate interview.");
  }
  return res.json();
}

export async function getInterviewReportApi(interviewId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch interview report.");
  }
  return res.json();
}

export async function submitFeedbackApi(interviewId: string, rating: number, comments?: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rating, comments: comments || null }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit feedback.");
  }
  return res.json();
}

export async function listInterviewsApi(skip: number = 0, limit: number = 20) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews?skip=${skip}&limit=${limit}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to list interviews.");
  }
  return res.json();
}

export async function getRecordingUrlApi(interviewId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/recording-url`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Recording unavailable or archived.");
  }
  return res.json();
}

export async function getLatestRecordingApi() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/recordings/latest`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch latest recording.");
  }
  return res.json();
}

export async function deleteLatestRecordingApi() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/recordings/latest`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete latest recording.");
  }
  return res.json();
}

