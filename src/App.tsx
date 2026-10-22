import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { InterviewSetup } from './components/InterviewSetup';
import { InterviewSession } from './components/InterviewSession';
import { EvaluationReport } from './components/EvaluationReport';
import { HistoryAnalytics } from './components/HistoryAnalytics';
import { ResumePreviewModal } from './components/ResumePreviewModal';
import { SessionReport, InterviewRigor, QuestionItem } from './types';

// High-fidelity fallback session matching the design tokens & rubric
const DEFAULT_REPORT: SessionReport = {
  id: 'IM-89241',
  role: 'Senior Distributed Systems Engineer',
  companyRef: 'Stripe JD Ref',
  rigor: 'Target Bar',
  durationMinutes: 30,
  actualDuration: '28m 14s',
  promptsAnswered: 5,
  date: 'Oct 24, 2024',
  overallScore: 87,
  verdict: 'Strong Hire • Meets Target Bar',
  percentile: 'Top 8% of Senior Distributed candidates',
  confidenceIndex: '96.4%',
  modelPasses: 4,
  speechRateWpm: 142,
  dimensions: [
    { name: 'Technical Depth & Architecture', score: 92, status: 'Exceptional' },
    { name: 'Communication & Articulation', score: 85, status: 'Strong' },
    { name: 'Problem Solving & Edge Cases', score: 88, status: 'Strong' },
    { name: 'System Design Trade-offs', score: 82, status: 'Competent' },
  ],
  answerQuality: {
    relevance: 94,
    completeness: 89,
    clarity: 91,
    conciseness: 82,
  },
  strengths: [
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
  ],
  gaps: [
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
  ],
  actionPlan: [
    {
      title: 'Tighten STAR Narrative',
      description: 'Structure behavioral narratives with sharper situation boundaries to shave 45 seconds off introductions.',
    },
    {
      title: 'Early Impact Quantification',
      description: 'Quantify operational business impact (e.g., peak TPS sustained, cloud egress cost reductions) within the first 60 seconds.',
    },
  ],
  questions: [
    {
      id: 1,
      topic: 'Payment Idempotency',
      category: 'System Design',
      score: 9.4,
      question:
        'Walk me through how you handled idempotency and cache invalidation in your high-throughput payment service at Stripe.',
      timestamp: '02:40',
      candidateExcerpt:
        '...We adopted a deterministic client-generated UUID as an idempotency key, persisting state in Redis with a short TTL while recording a transaction lease record in Postgres...',
      aiRationale:
        'Outstanding trade-off discussion on two-phase commits vs saga patterns under partitioned network topologies.',
      modelUpgrade:
        'Consider explicitly stating your storage lease duration algorithm and distributed lock renewal strategy before being asked.',
    },
    {
      id: 2,
      topic: 'Architecture Conflict',
      category: 'Behavioral',
      score: 8.2,
      question:
        'Describe a situation where a disagreement on architecture delayed a major milestone. How did you resolve it?',
      timestamp: '11:15',
      candidateExcerpt:
        '...The data team advocated for a Kafka streaming pipeline while the product engineering lead preferred asynchronous HTTP webhooks. I organized a 48-hour spike...',
      aiRationale:
        'Strong demonstration of leadership and data-driven conflict resolution without ego.',
      modelUpgrade:
        'Could highlight the stakeholder communication cadence to executive leadership during the 48-hour evaluation phase.',
    },
    {
      id: 3,
      topic: 'Outbox Migration',
      category: 'Deep Architecture',
      score: 9.0,
      question:
        'How would you migrate a synchronous billing monolith to an event-driven queue while guaranteeing zero message loss and duplicate protection?',
      timestamp: '19:30',
      candidateExcerpt:
        '...Utilized the Outbox pattern with Debezium CDC capturing database write-ahead logs. Published events directly into Kafka topics with strictly enforced Avro schema registries...',
      aiRationale:
        'Exemplary grasp of transactional outbox and zero dual-write guarantees.',
      modelUpgrade:
        'To elevate to Principal Engineer, elaborate on idempotent consumer dead-letter triage and distributed tracing correlation keys.',
    },
  ],
  transcript: [
    {
      time: '00:04',
      speaker: 'AI Interviewer',
      role: 'interviewer',
      text: 'Good morning, Alex. Thank you for making time today. I’ve reviewed your background at Stripe with high-scale payment pipelines. Today we’re going to focus on distributed consistency and production resilience.',
    },
    {
      time: '00:32',
      speaker: 'Alex Chen',
      role: 'candidate',
      text: 'Hi Dr. Mitchell, great to be here. Looking forward to diving into the architecture and trade-offs.',
    },
    {
      time: '00:48',
      speaker: 'AI Interviewer',
      role: 'interviewer',
      text: 'Let’s start with idempotency. Walk me through how you handled idempotency and cache invalidation in your high-throughput payment service at Stripe.',
    },
    {
      time: '01:10',
      speaker: 'Alex Chen',
      role: 'candidate',
      text: 'In our payment processing cluster, idempotency was safety-critical. We implemented a two-tier idempotency system: an edge-layer deduplication cache backed by Redis clusters with sliding-window keys, followed by a persistent lease transaction record written directly to PostgreSQL within the primary ledger.',
    },
    {
      time: '04:15',
      speaker: 'AI Interviewer',
      role: 'interviewer',
      text: 'You mentioned designing an idempotent API for payment transactions. How did you ensure consistent state across multi-region datacenters during transient network partitions without degrading p99 latency?',
    },
    {
      time: '05:02',
      speaker: 'Alex Chen',
      role: 'candidate',
      text: 'That was the central challenge. Rather than full synchronous cross-region consensus on every single auth request which would blow out p99 past 400ms, we partitioned write ownership geographically using hash rings with bounded consensus.',
    },
  ],
  simulationAuthenticity: 98.4,
};

