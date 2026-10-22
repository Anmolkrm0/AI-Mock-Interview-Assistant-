"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, 
  Plus, 
  Calendar, 
  Clock, 
  Award, 
  Volume2, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  FileText, 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  HardDrive
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { 
  listInterviewsApi, 
  getLatestRecordingApi, 
  deleteLatestRecordingApi 
} from "@/services/api";

interface InterviewItem {
  id: string;
  job_role: string;
  duration_minutes: number;
  evaluation_rigor: string;
  status: string;
  created_at: string;
  completed_at?: string;
  overall_score?: number | null;
  has_recording?: boolean;
}

interface LatestRecordingData {
  interview_id: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds: number;
  created_at: string;
  download_url: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [latestRecording, setLatestRecording] = useState<LatestRecordingData | null>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDeletingRecording, setIsDeletingRecording] = useState(false);

  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        // Check session
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // If unauthenticated, redirect to login
          router.push("/login");
          return;
        }
        setUserEmail(data.session.user.email || "Candidate");

        // Fetch user interviews and latest recording in parallel
        const [interviewsRes, recRes] = await Promise.all([
          listInterviewsApi(0, 50).catch(() => ({ interviews: [], total: 0 })),
          getLatestRecordingApi().catch(() => null),
        ]);

        setInterviews(interviewsRes.interviews || []);
        if (recRes && recRes.interview_id) {
          setLatestRecording(recRes);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDeleteRecording = async () => {
    if (!confirm("Are you sure you want to delete your active audio recording? Historical scores and transcripts will remain intact.")) {
      return;
    }
    try {
      setIsDeletingRecording(true);
      await deleteLatestRecordingApi();
      setLatestRecording(null);
    } catch (err: any) {
      alert("Failed to delete recording: " + (err.message || "Unknown error"));
    } finally {
      setIsDeletingRecording(false);
    }
  };

  // Calculations for KPI metric cards
  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const scoredInterviews = completedInterviews.filter((i) => typeof i.overall_score === "number");
  const averageScore = scoredInterviews.length
    ? Math.round(
        scoredInterviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) /
          scoredInterviews.length
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Loading Your Practice Dashboard...</h2>
        <p className="text-sm text-slate-500 mt-1">Retrieving session records and saved rubrics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">AI Mock Interview</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Candidate Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">{userEmail}</span>
              <span className="text-[10px] text-slate-500">Authenticated Candidate</span>
            </div>
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Interview
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, Candidate</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl leading-relaxed">
              Sharpen your responses against real hiring committee rubrics. Each interview benchmarks your technical depth, architecture, and STAR structuring.
            </p>
          </div>
          <Link
            href="/interview/setup"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-lg transition-all shrink-0"
          >
            Start New Practice
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Interviews */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Sessions</p>
              <p className="text-2xl font-extrabold text-slate-900">{interviews.length}</p>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Average Score</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {averageScore !== null ? `${averageScore}%` : "—"}
              </p>
            </div>
          </div>

          {/* Completed Rate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Completed</p>
              <p className="text-2xl font-extrabold text-slate-900">{completedInterviews.length}</p>
            </div>
          </div>

          {/* Active Audio */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Audio Retention</p>
              <p className="text-sm font-bold text-slate-900">
                {latestRecording ? "1 Active File" : "0 Active Files"}
              </p>
            </div>
          </div>
        </div>

        {/* Retained Audio Recording Card */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Active Retained Audio Recording</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Single-Recording Retention Policy: Your account keeps the audio recording of your most recent interview only.
              </p>
            </div>

            {latestRecording && (
              <button
                onClick={handleDeleteRecording}
                disabled={isDeletingRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingRecording ? "Deleting..." : "Delete Recording"}
              </button>
            )}
          </div>

          {latestRecording ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Interview Session: {latestRecording.interview_id.slice(0, 8)}...
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Latest Preserved
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Recorded: {new Date(latestRecording.created_at).toLocaleString()} • Size:{" "}
                  {(latestRecording.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • Duration:{" "}
                  {Math.round(latestRecording.duration_seconds / 60)} mins
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <audio
                  ref={audioRef}
                  src={latestRecording.download_url}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls
                  className="h-8 max-w-[280px]"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs text-slate-500 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                No active audio recording is currently stored. When you complete a voice mock interview, its recording will appear here automatically.
              </span>
            </div>
          )}
        </section>

        {/* Interview History List */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Interview History &amp; Scorecards</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All historical questions, evaluations, and STAR recommendations are permanently preserved.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {interviews.length} Sessions
            </span>
          </div>

          {interviews.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No Practice Sessions Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Start your first mock interview to practice with real-time AI voice and get an evidence-based competency scorecard.
              </p>
              <Link
                href="/interview/setup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Configure Practice Session
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {interviews.map((item) => {
                const isLatestRec = latestRecording?.interview_id === item.id;
                const score = item.overall_score;

                return (
                  <div
                    key={item.id}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 rounded-2xl px-3 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{item.job_role}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 uppercase tracking-wide">
                          {item.evaluation_rigor.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                            item.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "in_progress"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.duration_minutes}m target
                        </span>
                        {isLatestRec ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <Volume2 className="w-3.5 h-3.5" />
                            Audio Active
                          </span>
                        ) : (
                          <span className="text-slate-400">Audio Archived • Data Kept</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {typeof score === "number" && (
                        <div className="text-right">
                          <span
                            className={`text-lg font-extrabold ${
                              score >= 80 ? "text-emerald-600" : score >= 65 ? "text-blue-600" : "text-amber-600"
                            }`}
                          >
                            {score}
                          </span>
                          <span className="text-xs text-slate-400">/100</span>
                        </div>
                      )}

                      {item.status === "completed" ? (
                        <Link
                          href={`/interview/${item.id}/report`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          View Report
                        </Link>
                      ) : (
                        <Link
                          href={`/interview/${item.id}/live`}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Continue
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
