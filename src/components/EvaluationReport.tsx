import React, { useState } from 'react';
import { SessionReport, QuestionItem } from '../types';

interface EvaluationReportProps {
  session: SessionReport;
  onRetake: () => void;
  onViewHistory: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({
  session,
  onRetake,
  onViewHistory,
}) => {
  // Accordion state
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([1]);

  // Video recording simulation
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoTimestamp, setVideoTimestamp] = useState('09:14 / 28:14');
  const [activePlaybackSpeed, setActivePlaybackSpeed] = useState('1.25x');

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState(
    'The follow-up questioning on distributed split-brain edge cases felt uncannily accurate to my real Google L6 system design loop. It would be helpful if the AI allowed a 5-second pause while sketching architectural diagrams before auto-prompting.'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Realistic Follow-ups',
    'Great Audio Cadence',
    'Challenging Edge Cases',
  ]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // PDF download simulation
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Focused drill generator modal state
  const [drillModalOpen, setDrillModalOpen] = useState(false);

  const toggleAccordion = (qId: number) => {
    if (expandedQuestions.includes(qId)) {
      setExpandedQuestions(expandedQuestions.filter((id) => id !== qId));
    } else {
      setExpandedQuestions([...expandedQuestions, qId]);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      setIsDownloadingPdf(false);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
      window.print();
    }, 1000);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmittingFeedback(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          rating,
          comments: feedbackText,
          tags: selectedTags,
        }),
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setFeedbackSubmitted(true);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const defaultQuestions: QuestionItem[] = [
    {
      id: 1,
      topic: 'Multi-Region Idempotency',
      category: 'System Design',
      score: 9.2,
      question: 'How did you ensure idempotency across multi-region datacenters?',
      timestamp: '04:12',
      candidateExcerpt:
        '...We implemented a deterministic unique request token derived from client payloads, stored alongside a distributed Redis bloom filter to rapidly reject duplicate processing requests across regions before hitting persistent Postgres...',
      aiRationale:
        'Exceptional breakdown of early probabilistic filtering. Accurately highlighted distributed lock contention patterns and cache synchronization across WAN latency boundaries.',
      modelUpgrade:
        'To take this to Staff/Principal level, explicitly mention how you handled two-phase commit fallbacks and tombstone records during deep split-brain network partitions to prevent replay anomalies during master failovers.',
    },
    {
      id: 2,
      topic: 'Crisis Response',
      category: 'Behavioral',
      score: 8.4,
      question: 'Tell me about a high-pressure production outage you led resolution on.',
      timestamp: '12:45',
      candidateExcerpt:
        '...Our gateway started shedding 35% of ingress traffic after a bad BGP route deployment. I quickly assembled the SRE emergency channel, instituted a rolling rollback, and communicated status updates to executive stakeholders every 15 minutes...',
      aiRationale:
        'Good poise under pressure and commendable command of cross-functional crisis communication. However, root-cause triage protocols could have been articulated with sharper technical precision.',
      modelUpgrade:
        'Emphasize how you prevented recurring failures: discuss introducing automated canary verifications, synthetic traffic probes, and how post-incident retro culture shifted engineering priorities.',
    },
    {
      id: 3,
      topic: 'Monolith Migration',
      category: 'Deep Architecture',
      score: 9.0,
      question: 'How would you migrate a synchronous billing monolith to an event-driven queue?',
      timestamp: '19:30',
      candidateExcerpt:
        '...Utilized the Outbox pattern with Debezium CDC capturing database write-ahead logs. Published events directly into Kafka topics with strictly enforced Avro schema registries to ensure zero dual-write inconsistencies...',
      aiRationale:
        'Exemplary grasp of transactional outbox and zero dual-write guarantees.',
      modelUpgrade:
        'To elevate to Principal Engineer, elaborate on idempotent consumer dead-letter triage and distributed tracing correlation keys.',
    },
  ];

  const questionsToDisplay = session.questions?.length > 0 ? session.questions : defaultQuestions;

  const ratingTexts = [
    'Needs Improvement (1/5)',
    'Somewhat Realistic (2/5)',
    'Satisfactory (3/5)',
    'Realistic & Thorough (4/5)',
    'Very Satisfied (5/5)',
  ];

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-140px)] flex flex-col pb-space-xl">
      {/* Top Utility Context / Breadcrumbs & Quick Metadata */}
      <div className="max-w-7xl mx-auto w-full px-gutter pt-space-lg pb-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <button onClick={onViewHistory} className="hover:text-primary transition-colors cursor-pointer">
              Interviews
            </button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <button onClick={onViewHistory} className="hover:text-primary transition-colors cursor-pointer">
              History
            </button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Session #{session.id}</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Evaluation Finalized
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Calibrated with Google L6 / Meta E6 Rubric
            </span>
          </div>
        </div>
      </div>

      {/* Header Banner & Candidate Summary */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-lg">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md min-w-0">
            <div className="relative shrink-0">
              <img
                className="w-20 h-20 rounded-2xl object-cover shadow-sm ring-1 ring-surface-container"
                alt="Alex Chen Candidate Headshot"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6o8FTensmyJU1TIbIffa9FDFdjOwD0pRWtKpdtDaMAcqLKGgJaupQxHqQdKNnoTJ5tXZ0ttyqIvha07Z5KZEMTjIgcx0tvH1KUVnWyLEGlYbOnMsyRXUDecr-f0b2euAr-WFwAuheFJiBKLouARHlqAxJSYeZ6VMl0poI0E0v_R6iYQ9crZVsnHKyNx3kUCa52d0hmD0uqDMGoVKT3HC6h_9AytuE1cgf8n_Ze7P80NWcoh3yGbZU"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-1 shadow">
                <span className="material-symbols-outlined text-[16px] block">verified</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-space-xs">
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  Alex Chen
                </h1>
                <span className="px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                  Verified Candidate
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant truncate">
                {session.role} • Infrastructure Architecture
              </p>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 pt-1 text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">target</span>
                  Rigor: <strong className="text-on-surface font-semibold">{session.rigor}</strong>
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                  {session.date}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                  {session.actualDuration || `${session.durationMinutes}m`} ({session.promptsAnswered || 5} Prompts)
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-space-sm sm:self-end lg:self-center">
            <button
              onClick={onRetake}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-all cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              Retake Interview
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Recruiter review link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-container-low text-primary font-label-md text-label-md hover:bg-primary-fixed transition-all cursor-pointer font-semibold border border-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share with Recruiter
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-md cursor-pointer font-semibold disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isDownloadingPdf ? 'animate-bounce' : ''}`}>
                {pdfDownloaded ? 'check_circle' : 'picture_as_pdf'}
              </span>
              <span>{isDownloadingPdf ? 'Generating PDF...' : pdfDownloaded ? 'Downloaded' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Executive Performance Overview */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md">
          {/* Card 1: Overall Score Circular Gauge (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Overall Calibration
              </span>
              <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
            </div>
            <div className="py-space-md flex flex-col items-center justify-center text-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    className="stroke-surface-container-high"
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    strokeWidth="10"
                  />
                  <circle
                    className="stroke-primary transition-all duration-1000 ease-out"
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    strokeDasharray="314.159"
                    strokeDashoffset={314.159 - (314.159 * session.overallScore) / 100}
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display-lg text-[42px] leading-tight font-bold text-on-surface">
                    {session.overallScore}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    out of 100
                  </span>
                </div>
              </div>
              <div className="mt-space-sm space-y-1">
                <span className="inline-block px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                  {session.verdict || 'Strong Hire • Meets Target Bar'}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Percentile:{' '}
                  <span className="font-semibold text-primary">{session.percentile || 'Top 8%'}</span>
                </p>
              </div>
            </div>
            <div className="pt-space-sm border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>Confidence Index: {session.confidenceIndex || '96.4%'}</span>
              <span>{session.modelPasses || 4} Model Passes</span>
            </div>
          </div>

          {/* Card 2: Core Dimension Breakdown (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Dimension Analysis
              </span>
              <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold">
                Benchmark: 80+
              </span>
            </div>
            <div className="space-y-space-md py-space-xs">
              {(session.dimensions?.length > 0
                ? session.dimensions
                : [
                    { name: 'Technical Depth & Architecture', score: 92, status: 'Exceptional' },
                    { name: 'Communication & Articulation', score: 85, status: 'Strong' },
                    { name: 'Problem Solving & Edge Cases', score: 88, status: 'Strong' },
                    { name: 'System Design Trade-offs', score: 82, status: 'Competent' },
                  ]
              ).map((dim, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-on-surface">
                    <span className="font-title-md text-title-md text-[14px] font-semibold">{dim.name}</span>
                    <div className="flex items-center gap-space-xs">
                      <span
                        className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-medium ${
                          dim.status === 'Exceptional'
                            ? 'bg-secondary-container text-on-secondary-fixed-variant'
                            : dim.status === 'Strong'
                            ? 'bg-primary-fixed text-on-primary-fixed-variant'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {dim.status}
                      </span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        {dim.score}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0
                          ? 'bg-secondary'
                          : idx === 1 || idx === 2
                          ? 'bg-primary'
                          : 'bg-tertiary-container'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-space-sm border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>Weighted System Avg: 86.75</span>
              <span className="text-secondary font-semibold">+12.4% vs industry baseline</span>
            </div>
          </div>

          {/* Card 3: Answer Quality Metrics (3 cols) */}
          <div className="lg:col-span-3 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                  Answer Quality
                </span>
                <span className="material-symbols-outlined text-secondary text-[20px]">speed</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Real-time NLP telemetry during candidate synthesis.
              </p>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="bg-surface-container-low rounded-xl p-space-sm text-center border border-surface-container">
                  <span className="font-display-lg text-[28px] font-bold text-primary block leading-none">
                    {session.answerQuality?.relevance || 94}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Relevance</span>
                  <div className="mt-1 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${session.answerQuality?.relevance || 94}%` }}
                    />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-space-sm text-center border border-surface-container">
                  <span className="font-display-lg text-[28px] font-bold text-secondary block leading-none">
                    {session.answerQuality?.completeness || 89}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Completeness</span>
                  <div className="mt-1 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${session.answerQuality?.completeness || 89}%` }}
                    />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-space-sm text-center border border-surface-container">
                  <span className="font-display-lg text-[28px] font-bold text-primary-container block leading-none">
                    {session.answerQuality?.clarity || 91}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Clarity</span>
                  <div className="mt-1 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-container"
                      style={{ width: `${session.answerQuality?.clarity || 91}%` }}
                    />
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-space-sm text-center border border-surface-container">
                  <span className="font-display-lg text-[28px] font-bold text-on-surface-variant block leading-none">
                    {session.answerQuality?.conciseness || 82}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Conciseness</span>
                  <div className="mt-1 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-on-surface-variant"
                      style={{ width: `${session.answerQuality?.conciseness || 82}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-space-md p-space-xs rounded-xl bg-surface-container flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm border border-surface-container-high">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span>Speaking rate: {session.speechRateWpm || 142} wpm (Optimal: 130-155)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnostic Feedback & Calibration */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-lg">
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Diagnostic Feedback &amp; Calibration
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Granular cognitive analysis broken down by recruiting competencies.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">AI Rubric Model:</span>
            <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
              Gemini 3.8 Flash Recruiter
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
          {/* Strengths Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                </span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Key Strengths</h3>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    Identified in 4 of 5 answers
                  </span>
                </div>
              </div>
              <ul className="space-y-space-sm font-body-md text-body-md text-on-surface-variant">
                {(session.strengths?.length > 0
                  ? session.strengths
                  : [
                      {
                        title: 'Distributed Consensus',
                        description: 'Demonstrated deep mastery of distributed consensus protocols (Raft/Paxos leader election cycles).',
                      },
                      {
                        title: 'Consistency Models',
                        description: 'Clear articulation of trade-offs between eventual consistency vs linearizability under heavy network partitions.',
                      },
                      {
                        title: 'Production Grit',
                        description: 'Grounded arguments with strong real-world examples from past high-throughput production incidents.',
                      },
                    ]
                ).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span>
                      <strong className="text-on-surface font-semibold">{s.title}:</strong> {s.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-space-lg pt-space-sm border-t border-surface-container flex items-center justify-between text-secondary font-label-sm text-label-sm font-semibold">
              <span>Target Alignment: 94%</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Areas for Improvement Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                  <span className="material-symbols-outlined text-[18px]">troubleshoot</span>
                </span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Identified Gaps</h3>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    Opportunities to reach Staff Level
                  </span>
                </div>
              </div>
              <ul className="space-y-space-sm font-body-md text-body-md text-on-surface-variant">
                {(session.gaps?.length > 0
                  ? session.gaps
                  : [
                      {
                        title: 'Disaster Recovery',
                        description: 'Slight hesitation when discussing disaster recovery topologies across multi-cloud asynchronous boundaries.',
                      },
                      {
                        title: 'Latency Metrics',
                        description: 'Could proactively offer precise quantitative tail-latency (p99/p99.9) SLAs upfront before prompting.',
                      },
                      {
                        title: 'Executive Conciseness',
                        description: 'Tends to over-explain foundational data structures before advancing to high-level architectural decisions.',
                      },
                    ]
                ).map((g, idx) => (
                  <li key={idx} className="flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">
                      warning
                    </span>
                    <span>
                      <strong className="text-on-surface font-semibold">{g.title}:</strong> {g.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-space-lg pt-space-sm border-t border-surface-container flex items-center justify-between text-primary font-label-sm text-label-sm font-semibold">
              <span>Gap Severity: Low-Moderate</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Actionable Next Steps Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-space-sm mb-space-md">
                <span className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                </span>
                <div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Action Plan</h3>
                  <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                    Tailored drills for next session
                  </span>
                </div>
              </div>
              <div className="space-y-space-sm">
                {(session.actionPlan?.length > 0
                  ? session.actionPlan
                  : [
                      {
                        title: 'Tighten STAR Narrative',
                        description: 'Structure behavioral narratives with sharper situation boundaries to shave 45 seconds off introductions.',
                      },
                      {
                        title: 'Early Impact Quantification',
                        description: 'Quantify operational business impact (e.g., peak TPS sustained, cloud egress cost reductions) within the first 60 seconds.',
                      },
                    ]
                ).map((a, idx) => (
                  <div key={idx} className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container">
                    <div className="flex items-center gap-1.5 text-tertiary font-label-md text-label-md mb-1 font-semibold">
                      <span className="material-symbols-outlined text-[16px]">timer</span>
                      <span>{a.title}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setDrillModalOpen(true)}
              className="mt-space-md w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md hover:bg-tertiary hover:text-on-tertiary transition-all cursor-pointer font-bold shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">exercise</span>
              Generate 15-Min Focused Drill
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Split Panel: Question Breakdown & Media Replay */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Question-Wise Deep Feedback Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  Question Analysis
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Explore transcript excerpts, AI calibration, and improved Staff-level responses.
                </p>
              </div>
              <span className="font-label-sm text-label-sm px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-semibold">
                {questionsToDisplay.length} Evaluated Questions
              </span>
            </div>

            {/* Accordions */}
            {questionsToDisplay.map((q) => {
              const isExpanded = expandedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container transition-all"
                >
                  <div
                    onClick={() => toggleAccordion(q.id)}
                    className="flex items-start justify-between cursor-pointer gap-space-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold">
                          Q{q.id} • {q.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                          {q.score || 9.0} / 10
                        </span>
                      </div>
                      <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                        "{q.question}"
                      </h3>
                    </div>
                    <span
                      className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-space-md space-y-space-sm pt-space-sm border-t border-surface-container">
                      {/* Candidate Response Excerpt */}
                      <div className="p-space-sm rounded-xl bg-surface-container-low space-y-1 border border-surface-container">
                        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                            Candidate Response Excerpt
                          </span>
                          <span>Timestamp: {q.timestamp || '04:12'}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface italic leading-relaxed">
                          {q.candidateExcerpt ||
                            `"...We implemented a deterministic unique request token derived from client payloads, stored alongside a distributed Redis bloom filter to rapidly reject duplicate processing requests across regions before hitting persistent Postgres..."`}
                        </p>
                      </div>

                      {/* AI Evaluation Summary */}
                      <div className="p-space-sm rounded-xl bg-primary-fixed/30 space-y-1 border border-primary/20">
                        <div className="flex items-center gap-1 text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                          AI Scoring Rationale • Scored {q.score || 9.2}/10
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                          {q.aiRationale ||
                            'Exceptional breakdown of early probabilistic filtering. Accurately highlighted distributed lock contention patterns and cache synchronization across WAN latency boundaries.'}
                        </p>
                      </div>

                      {/* Model Improved Response */}
                      <div className="p-space-sm rounded-xl bg-secondary-fixed/30 space-y-1 border border-secondary/20">
                        <div className="flex items-center gap-1 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[16px] text-secondary">star</span>
                          Staff+ Level Model Answer Upgrade
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                          {q.modelUpgrade ||
                            'To take this to Staff/Principal level, explicitly mention how you handled two-phase commit fallbacks and tombstone records during deep split-brain network partitions to prevent replay anomalies during master failovers.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Media Playback & Interactive Audio Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-space-md">
            {/* Recording Player Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container space-y-space-md">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  Session Recording
                </span>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant font-medium">
                    HD 1080p
                  </span>
                </div>
              </div>

              {/* Video Canvas Mock */}
              <div className="relative w-full aspect-video rounded-xl bg-inverse-surface overflow-hidden group border border-surface-container-highest">
                <img
                  className="w-full h-full object-cover opacity-85"
                  alt="High tech split screen interview view"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT2UfHgbY9qL_ZsO_h7_-REewl2M07T-Mygwwlv96eZ5zw9bCkg5AJQcokm0D7YjAuMkvTNekLGrkW0B2xoy5iK6jPkz6KDk45xUagVULOE3MG5vqpodaySfoENLhWeuVIrfMazpB84TplsDPnnF8fs6H7DteTHSJ8VKtoyG5UaXX-mvYy6dm6FncG3-VrAeKrjJJVDaGKu2-ftjjTuvP4rSxGVL3qq6BW__AezN6Jn_lepVR86aE1"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Center Play Button */}
                <button
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-primary/90 hover:bg-primary text-on-primary flex items-center justify-center transition-transform hover:scale-110 shadow-lg cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[32px] ml-1">
                    {isPlayingVideo ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                {/* Video Timeline Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 space-y-2">
                  <div className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '32%' }} />
                    <div className="absolute top-0 left-[14%] w-1.5 h-full bg-secondary" title="Q1" />
                    <div className="absolute top-0 left-[45%] w-1.5 h-full bg-secondary" title="Q2" />
                    <div className="absolute top-0 left-[68%] w-1.5 h-full bg-secondary" title="Q3" />
                  </div>
                  <div className="flex items-center justify-between text-white text-[12px] font-label-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] cursor-pointer">volume_up</span>
                      <span>{videoTimestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() =>
                          setActivePlaybackSpeed(
                            activePlaybackSpeed === '1x'
                              ? '1.25x'
                              : activePlaybackSpeed === '1.25x'
                              ? '1.5x'
                              : '1x'
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-white/20 text-[11px] cursor-pointer hover:bg-white/30 font-semibold"
                      >
                        {activePlaybackSpeed}
                      </span>
                      <span className="material-symbols-outlined text-[18px] cursor-pointer">fullscreen</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Question Bookmarks */}
              <div className="space-y-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                  Jump to Bookmarked Question:
                </span>
                <div className="grid grid-cols-3 gap-space-xs">
                  <button
                    onClick={() => {
                      setVideoTimestamp('04:12 / 28:14');
                      if (!expandedQuestions.includes(1)) setExpandedQuestions([...expandedQuestions, 1]);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-left transition-colors cursor-pointer border border-surface-container"
                    type="button"
                  >
                    <span className="block font-label-sm text-label-sm font-semibold text-primary">04:12</span>
                    <span className="block font-body-sm text-body-sm text-on-surface truncate">
                      Q1: Idempotency
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setVideoTimestamp('12:45 / 28:14');
                      if (!expandedQuestions.includes(2)) setExpandedQuestions([...expandedQuestions, 2]);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-left transition-colors cursor-pointer border border-surface-container"
                    type="button"
                  >
                    <span className="block font-label-sm text-label-sm font-semibold text-primary">12:45</span>
                    <span className="block font-body-sm text-body-sm text-on-surface truncate">
                      Q2: Outage
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setVideoTimestamp('19:30 / 28:14');
                      if (!expandedQuestions.includes(3)) setExpandedQuestions([...expandedQuestions, 3]);
                    }}
                    className="px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-left transition-colors cursor-pointer border border-surface-container"
                    type="button"
                  >
                    <span className="block font-label-sm text-label-sm font-semibold text-primary">19:30</span>
                    <span className="block font-body-sm text-body-sm text-on-surface truncate">
                      Q3: Kafka CDC
                    </span>
                  </button>
                </div>
              </div>

              {/* Download Action Bar */}
              <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-surface-container">
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `WEBVTT\n\n00:04:12.000 --> 00:06:30.000\nCandidate: We implemented deterministic idempotency tokens with Redis bloom filters.\n\n00:12:45.000 --> 00:15:10.000\nCandidate: Outage resolution via canary rollbacks.`,
                      ],
                      { type: 'text/vtt' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Interview-Transcript-${session.id}.vtt`;
                    a.click();
                  }}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  Download Full Transcript (.vtt)
                </button>
                <button
                  onClick={() => alert('Audio stream export (.m4a) initialized.')}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">audio_file</span>
                  Download Audio (.m4a)
                </button>
              </div>
            </div>

            {/* AI Simulation Authenticity Gauge Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container space-y-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-title-md text-[15px] text-on-surface font-semibold">
                  Simulation Authenticity
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  {session.simulationAuthenticity || 98.2}% Human Parity
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Adaptive dynamic follow-up prompts were generated in response to non-standard architectural
                terminology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Feedback Mechanism Section */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-xl">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left Side Feedback Prompt */}
            <div className="lg:col-span-5 space-y-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">rate_review</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                Rate Your AI Mock Interview Experience
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Help calibrate our interviewer intelligence. Your feedback fine-tunes latency, interruptions,
                follow-up depth, and rubrics for distributed systems engineering.
              </p>

              {/* Confirmation preview badge */}
              {feedbackSubmitted && (
                <div className="p-space-sm rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed-variant flex items-center gap-space-xs font-label-md text-label-md border border-secondary/30">
                  <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                  <span>Thank you! Your feedback helps calibrate future mock scenarios.</span>
                </div>
              )}
            </div>

            {/* Right Side Interactive Input Form */}
            <div className="lg:col-span-7 space-y-space-md bg-surface-container-low p-space-md rounded-2xl border border-surface-container">
              {/* 5-Star Rating Selector */}
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface font-semibold">
                    Overall Mock Realism &amp; Fairness
                  </label>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    {ratingTexts[rating - 1]}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-secondary-container">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= rating;
                    return (
                      <button
                        key={starVal}
                        onClick={() => setRating(starVal)}
                        className="text-[28px] transition-colors focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <span
                          className={`material-symbols-outlined text-[32px] ${
                            isFilled ? 'text-primary' : 'text-outline-variant'
                          }`}
                          style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Text Area */}
              <div className="space-y-space-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant font-medium block"
                  htmlFor="feedback-text"
                >
                  What felt realistic? What could our AI interviewer do better?
                </label>
                <textarea
                  id="feedback-text"
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-lowest p-space-sm text-on-surface font-body-md text-body-md border border-surface-container focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-outline resize-none leading-relaxed"
                />
              </div>

              {/* Feature Tags for Quick Feedback */}
              <div className="flex flex-wrap items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">Quick Tags:</span>
                {[
                  'Realistic Follow-ups',
                  'Great Audio Cadence',
                  'Challenging Edge Cases',
                  'Fast Processing',
                  'Helpful Rubric',
                ].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      type="button"
                      className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
                          : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-between pt-space-xs">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Submitted anonymously to R&amp;D calibration
                </span>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback || feedbackSubmitted}
                  className="inline-flex items-center gap-1.5 px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm cursor-pointer disabled:opacity-50 font-semibold"
                  type="button"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isSubmittingFeedback ? 'animate-spin' : ''}`}>
                    {feedbackSubmitted ? 'check' : 'send'}
                  </span>
                  <span>
                    {isSubmittingFeedback
                      ? 'Submitting...'
                      : feedbackSubmitted
                      ? 'Feedback Recorded'
                      : 'Submit Feedback'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drill Modal */}
      {drillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-inverse-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[22px]">exercise</span>
                <h3 className="font-title-lg text-on-surface font-bold">15-Min Focused Drill</h3>
              </div>
              <button
                onClick={() => setDrillModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              Based on your identified gap in <strong>Disaster Recovery</strong> and <strong>Executive Conciseness</strong>,
              we have formulated a rapid 15-minute 3-question drill.
            </p>
            <div className="space-y-2 text-xs text-on-surface">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-primary block font-semibold">Drill 1 (5 mins):</strong>
                "Structure a 60-second opening statement detailing cross-cloud RTO/RPO SLAs without over-explaining queue primitives."
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-primary block font-semibold">Drill 2 (5 mins):</strong>
                "Defend your choice between multi-region active-active vs active-passive under sudden fiber cut scenarios."
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDrillModalOpen(false)}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDrillModalOpen(false);
                  onRetake();
                }}
                className="px-5 py-2 rounded-full bg-tertiary text-on-tertiary font-semibold text-xs cursor-pointer"
              >
                Start Focused Drill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