export default function App() {
  const [currentView, setCurrentView] = useState<string>('overview');
  const [sessions, setSessions] = useState<SessionReport[]>([DEFAULT_REPORT]);
  const [activeReport, setActiveReport] = useState<SessionReport>(DEFAULT_REPORT);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [activeResumeFileName, setActiveResumeFileName] = useState('Alex_Chen_Staff_SWE_Resume.pdf');
  const [activeResumeSummary, setActiveResumeSummary] = useState(
    'Parsed: 8 YOE, Distributed Systems, Python/Go, Cloud Architecture'
  );

  // Active configuration for launching a session
  const [activeSessionConfig, setActiveSessionConfig] = useState<{
    role: string;
    durationMinutes: number;
    rigor: InterviewRigor;
    questions: QuestionItem[];
    jobDescription: string;
    resumeFileName: string;
    resumeSummary: string;
  }>({
    role: 'Senior Distributed Systems Engineer',
    durationMinutes: 30,
    rigor: 'Target Bar',
    questions: [],
    jobDescription: `Senior Backend Engineer - Infrastructure & Distributed Systems at Stripe.
Responsibilities:
- Design and scale resilient payment pipelines processing tens of thousands of requests per second.
- Optimize p99 latencies across critical financial state machines and datastores.
- Lead architectural reviews, mentor engineers, and champion high-reliability software practices.`,
    resumeFileName: 'Alex_Chen_Staff_SWE_Resume.pdf',
    resumeSummary: 'Parsed: 8 YOE, Distributed Systems, Python/Go, Cloud Architecture',
  });

  // Fetch initial stored sessions from backend
  useEffect(() => {
    fetch('/api/sessions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
      })
      .then((data) => {
        if (data.sessions && data.sessions.length > 0) {
          setSessions(data.sessions);
          setActiveReport(data.sessions[0]);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback sessions:', err);
      });
  }, []);

  // Handle Start Session from Setup
  const handleStartSession = (config: {
    role: string;
    durationMinutes: number;
    rigor: InterviewRigor;
    questions: QuestionItem[];
    jobDescription: string;
    resumeFileName: string;
    resumeSummary: string;
  }) => {
    setActiveSessionConfig(config);
    setActiveResumeFileName(config.resumeFileName);
    setActiveResumeSummary(config.resumeSummary);
    setCurrentView('interview-session');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Finished Interview
  const handleFinishInterview = (report: SessionReport) => {
    setActiveReport(report);
    setSessions((prev) => [report, ...prev.filter((s) => s.id !== report.id)]);
    setCurrentView('evaluation-report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle selecting past session from History
  const handleSelectHistorySession = (session: SessionReport) => {
    setActiveReport(session);
    setCurrentView('evaluation-report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // General Navigation handler
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body antialiased selection:bg-primary-fixed selection:text-on-primary-fixed-variant">
      {/* Global Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        aiEngineStatus={
          currentView === 'interview-session'
            ? 'Live Audio Stream Active'
            : currentView === 'evaluation-report'
            ? 'Evaluation Calibrated'
            : 'AI Engine Ready'
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 flex flex-col">
        {currentView === 'overview' && (
          <LandingPage
            onStartInterview={() => handleNavigate('new-interview')}
            onExploreAnalytics={() => handleNavigate('history-and-analytics')}
          />
        )}

        {currentView === 'new-interview' && (
          <InterviewSetup
            onStartSession={handleStartSession}
            onPreviewResume={() => setIsResumePreviewOpen(true)}
          />
        )}

        {currentView === 'interview-session' && (
          <InterviewSession
            role={activeSessionConfig.role}
            durationMinutes={activeSessionConfig.durationMinutes}
            rigor={activeSessionConfig.rigor}
            questions={activeSessionConfig.questions}
            jobDescription={activeSessionConfig.jobDescription}
            resumeSummary={activeSessionConfig.resumeSummary}
            onFinishInterview={handleFinishInterview}
            onExit={() => handleNavigate('overview')}
          />
        )}

        {currentView === 'evaluation-report' && (
          <EvaluationReport
            session={activeReport}
            onRetake={() => handleNavigate('new-interview')}
            onViewHistory={() => handleNavigate('history-and-analytics')}
          />
        )}

        {currentView === 'history-and-analytics' && (
          <HistoryAnalytics
            sessions={sessions}
            onSelectSession={handleSelectHistorySession}
            onStartNewMock={() => handleNavigate('new-interview')}
          />
        )}
      </main>

      {/* Footer rendered on non-live session pages */}
      {currentView !== 'interview-session' && <Footer />}

      {/* Parsed Resume Modal */}
      <ResumePreviewModal
        isOpen={isResumePreviewOpen}
        onClose={() => setIsResumePreviewOpen(false)}
        fileName={activeResumeFileName}
        summary={activeResumeSummary}
      />
    </div>
  );
}
