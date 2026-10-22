import Link from "next/link";
import { 
  Bot, 
  Mic, 
  FileText, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Flame 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">AI Mock Interview</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Live Voice
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Adaptive Voice AI Powered by Gemini Multimodal Live
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Master Your Next Interview with <span className="text-blue-600">Real-Time AI Voice</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                Upload your resume and target job description. Conduct live conversational voice interviews that adapt to your answers, followed by rigorous, evidence-based competency evaluations.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/interview/setup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
                >
                  Start Interview Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
                >
                  View Demo Dashboard
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Supabase Secure Storage
                </span>
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-blue-600" />
                  Low-Latency Real-Time Audio
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  STAR Framework Rubrics
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs uppercase font-bold tracking-wider text-blue-600">Step-by-Step Flow</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">How the Simulation Works</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Upload Resume &amp; JD</h3>
                <p className="text-sm text-slate-600">
                  Parse PDF or DOCX documents to extract candidate skills, work history, and job competencies without fabricated data.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Generate Adaptive Plan</h3>
                <p className="text-sm text-slate-600">
                  The backend interview planner builds targeted questions across technical depth, architecture, and behavioral competencies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Live Voice Interview</h3>
                <p className="text-sm text-slate-600">
                  Engage in real-time spoken dialogue with the AI interviewer, with camera preview, live speech transcription, and timer sync.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center mb-4">
                  4
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Evidence-Based Report</h3>
                <p className="text-sm text-slate-600">
                  Review quote-level STAR critiques, competency scores out of 100, identified weaknesses, and playback of your latest recording.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation Modes */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs uppercase font-bold tracking-wider text-blue-600">Targeted Rigor</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">Choose Your Interview Rigor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Standard</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Balanced questions verifying past project experience, core domain skills, and foundational role expectations.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ideal for first-round phone screens
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border-2 border-blue-600 shadow-md relative flex flex-col justify-between">
                <div className="absolute -top-3 right-6 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Recommended
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Target Bar</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Deep probing assessing whether the candidate meets the competency bar expected at senior, staff, or lead levels.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Benchmarks against real company rubrics
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Stress Test</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Challenging follow-ups, ambiguous failure edge-cases, and time-pressured scenario triage while maintaining professional tone.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pressure test for critical hiring loops
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/interview/setup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
              >
                Configure Your Interview
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Mock Interview Platform. Built for real-world interview excellence.</p>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
            <Link href="/interview/setup" className="hover:text-slate-900 transition-colors">Start Practice</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
