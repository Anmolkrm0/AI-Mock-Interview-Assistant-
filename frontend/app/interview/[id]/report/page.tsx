"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Volume2, 
  Printer, 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  Quote, 
  HelpCircle, 
  Star, 
  Send, 
  Check, 
  Clock, 
  FileText,
  Play,
  Pause,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  getInterviewReportApi, 
  getInterviewApi, 
  getRecordingUrlApi, 
  submitFeedbackApi 
} from "@/services/api";

interface CompetencyScore {
  competency: string;
  score: number;
}

interface HighlightItem {
  title: string;
  description: string;
}

interface QuestionEvaluation {
  question_id: number;
  question_text: string;
  competency: string;
  score: number;
  is_skipped?: boolean;
  candidate_quote: string;
  rationale: string;
  model_upgrade: string;
}

interface ReportData {
  id: string;
  interview_id: string;
  overall_score: number;
  competency_scores: CompetencyScore[];
  question_evaluations: QuestionEvaluation[];
  strengths: HighlightItem[];
  improvement_areas: HighlightItem[];
  recommendations: string[];
  report_status: string;
  created_at: string;
}

interface InterviewData {
  id: string;
  job_role: string;
  duration_minutes: number;
  evaluation_rigor: string;
  status: string;
  created_at: string;
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);

  // Audio Recording State
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Expanded Questions State
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // Feedback Form State
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Fetch interview details
        let interviewRes: InterviewData | null = null;
        try {
          interviewRes = await getInterviewApi(interviewId);
          setInterview(interviewRes);
        } catch (e: any) {
          console.warn("Could not fetch interview details:", e);
        }

        // 2. Fetch report, with auto-evaluation fallback
        let reportRes: ReportData | null = null;
        try {
          reportRes = await getInterviewReportApi(interviewId);
        } catch (repErr: any) {
          console.warn("Report not ready yet, attempting auto-evaluation:", repErr);
          try {
            reportRes = await triggerEvaluationApi(interviewId);
          } catch (evalErr: any) {
            console.error("Evaluation trigger failed:", evalErr);
            throw new Error(repErr.message || "Evaluation report has not been generated yet.");
          }
        }

        if (reportRes) {
          setReport(reportRes);

          // Initialize first 2 questions as expanded
          if (reportRes.question_evaluations) {
            const initialExpanded: Record<number, boolean> = {};
            reportRes.question_evaluations.forEach((q: QuestionEvaluation, idx: number) => {
              initialExpanded[q.question_id || idx] = idx < 2;
            });
            setExpandedQuestions(initialExpanded);
          }
        }

        // Attempt to fetch audio recording presigned URL
        try {
          const recRes = await getRecordingUrlApi(interviewId);
          if (recRes?.download_url) {
            setRecordingUrl(recRes.download_url);
          }
        } catch {
          // Recording not found or pruned per retention policy
          setAudioError("Recording archived per single-recording retention policy.");
        }

      } catch (err: any) {
        console.error("Failed to load interview report:", err);
        setErrorMsg(err.message || "Failed to load evaluation report.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [interviewId]);

  const toggleQuestion = (qId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleAudioPlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    try {
      setIsSubmittingFeedback(true);
      await submitFeedbackApi(interviewId, rating, comments);
      setFeedbackSubmitted(true);
    } catch (err: any) {
      alert("Failed to submit feedback: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Evaluation Report...</h2>
        <p className="text-sm text-slate-500 mt-1">Retrieving scorecard and competency analytics</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Report Not Available</h2>
          <p className="text-sm text-slate-600 mb-6">{errorMsg || "The evaluation report could not be found."}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                setLoading(true);
                setErrorMsg(null);
                try {
                  const rep = await triggerEvaluationApi(interviewId);
                  setReport(rep);
                } catch {
                  router.push(`/interview/${interviewId}/processing`);
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Trigger Evaluation
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = report.overall_score;
  const scoreColor =
    score >= 80
      ? "text-emerald-600 border-emerald-500 bg-emerald-50"
      : score >= 65
      ? "text-blue-600 border-blue-500 bg-blue-50"
      : score >= 50
      ? "text-amber-600 border-amber-500 bg-amber-50"
      : "text-rose-600 border-rose-500 bg-rose-50";

  const verdict =
    score >= 80 ? "Strong Hire" : score >= 65 ? "Meets Target Bar" : score >= 50 ? "Marginal Bar" : "Needs Focused Practice";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                {interview?.job_role || "Technical"} Evaluation Report
              </h1>
              <p className="text-xs text-slate-500">
                Session ID: {interviewId.slice(0, 8)}... • {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / PDF
            </button>
            <Link
              href="/interview/setup"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Executive Summary Card */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score Ring / Gauge (4 cols) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-2xl border border-slate-100 text-center">
              <div
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${scoreColor} mb-4`}
              >
                <span className="text-4xl font-extrabold tracking-tight">{score}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">/ 100</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {verdict}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Target Bar: {interview?.evaluation_rigor?.replace("_", " ").toUpperCase() || "TARGET BAR"}
              </p>
            </div>

            {/* Overview Meta & Key Takeaways (8 cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Role: {interview?.job_role}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                    Duration: {interview?.duration_minutes || 30} mins
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Questions: {report.question_evaluations?.length || 0}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Evaluation Scorecard &amp; Rubric Feedback
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This evaluation benchmarks your answers against principal-level hiring rubrics. Answers are evaluated for technical precision, trade-off articulation, incident mitigation, and STAR structuring.
                </p>
              </div>

              {/* Audio Playback Section */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    Interview Audio Recording
                  </span>
                  <span className="text-xs text-slate-400">Single-Recording Retention Policy</span>
                </div>

                {recordingUrl ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={handleAudioPlayToggle}
                      className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <audio
                        ref={audioRef}
                        src={recordingUrl}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        controls
                        className="w-full h-8"
                      />
                    </div>
                    <a
                      href={recordingUrl}
                      download={`mock-interview-${interviewId}.webm`}
                      className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                      title="Download Audio"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Audio recording for this session was superseded or cleared per the <strong>Single Latest Recording</strong> retention policy. All transcripts, scores, and rubrics are permanently preserved.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Competencies Progress Breakdown */}
        {report.competency_scores && report.competency_scores.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Competency Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Weighted domain competency proficiency</p>
              </div>
              <BarChart3Icon />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.competency_scores.map((comp, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{comp.competency}</span>
                    <span className="text-blue-600 font-bold">{comp.score}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        comp.score >= 80 ? "bg-emerald-500" : comp.score >= 65 ? "bg-blue-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, comp.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strengths and Growth Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Key Strengths */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Key Strengths Demonstrated</h3>
            </div>
            <div className="space-y-4">
              {report.strengths?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-900">{item.title}</h4>
                  <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Improvement Areas */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-amber-700">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Areas for Growth</h3>
            </div>
            <div className="space-y-4">
              {report.improvement_areas?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-900">{item.title}</h4>
                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actionable Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-300" />
              <h3 className="text-base font-bold text-white">Recommended Next Actions</h3>
            </div>
            <ul className="space-y-2.5">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-blue-100 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Question-by-Question Deep Dive */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Question-by-Question Analysis</h3>
            <span className="text-xs text-slate-500">Evidence quotes &amp; STAR model improvements</span>
          </div>

          <div className="space-y-4">
            {report.question_evaluations?.map((q, idx) => {
              const qId = q.question_id || idx + 1;
              const isExpanded = !!expandedQuestions[qId];

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  {/* Question Header Card */}
                  <div
                    onClick={() => toggleQuestion(qId)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {qId}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {q.competency}
                          </span>
                          {q.is_skipped && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                              Skipped
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-600">{q.score.toFixed(1)}</span>
                        <span className="text-xs text-slate-400"> / 5.0</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Evaluation Body */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      {/* Observed Candidate Quote */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          <Quote className="w-3.5 h-3.5 text-slate-400" />
                          Observed Candidate Transcript
                        </div>
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                          &ldquo;{q.candidate_quote}&rdquo;
                        </div>
                      </div>

                      {/* Evaluation Rationale */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          <Award className="w-3.5 h-3.5 text-blue-600" />
                          Hiring Committee Assessment
                        </div>
                        <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                          {q.rationale}
                        </p>
                      </div>

                      {/* Model STAR Upgrade */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Model STAR Improvement Recommendation
                        </div>
                        <p className="text-xs text-emerald-900 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 leading-relaxed">
                          {q.model_upgrade}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* User Session Feedback Form */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-lg font-bold text-slate-900">How Was This Mock Interview?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Your rating helps calibrate conversational naturalness and question rigor.
            </p>

            {feedbackSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Thank you! Your feedback has been recorded.
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4 text-left">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          starVal <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share any thoughts on audio clarity, response timing, or question difficulty... (optional)"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingFeedback ? "Submitting..." : "Submit Session Feedback"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function BarChart3Icon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
      <TrendingUp className="w-4 h-4" />
    </div>
  );
}
