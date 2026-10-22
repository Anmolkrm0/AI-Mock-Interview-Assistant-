"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Bot, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  BarChart3, 
  AlertCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { triggerEvaluationApi, getInterviewStatusApi } from "@/services/api";

const STEPS = [
  { id: 1, label: "Finalizing session & synchronizing answer attempts" },
  { id: 2, label: "Extracting candidate quotes and architectural trade-offs" },
  { id: 3, label: "Scoring against role competencies and evaluation rigor" },
  { id: 4, label: "Synthesizing STAR improvements and bar-raiser verdict" },
];

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function runEvaluation() {
      try {
        setErrorMsg(null);
        setCurrentStep(1);

        // Step 1 animation
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;
        setCurrentStep(2);

        // Trigger evaluation API
        const evalPromise = triggerEvaluationApi(interviewId);

        // Step 2-3 progress timer animation while API is processing
        await new Promise((r) => setTimeout(r, 1200));
        if (!isMounted) return;
        setCurrentStep(3);

        const report = await evalPromise;

        if (!isMounted) return;
        setCurrentStep(4);

        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;
        setIsCompleted(true);

        // Auto navigate to report
        setTimeout(() => {
          if (isMounted) {
            router.push(`/interview/${interviewId}/report`);
          }
        }, 1200);

      } catch (err: any) {
        console.error("Evaluation error:", err);
        if (!isMounted) return;

        // Check if report is already generated
        try {
          const statusRes = await getInterviewStatusApi(interviewId);
          if (statusRes.report_ready) {
            setIsCompleted(true);
            router.push(`/interview/${interviewId}/report`);
            return;
          }
        } catch {}

        setErrorMsg(err.message || "Failed to generate evaluation report. Please retry.");
      }
    }

    runEvaluation();

    return () => {
      isMounted = false;
    };
  }, [interviewId, router, isRetrying]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight">AI Mock Interview</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner">
              {isCompleted ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              ) : errorMsg ? (
                <AlertCircle className="w-8 h-8 text-rose-400" />
              ) : (
                <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {isCompleted
                ? "Evaluation Complete!"
                : errorMsg
                ? "Evaluation Encountered an Issue"
                : "Evaluating Your Performance"}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {isCompleted
                ? "Your evidence-based scorecard and feedback report are ready."
                : errorMsg
                ? errorMsg
                : "Analyzing your audio responses, architectural trade-offs, and behavioral STAR structure."}
            </p>
          </div>

          {/* Stepper Status */}
          <div className="space-y-4 mb-8">
            {STEPS.map((step) => {
              const isDone = isCompleted || currentStep > step.id;
              const isActive = !isCompleted && currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                    isDone
                      ? "bg-slate-800/40 border-emerald-500/30 text-slate-300"
                      : isActive
                      ? "bg-blue-600/10 border-blue-500/40 text-blue-200"
                      : "bg-slate-900/40 border-slate-800/60 text-slate-600"
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-600">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium leading-tight">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error / Retry Action */}
          {errorMsg && (
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsRetrying((r) => !r)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Evaluation
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Completed CTA if auto-redirect hasn't triggered */}
          {isCompleted && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => router.push(`/interview/${interviewId}/report`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all"
              >
                View Full Scorecard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-900 text-center flex items-center justify-center text-xs text-slate-600">
        AI Evaluation Engine • Calibrated against engineering bar-raiser rubrics
      </footer>
    </div>
  );
}
