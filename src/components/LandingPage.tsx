import React, { useState } from 'react';

interface LandingPageProps {
  onStartInterview: () => void;
  onExploreAnalytics: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartInterview,
  onExploreAnalytics,
}) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoPacing, setDemoPacing] = useState(134);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-gutter pt-space-xl pb-space-lg text-center flex flex-col items-center">
        {/* Decorative background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-fixed-dim/25 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-10 w-72 h-72 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary-fixed/80 border border-primary/20 text-on-primary-fixed-variant font-label-sm text-label-sm mb-space-md shadow-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Powered by Multimodal AI & Real-time Speech</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="font-display-lg text-3xl sm:text-5xl md:text-6xl text-on-surface tracking-tight max-w-4xl font-extrabold leading-tight">
          Master High-Stakes Tech & Product Interviews with{' '}
          <span className="text-primary bg-gradient-to-r from-primary via-primary-container to-tertiary bg-clip-text text-transparent">
            Realistic AI
          </span>
        </h1>

        <p className="mt-space-md font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Practice with an adaptive AI interviewer calibrated to your resume and exact target job description.
          Experience real-time speech dialogue, instant scorecards, and actionable answer rewrites.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-lg">
          <button
            onClick={onStartInterview}
            className="inline-flex items-center gap-2 px-space-xl py-3.5 rounded-full bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container hover:shadow-lg transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <span>Start Interview Free</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button
            onClick={() => setIsPlayingDemo(!isPlayingDemo)}
            className="inline-flex items-center gap-2 px-space-lg py-3.5 rounded-full bg-surface-container-high text-on-surface font-title-md text-title-md font-medium hover:bg-surface-container-highest transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">
              {isPlayingDemo ? 'pause_circle' : 'play_circle'}
            </span>
            <span>{isPlayingDemo ? 'Pause Live Demo' : 'Watch 1-Min Live Demo'}</span>
          </button>
        </div>

        {/* Interactive Hero Simulation Frame Preview */}
        <div className="w-full max-w-5xl mt-space-xl bg-surface-container-lowest border border-surface-container-high rounded-2xl p-space-md sm:p-space-lg shadow-xl text-left">
          {/* Simulation Header */}
          <div className="flex flex-wrap items-center justify-between pb-space-sm border-b border-surface-container gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="ml-2 font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[16px] text-primary">view_in_ar</span>
                System Architecture & Scale • Staff Engineer Simulation
              </span>
            </div>
            <div className="flex items-center gap-space-sm font-label-sm text-label-sm">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                Live Audio Feed Active
              </span>
              <span className="text-on-surface-variant font-semibold">14:28 / 45:00</span>
            </div>
          </div>

          {/* Simulation Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md mt-space-md items-stretch">
            {/* AI Interviewer Probe Box (7 cols) */}
            <div className="md:col-span-7 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between border border-surface-container">
              <div>
                <div className="flex items-center justify-between mb-space-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <div>
                      <div className="font-title-md text-sm text-on-surface font-semibold flex items-center gap-1.5">
                        Dr. Alex Vance, Staff AI
                      </div>
                      <span className="text-xs text-on-surface-variant">Calibrated to Stripe L6 Staff Bar</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-xs font-semibold">
                    <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                    Speaking
                  </span>
                </div>

                <div className="mt-space-sm">
                  <span className="font-label-sm text-xs text-primary font-semibold uppercase tracking-wider block mb-1">
                    CURRENT PROBE
                  </span>
                  <p className="font-title-md text-base text-on-surface leading-relaxed">
                    “Tell me about an instance when you had to scale a distributed cache under high p99 latency.
                    What trade-offs did you make between consistency and eviction policy?”
                  </p>
                </div>
              </div>

              {/* Soundwave animation */}
              <div className="mt-space-md pt-space-sm border-t border-surface-container flex items-center justify-between">
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 bg-primary rounded-full h-3 animate-[pulse_0.7s_infinite]" />
                  <span className="w-1 bg-primary rounded-full h-6 animate-[pulse_0.5s_infinite_0.1s]" />
                  <span className="w-1 bg-primary rounded-full h-4 animate-[pulse_0.9s_infinite_0.2s]" />
                  <span className="w-1 bg-primary rounded-full h-7 animate-[pulse_0.6s_infinite_0.3s]" />
                  <span className="w-1 bg-primary rounded-full h-3 animate-[pulse_0.8s_infinite_0.4s]" />
                  <span className="w-1 bg-primary rounded-full h-5 animate-[pulse_0.4s_infinite_0.1s]" />
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <button className="p-1 hover:text-primary transition-colors cursor-pointer" title="Speaker">
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                  <button className="p-1 hover:text-primary transition-colors cursor-pointer" title="Settings">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Box & Real-Time Telemetry (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-space-sm">
              {/* Candidate snippet */}
              <div className="bg-surface-container-low rounded-xl p-space-sm flex items-center gap-3 border border-surface-container">
                <img
                  alt="Candidate"
                  className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary-fixed"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuARgJudZKbIZ_RranUE2Fdo0airfrwNTmZCJvVFOUJn7_X2RHQiOkKKFT70xnXHwYlDvteAfNm0Q_r_GzUnOpcdN3xjIGcCVg7FYBb3M6PfeT9EBtLyalZ1rDdRrOi7_jCmnjg9exci8v8FMNJMncoNFP0CyVMojIBzUBESCge0C3W6L55q0wfBAbWBWfJLDRqbMeDQt7F6CGG7cRq_FoWDXdOvGv1-NeuU8rY_3gBRHq7MJLnM7Vzn"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-xs text-on-surface font-semibold">Candidate (You)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                      Mic Live
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5 italic">
                    “We implemented a write-through Redis cluster with consistent hashing...”
                  </p>
                  <span className="text-[11px] text-secondary font-medium block mt-0.5">
                    Pacing: {demoPacing} WPM (Optimal)
                  </span>
                </div>
              </div>

              {/* Real-time AI Telemetry */}
              <div className="bg-surface-container-low rounded-xl p-space-sm space-y-2 border border-surface-container">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">bolt</span>
                    Real-time AI Telemetry
                  </span>
                  <span className="text-on-surface-variant text-[10px]">Model: Gemini 3.8 Flash</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span>Confidence & Delivery</span>
                    <span className="font-semibold text-primary">94%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '94%' }} />
                  </div>

                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span>Technical Precision (CAP Theorem)</span>
                    <span className="font-semibold text-secondary">91%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '91%' }} />
                  </div>
                </div>

                {/* AI Coach Whisper */}
                <div className="pt-1 flex items-start gap-1.5 text-[11px] text-on-surface bg-surface-container-lowest p-2 rounded-lg border border-surface-container">
                  <span className="material-symbols-outlined text-[15px] text-tertiary mt-0.5 shrink-0">
                    tips_and_updates
                  </span>
                  <div>
                    <strong className="text-tertiary font-semibold">AI Coach Whisper:</strong> Good mention of cache
                    invalidation. Anchor your answer with metrics (e.g. latency drop from 250ms to 45ms).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Footer Pill Strip */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm mt-space-sm border-t border-surface-container text-xs text-on-surface-variant">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
                End-to-End Latency: <strong>290ms</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
                Zero Data Retention practiced
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-semibold text-on-surface">
              Rigor Mode: Target Bar
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: How InterviewMind Works (3-Step Workflow) */}
      <section className="w-full bg-surface-container-low py-space-xl border-t border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col items-center text-center">
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary-fixed mb-space-xs">
            Structured Workflow
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
            How InterviewMind Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mt-1">
            From job posting parsing to deep behavioral analytics in three seamless, stress-free steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg w-full mt-space-xl text-left">
            {/* Step 1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container relative overflow-hidden group">
              <span className="absolute top-4 right-4 text-6xl font-black text-surface-container-high/60 group-hover:text-primary-fixed transition-colors pointer-events-none">
                01
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-space-md shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">upload_file</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Upload & Calibrate
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Drop your resume and the exact target job description. The AI parses required competencies, tech
                  stacks, and seniority level to build a customized rubric.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm border-t border-surface-container flex items-center gap-1.5 text-xs text-primary font-semibold">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Custom role & behavioral question synthesis
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container relative overflow-hidden group">
              <span className="absolute top-4 right-4 text-6xl font-black text-surface-container-high/60 group-hover:text-secondary-fixed transition-colors pointer-events-none">
                02
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-space-md shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">record_voice_over</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Live Voice & Video Session
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Conduct an interactive spoken mock interview. The AI dynamically adapts its line of questioning,
                  interrupts for clarification, and challenges vague assumptions.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm border-t border-surface-container flex items-center gap-1.5 text-xs text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">mic</span>
                Sub-second conversational audio streaming
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-surface-container relative overflow-hidden group">
              <span className="absolute top-4 right-4 text-6xl font-black text-surface-container-high/60 group-hover:text-tertiary-fixed transition-colors pointer-events-none">
                03
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary mb-space-md shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">assessment</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Deep Performance Diagnostic
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Receive a score out of 100, competency radar breakdowns, verbatim critique with timestamps, and
                  AI-rewritten model answers to nail your dream job.
                </p>
              </div>
              <div className="mt-space-lg pt-space-sm border-t border-surface-container flex items-center gap-1.5 text-xs text-tertiary font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Instant comprehensive evaluation PDF
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Built for Realistic, Stress-Tested Preparation */}
      <section className="w-full max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="text-left mb-space-xl">
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Key Capabilities
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
            Built for Realistic, Stress-Tested Preparation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {/* Capability 1 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                  Automated Extraction
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                Resume & Role Tailoring
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Our ingestion engine parses your actual past projects, technical stack, and career gaps. It aligns
                questions directly with the role requirements—whether for a Junior SWE, Senior SRE, or Principal
                Product Manager.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-space-md pt-space-sm border-t border-surface-container">
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                Resume Parser
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                JD Skill Extraction
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                Seniority Tuning
              </span>
            </div>
          </div>

          {/* Capability 2 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-fixed-variant">
                  &lt; 300ms Latency
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                Real-Time Voice Interaction
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                No typing required. Speak aloud naturally with zero awkward lags. The interviewer detects tone, filler
                words (um, like, basically), pauses, and answers with lifelike cadence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-space-md pt-space-sm border-t border-surface-container">
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                Bilingual Speech-to-Speech Engine
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                Active Listening
              </span>
            </div>
          </div>

          {/* Capability 3 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                  Adjustable Rigor
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                3 Evaluation Rigor Tiers
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Choose between standard warm-up practice, realistic company hiring bar simulation, or an intense
                "Stress Test" mode designed to test emotional resilience under challenging pushback.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-space-md pt-space-sm border-t border-surface-container">
              <span className="px-3 py-1 rounded-full bg-surface-container text-xs text-on-surface font-medium">
                Standard
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
                Target Bar
              </span>
              <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
                Stress Test
              </span>
            </div>
          </div>

          {/* Capability 4 */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">fact_check</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface">
                  Executive Rubric
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                Holistic Scorecards
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Get graded across 4 enterprise pillars: Communication & Conciseness, Technical Depth, Problem Solving
                & Frameworks, and Executive Presence. Walk away with exact rewritten responses.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-on-surface-variant">Communication & Conciseness</span>
                <span className="font-bold text-secondary">9.2 / 10</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Bottom Call-To-Action Banner */}
      <section className="w-full max-w-7xl mx-auto px-gutter pb-space-xl">
        <div className="w-full rounded-3xl bg-gradient-to-r from-primary via-primary-container to-secondary p-space-xl text-center text-white shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-label-sm text-label-sm mb-space-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
            <span>No Credit Card Required • 2 Free Full Mocks</span>
          </div>

          <h2 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight text-white">
            Ready to Ace Your Next Senior Interview?
          </h2>

          <p className="font-body-lg text-white/90 max-w-xl mt-space-sm leading-relaxed">
            Upload your target job description and practice live right now. Receive actionable scorecards and
            personalized coaching in under 15 minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-lg">
            <button
              onClick={onStartInterview}
              className="inline-flex items-center gap-2 px-space-xl py-3.5 rounded-full bg-white text-primary font-title-md text-title-md font-bold hover:bg-white/90 hover:shadow-lg transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>Launch Interview Setup</span>
            </button>
            <button
              onClick={onExploreAnalytics}
              className="inline-flex items-center gap-2 px-space-lg py-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-title-md text-title-md font-medium transition-all cursor-pointer backdrop-blur-md"
            >
              <span>Explore Analytics Demo</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
