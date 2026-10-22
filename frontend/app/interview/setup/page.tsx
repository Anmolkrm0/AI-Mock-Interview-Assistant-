"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  Flame, 
  Zap, 
  ArrowRight, 
  Loader2, 
  X, 
  Sparkles,
  Camera,
  Mic,
  ShieldCheck
} from "lucide-react";
import { uploadResumeApi, uploadJobDescriptionApi, detectRolesApi, createInterviewApi } from "@/services/api";

export default function InterviewSetupPage() {
  const router = useRouter();

  // Step A: Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDocId, setResumeDocId] = useState<string | null>(null);
  const [parsedCandidate, setParsedCandidate] = useState<any>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Step B: Job Description state
  const [jdTab, setJdTab] = useState<"paste" | "upload">("upload");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdDocId, setJdDocId] = useState<string | null>(null);
  const [parsedJd, setParsedJd] = useState<any>(null);
  const [jdUploading, setJdUploading] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);

  // Step D: Role Selection state
  const [detectedRoles, setDetectedRoles] = useState<string[]>([
    "Senior AI Technical Product Manager",
    "Staff Technical Product Manager",
    "Senior Distributed Systems Engineer",
    "Full-Stack Software Engineer",
  ]);
  const [selectedRole, setSelectedRole] = useState("Senior AI Technical Product Manager");
  const [isDetectingRoles, setIsDetectingRoles] = useState(false);

  // Step E & F: Duration & Rigor
  const [duration, setDuration] = useState<number>(30);
  const [rigor, setRigor] = useState<"standard" | "target_bar" | "stress_test">("target_bar");

  // Step G: Start / Consent state
  const [consentGiven, setConsentGiven] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Core JD processing routine
  const processJobDescription = async (fileToUpload?: File | null, textToUpload?: string) => {
    setJdError(null);
    setJdUploading(true);
    setIsDetectingRoles(true);

    try {
      const activeFile = fileToUpload !== undefined ? fileToUpload : (jdTab === "upload" ? jdFile : null);
      const activeText = textToUpload !== undefined ? textToUpload : (jdTab === "paste" ? jdText : "");

      const jdResult = await uploadJobDescriptionApi({
        file: activeFile || undefined,
        textContent: activeFile ? undefined : (activeText.trim() || undefined),
      });

      setJdDocId(jdResult.id);
      if (jdResult.extracted_data) {
        setParsedJd(jdResult.extracted_data);
        if (jdResult.extracted_data.job_title) {
          setSelectedRole(jdResult.extracted_data.job_title);
        }
      }

      // Build content for role detection
      let content = activeText.trim() || jdResult.extracted_text || "";
      if (!content && jdResult.extracted_data) {
        content = `${jdResult.extracted_data.job_title || ""} ${jdResult.extracted_data.responsibilities?.join(" ") || ""} ${jdResult.extracted_data.required_skills?.join(" ") || ""}`;
      }
      if (!content && activeFile) {
        content = activeFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      }
      if (!content || content.trim().length < 5) {
        content = activeFile?.name || "AI Technical Product Manager";
      }

      const rolesRes = await detectRolesApi(content.trim(), activeFile?.name);
      if (rolesRes.detected_roles && rolesRes.detected_roles.length > 0) {
        const roleTitles = rolesRes.detected_roles.map((r: any) => r.title);
        setDetectedRoles(roleTitles);
        setSelectedRole(rolesRes.primary_role || roleTitles[0]);
      }
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err.message || "Failed to analyze job description.";
      setJdError(msg);
    } finally {
      setJdUploading(false);
      setIsDetectingRoles(false);
    }
  };

  // Handlers
  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setResumeError("Only .pdf and .docx files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File size exceeds 10MB limit.");
      return;
    }

    setResumeFile(file);
    setResumeError(null);
    setResumeUploading(true);

    try {
      const result = await uploadResumeApi(file);
      setResumeDocId(result.id);
      setParsedCandidate(result.extracted_data);

      // If user hasn't uploaded a JD yet, infer target role from candidate profile
      if (!jdDocId && result.extracted_data?.skills?.length > 0) {
        const skillsText = result.extracted_data.skills.join(" ").toLowerCase();
        if (skillsText.includes("product") || skillsText.includes("prd") || skillsText.includes("roadmapping")) {
          setSelectedRole("Senior AI Technical Product Manager");
        } else if (skillsText.includes("kafka") || skillsText.includes("distributed")) {
          setSelectedRole("Senior Distributed Systems Engineer");
        }
      }
    } catch (err: any) {
      setResumeError(err.message || "Failed to parse resume.");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleJdFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setJdError("Only .pdf and .docx files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setJdError("File size exceeds 10MB limit.");
      return;
    }

    setJdFile(file);
    await processJobDescription(file, undefined);
  };

  const handleJdAnalyze = async () => {
    if (jdTab === "paste" && jdText.trim().length < 20) {
      setJdError("Please paste at least 20 characters of the job description.");
      return;
    }
    if (jdTab === "upload" && !jdFile) {
      setJdError("Please select a job description file.");
      return;
    }
    await processJobDescription();
  };


  const handleStartInterview = async () => {
    setStartError(null);

    if (!selectedRole.trim()) {
      setStartError("Please specify a target job role.");
      return;
    }

    if (!consentGiven) {
      setStartError("Please confirm permission for microphone and camera access.");
      return;
    }

    setIsStarting(true);

    try {
      const interview = await createInterviewApi({
        resume_document_id: resumeDocId || undefined,
        job_description_document_id: jdDocId || undefined,
        job_role: selectedRole,
        duration_minutes: duration,
        evaluation_rigor: rigor,
      });

      router.push(`/interview/${interview.id}/live`);
    } catch (err: any) {
      setStartError(err.message || "Failed to start interview session.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">AI Mock Interview</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-blue-600">
              <Sparkles className="w-4 h-4" /> Setup Wizard
            </span>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Setup Form Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Tailor the AI interviewer to your background, target role, and interview duration.
          </p>
        </div>

        {startError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{startError}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* STEP A: Candidate Resume */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center">
                    A
                  </span>
                  Candidate Resume (Optional)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your PDF or DOCX resume to anchor questions in your real project experience.
                </p>
              </div>
              {parsedCandidate && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Parsed
                </span>
              )}
            </div>

            {resumeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resumeError}</span>
              </div>
            )}

            {!resumeFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  Click to upload or drag &amp; drop resume
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supported formats: PDF, DOCX (Max 10MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleResumeSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{resumeFile.name}</p>
                    <p className="text-xs text-slate-500">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {resumeUploading ? (
                    <span className="text-xs text-blue-600 flex items-center gap-1.5 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        setResumeDocId(null);
                        setParsedCandidate(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {parsedCandidate && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Parsed Candidate Skills</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
                      {parsedCandidate.skills?.length || 0}
                    </span>
                  </p>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Extracted from candidate profile
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto pr-1 flex flex-wrap gap-1.5 scrollbar-thin">
                  {parsedCandidate.skills?.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* STEP B: Job Description */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center">
                    B
                  </span>
                  Target Job Description
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste text or upload a job specification to extract expected competencies.
                </p>
              </div>
              {parsedJd && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> JD Analyzed
                </span>
              )}
            </div>

            {jdError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{jdError}</span>
              </div>
            )}

            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => setJdTab("upload")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  jdTab === "upload"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Upload File (PDF/DOCX)
              </button>
              <button
                type="button"
                onClick={() => setJdTab("paste")}
                className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  jdTab === "paste"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Paste Text
              </button>
            </div>

            {jdTab === "paste" ? (
              <div>
                <textarea
                  rows={5}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description, required qualifications, and core duties here..."
                  className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>
            ) : (
              <div>
                {!jdFile ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition-all">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Select or drop Job Description Document (PDF/DOCX)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Auto-detects role, seniority, and required competencies
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleJdFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{jdFile.name}</p>
                        <p className="text-xs text-slate-500">{(jdFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {jdUploading || isDetectingRoles ? (
                        <span className="text-xs text-blue-600 flex items-center gap-1.5 font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing JD &amp; Roles...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setJdFile(null);
                            setJdDocId(null);
                            setParsedJd(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parsedJd && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Extracted Role:</span>
                    <span className="font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {parsedJd.job_title}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    Seniority: <strong className="text-slate-700">{parsedJd.seniority || "Senior"}</strong>
                  </span>
                </div>

                {parsedJd.required_skills && parsedJd.required_skills.length > 0 && (
                  <div>
                    <p className="text-slate-600 font-medium mb-1">Required Competencies &amp; Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedJd.required_skills.map((s: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleJdAnalyze}
                disabled={jdUploading || isDetectingRoles}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-50"
              >
                {jdUploading || isDetectingRoles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing JD &amp; Roles...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {parsedJd ? "Re-Extract Role Competencies" : "Extract Role Competencies"}
                  </>
                )}
              </button>
            </div>
          </section>


          {/* STEP D: Target Job Role */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold flex items-center justify-center">
                C
              </span>
              Target Job Role &amp; Seniority
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Confirm or customize the role you are interviewing for.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Confirmed Role Title
              </label>
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              {detectedRoles.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-slate-500">Quick suggestions:</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {detectedRoles.map((role, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          selectedRole === role
                            ? "bg-blue-50 border-blue-400 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* STEP E & F: Duration and Rigor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Duration */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-blue-600" />
                Session Duration
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Question count dynamically adapts to remaining time.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { mins: 10, label: "10 min", sub: "3 Questions" },
                  { mins: 20, label: "20 min", sub: "5 Questions" },
                  { mins: 30, label: "30 min", sub: "7 Questions (Standard)" },
                  { mins: 45, label: "45 min", sub: "10 Questions (Deep)" },
                ].map((item) => (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => setDuration(item.mins)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      duration === item.mins
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Rigor */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-blue-600" />
                Evaluation Rigor
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Determines follow-up depth and evaluation criteria.
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    key: "standard",
                    title: "Standard",
                    desc: "Core domain knowledge and past experiences.",
                    icon: Zap,
                  },
                  {
                    key: "target_bar",
                    title: "Target Bar (Recommended)",
                    desc: "Deep competency assessment at hiring level.",
                    icon: Award,
                  },
                  {
                    key: "stress_test",
                    title: "Stress Test",
                    desc: "High-pressure incident triage & trade-offs.",
                    icon: Flame,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRigor(item.key as any)}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        rigor === item.key
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* STEP G: Permissions & Start Button */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Media Permissions &amp; Recording Policy
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 mb-6">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Camera className="w-4 h-4 text-blue-600" />
                <Mic className="w-4 h-4 text-blue-600" />
                <span>Microphone &amp; Camera Access:</span>
              </div>
              <p>
                The live session uses your microphone for real-time conversational audio with the AI interviewer and optional local camera preview.
              </p>
              <div className="flex items-center gap-2 font-semibold text-slate-800 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Single-Recording Retention Guarantee:</span>
              </div>
              <p>
                To respect storage limits, only your <strong>latest recording</strong> is retained. Previous transcripts, reports, and scores are permanently preserved.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none mb-6">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                I agree to enable camera/microphone and record this practice session.
              </span>
            </label>

            <button
              type="button"
              onClick={handleStartInterview}
              disabled={isStarting}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:opacity-60 transition-all text-base"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Plan &amp; Connecting Interviewer...
                </>
              ) : (
                <>
                  Start Real-Time Mock Interview
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
