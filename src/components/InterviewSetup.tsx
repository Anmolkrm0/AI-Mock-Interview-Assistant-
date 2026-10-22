import React, { useState } from 'react';
import { InterviewRigor, QuestionItem } from '../types';

interface InterviewSetupProps {
  onStartSession: (config: {
    role: string;
    durationMinutes: number;
    rigor: InterviewRigor;
    questions: QuestionItem[];
    jobDescription: string;
    resumeFileName: string;
    resumeSummary: string;
  }) => void;
  onPreviewResume: () => void;
}

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  onStartSession,
  onPreviewResume,
}) => {
  const [resumeFileName, setResumeFileName] = useState('Alex_Chen_Staff_SWE_Resume.pdf');
  const [resumeSummary, setResumeSummary] = useState(
    'Parsed: 8 YOE, Distributed Systems, Python/Go, Cloud Architecture'
  );
  const [jdTab, setJdTab] = useState<'paste' | 'upload'>('paste');
  const [jobDescription, setJobDescription] = useState(
    `Senior Backend Engineer - Infrastructure & Distributed Systems at Stripe.
Responsibilities:
- Design and scale resilient payment pipelines processing tens of thousands of requests per second.
- Optimize p99 latencies across critical financial state machines and datastores.
- Lead architectural reviews, mentor engineers, and champion high-reliability software practices.`
  );

  const [availableRoles, setAvailableRoles] = useState([
    'Senior Distributed Systems Engineer',
    'Backend Platform Architect',
    'Site Reliability Tech Lead',
  ]);
  const [selectedRole, setSelectedRole] = useState('Senior Distributed Systems Engineer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);

  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [rigor, setRigor] = useState<InterviewRigor>('Target Bar');

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 1,
      topic: 'Deep System Architecture',
      category: 'System Design',
      question:
        'Walk me through how you handled idempotency and cache invalidation in your high-throughput payment service at Stripe.',
      rubricFocus: 'CAP Theorem & Replication',
      benchmark: 'L6 Staff Bar',
    },
    {
      id: 2,
      topic: 'Leadership & Conflict',
      category: 'Behavioral',
      question:
        'Describe a situation where a disagreement on architecture delayed a major milestone. How did you resolve it?',
      rubricFocus: 'Cross-functional Alignment',
      benchmark: 'Staff Leadership',
    },
    {
      id: 3,
      topic: 'Scale & Resilience',
      category: 'Technical',
      question:
        'You mentioned designing an idempotent API for payment transactions. How did you ensure consistent state across multi-region datacenters during transient network partitions without degrading p99 latency?',
      rubricFocus: 'Partition Tolerance & Tail Latencies',
      benchmark: 'Tier-1 SWE Bar',
    },
    {
      id: 4,
      topic: 'Crisis Response',
      category: 'Behavioral',
      question:
        'Tell me about a high-pressure production outage you led resolution on. How did you triage root cause while keeping executive stakeholders informed?',
      rubricFocus: 'Incident Response Protocol',
      benchmark: 'Operational Grit',
    },
    {
      id: 5,
      topic: 'Distributed Consensus',
      category: 'Technical',
      question:
        'How would you migrate a synchronous billing monolith to an event-driven queue while guaranteeing zero message loss and duplicate protection?',
      rubricFocus: 'Outbox Pattern & CDC',
      benchmark: 'Staff Architecture',
    },
  ]);

  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false);
  const [isParsingJD, setIsParsingJD] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);

  // Re-generate or synthesize questions dynamically with server Gemini
  const handleRegenerateQuestions = async () => {
    setIsRegeneratingQuestions(true);
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          durationMinutes,
          rigor,
          candidateSummary: resumeSummary,
          jobDescription,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error('Failed to regenerate questions:', err);
    } finally {
      setIsRegeneratingQuestions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      setResumeSummary(`Uploaded document: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB) - Parsed.`);
    }
  };

  const handleStart = () => {
    onStartSession({
      role: selectedRole,
      durationMinutes,
      rigor,
      questions,
      jobDescription,
      resumeFileName,
      resumeSummary,
    });
  };

  const addCustomRole = () => {
    if (customRoleInput.trim() && !availableRoles.includes(customRoleInput.trim())) {
      const newRole = customRoleInput.trim();
      setAvailableRoles([...availableRoles, newRole]);
      setSelectedRole(newRole);
      setCustomRoleInput('');
      setIsAddingCustomRole(false);
    }
  };

  return (
    <div className="w-full bg-surface min-h-screen pb-space-xl">
      {/* Subtle ambient blur accents */}
      <div className="relative w-full max-w-7xl mx-auto px-gutter py-space-lg">
        <div className="absolute -top-10 right-10 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-4 w-72 h-72 bg-secondary-fixed/20 rounded-full blur-2xl pointer-events-none -z-10" />

        {/* Breadcrumb & Header */}
        <section className="flex flex-col gap-space-xs mb-space-xl">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
            <span className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Home
            </span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold">Configure New Mock Interview</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Calibration &amp; Setup
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1 font-bold">
                Set Up Your AI Mock Interview
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                Upload your materials and choose your interview parameters. Our AI will formulate tailored questions
                and calibration benchmarks.
              </p>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-full self-start md:self-auto border border-surface-container">
              <span className="flex h-2.5 w-2.5 rounded-full bg-secondary" />
              <span className="font-label-md text-label-md text-on-surface font-medium">
                Model: Calibrated to Tier-1 Tech Bar
              </span>
            </div>
          </div>
        </section>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Card 1: Resume & Experience Upload */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Resume &amp; Experience
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      AI synthesizes your historical scope and achievements
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Parsed
                </span>
              </div>

              {/* Uploaded File Pill / Row */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container">
                <div className="flex items-start gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-title-md text-body-md text-on-surface font-semibold">
                        {resumeFileName}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">1.4 MB</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        {resumeSummary}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs shrink-0 self-end sm:self-center">
                  <button
                    onClick={onPreviewResume}
                    className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                    title="Preview Resume Document"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <label className="px-space-md py-1.5 rounded-full bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>Replace</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Security info */}
              <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                  End-to-end encrypted; automatically deleted post-session.
                </span>
                <label className="text-primary hover:underline font-label-md text-label-md cursor-pointer">
                  Upload Additional Addendum
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* Card 2: Target Job Description */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-[20px]">work</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Target Job Description
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Define role expectations for dynamic question generation
                    </p>
                  </div>
                </div>

                {/* Segmented Tab */}
                <div className="inline-flex p-1 rounded-full bg-surface-container-low shrink-0 self-start sm:self-auto border border-surface-container">
                  <button
                    onClick={() => setJdTab('paste')}
                    className={`px-space-md py-1 rounded-full font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                      jdTab === 'paste'
                        ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    Paste Text
                  </button>
                  <label
                    className={`px-space-md py-1 rounded-full font-label-sm text-label-sm font-semibold transition-all cursor-pointer ${
                      jdTab === 'upload'
                        ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Upload Doc
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setJdTab('upload');
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (typeof event.target?.result === 'string') {
                              setJobDescription(event.target.result);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-medium">
                  Role Requirements &amp; Context
                </label>
                <textarea
                  className="w-full rounded-xl p-space-md font-body-md text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all resize-none leading-relaxed border border-surface-container"
                  rows={5}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-1 text-secondary font-medium">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    Role parsed successfully (98% confidence score)
                  </span>
                  <span>{jobDescription.split(/\s+/).filter(Boolean).length} words extracted</span>
                </div>
              </div>

              {/* Auto-Extraction Results Banner & Filter Chips */}
              <div className="mt-space-lg bg-surface-container-low rounded-xl p-space-md border border-surface-container">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium block">
                    Detected Role Calibration Targets:
                  </span>
                  <button
                    onClick={() => setIsAddingCustomRole(!isAddingCustomRole)}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add Custom Role
                  </button>
                </div>

                {isAddingCustomRole && (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="e.g. Lead Machine Learning Engineer"
                      className="bg-surface-container-lowest px-3 py-1.5 rounded-full text-xs text-on-surface flex-1 border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomRole()}
                    />
                    <button
                      onClick={addCustomRole}
                      className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-space-xs">
                  {availableRoles.map((r) => {
                    const isSelected = selectedRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setSelectedRole(r)}
                        className={`inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold shadow-xs ring-1 ring-primary/40'
                            : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                        }`}
                        type="button"
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        )}
                        <span>{r}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Curated Question Pipeline Preview */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-title-md text-title-md text-on-surface font-bold">
                        Curated Question Pipeline
                      </h2>
                      <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                        {questions.length} Ready
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Dynamically synthesized based on Alex's background &amp; Stripe JD
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRegenerateQuestions}
                  disabled={isRegeneratingQuestions}
                  className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-transform cursor-pointer active:rotate-180 disabled:opacity-50"
                  title="Regenerate question batch"
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isRegeneratingQuestions ? 'animate-spin text-primary' : ''
                    }`}
                  >
                    refresh
                  </span>
                </button>
              </div>

              {/* Questions Stream */}
              <div className="flex flex-col gap-space-sm">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="bg-surface-container-low hover:bg-surface-container rounded-xl p-space-md transition-colors border border-surface-container"
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex items-start gap-space-sm">
                        <span className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-label-md text-label-md font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <span
                            className={`font-label-sm text-label-sm font-semibold uppercase tracking-wider block mb-0.5 ${
                              q.category === 'System Design'
                                ? 'text-primary'
                                : q.category === 'Behavioral'
                                ? 'text-tertiary'
                                : 'text-secondary'
                            }`}
                          >
                            {q.topic}
                          </span>
                          <p className="font-title-md text-body-md text-on-surface leading-snug">
                            "{q.question}"
                          </p>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm px-2 py-1 rounded bg-surface-container-highest text-on-surface-variant shrink-0 font-medium">
                        {q.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rubric Link & adaptive info */}
              <div className="mt-space-md flex items-center justify-between text-on-surface-variant font-label-md text-label-md">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">tune</span>
                  Adaptive probing enabled during live speech
                </span>
                <button
                  onClick={() => setShowRubricModal(true)}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                  type="button"
                >
                  View Rubric Benchmarks
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg lg:sticky lg:top-20">
            {/* Card 4: Interview Duration Settings */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">timer</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Interview Duration
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Calibrate session depth &amp; question volume
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration Grid (10, 20, 30, 45) */}
              <div className="grid grid-cols-2 gap-space-sm">
                {[
                  { mins: 10, label: 'Speed Screen', desc: '3 Rapid Questions' },
                  { mins: 20, label: 'Core Competency', desc: '5 Targeted Questions' },
                  { mins: 30, label: 'Standard Round', desc: '7 Questions (Design + Soft)' },
                  { mins: 45, label: 'Deep Dive', desc: 'Full Onsite Simulation' },
                ].map((dur) => {
                  const isSelected = durationMinutes === dur.mins;
                  return (
                    <button
                      key={dur.mins}
                      onClick={() => setDurationMinutes(dur.mins)}
                      type="button"
                      className={`p-space-md rounded-xl text-left transition-all relative overflow-hidden cursor-pointer border ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed-variant border-primary/40 shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                      )}
                      <span className="font-headline-md text-headline-md block font-bold">
                        {dur.mins} min
                      </span>
                      <span
                        className={`font-label-md text-label-md font-semibold block mt-1 ${
                          isSelected ? 'text-on-primary-fixed-variant' : 'text-primary'
                        }`}
                      >
                        {dur.label}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">
                        {dur.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 5: Evaluation Rigor Mode */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">equalizer</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Evaluation Rigor
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Controls AI follow-up persistence and grading severity
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {/* Standard */}
                <div
                  onClick={() => setRigor('Standard')}
                  className={`p-space-md rounded-xl transition-all cursor-pointer flex items-start gap-space-sm border ${
                    rigor === 'Standard'
                      ? 'bg-surface-container-high border-primary/30 shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container border-surface-container'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                      rigor === 'Standard'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-title-md text-body-md text-on-surface font-semibold">
                        Standard Practice
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Warm-up</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Balanced interview covering core fundamentals and role responsibilities. Encouraging
                      feedback without hostile edge cases.
                    </p>
                  </div>
                </div>

                {/* Target Bar */}
                <div
                  onClick={() => setRigor('Target Bar')}
                  className={`p-space-md rounded-xl transition-all cursor-pointer flex items-start gap-space-sm relative border ${
                    rigor === 'Target Bar'
                      ? 'bg-surface-container-high border-primary/50 shadow-xs ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container border-surface-container'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                      rigor === 'Target Bar'
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-body-md text-primary font-bold">Target Bar</span>
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant font-semibold">
                          Recommended
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Tier-1 SWE</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface mt-1 leading-relaxed">
                      Assesses whether the candidate meets strict hiring bars at top-tier tech organizations
                      with deep probing on technical trade-offs.
                    </p>
                  </div>
                </div>

                {/* Stress Test */}
                <div
                  onClick={() => setRigor('Stress Test')}
                  className={`p-space-md rounded-xl transition-all cursor-pointer flex items-start gap-space-sm border ${
                    rigor === 'Stress Test'
                      ? 'bg-surface-container-high border-error/40 shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container border-surface-container'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                      rigor === 'Stress Test'
                        ? 'bg-error text-on-error'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">done</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-body-md text-on-surface font-semibold">
                          Stress Test
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container font-semibold">
                          High Pressure
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Extreme Bar</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Rapid-fire interruptions, ambiguous parameters, and intentional counter-arguments to test
                      composure and adaptability.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Summary & Launch Card */}
            <div className="bg-gradient-to-br from-surface-container to-surface-container-low rounded-2xl p-space-lg shadow-md border border-surface-container-high flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                  Session Overview
                </span>
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  All Checkpoints Cleared
                </span>
              </div>

              {/* Configuration Pills Summary */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-xs border border-surface-container">
                  <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                  <span>
                    Role: <strong className="font-semibold">{selectedRole}</strong>
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-xs border border-surface-container">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  <span>
                    Duration: <strong className="font-semibold">{durationMinutes} Mins</strong>
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-xs border border-surface-container">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">military_tech</span>
                  <span>
                    Rigor: <strong className="font-semibold">{rigor}</strong>
                  </span>
                </div>
              </div>

              {/* Launch Button */}
              <div className="flex flex-col gap-space-xs mt-space-xs">
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 px-space-lg rounded-full bg-primary text-on-primary font-title-md text-title-md font-semibold hover:bg-primary-container hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center cursor-pointer shadow-md active:scale-95"
                >
                  <span>Start Interview</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-on-surface-variant font-body-sm text-body-sm text-center pt-1">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">videocam</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">mic</span>
                  <span>Camera &amp; microphone permissions will be verified in the next step.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Benchmarks Modal */}
      {showRubricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-inverse-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">rule</span>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Tier-1 Hiring Rubric Benchmarks
                </h3>
              </div>
              <button
                onClick={() => setShowRubricModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-sm text-on-surface-variant max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-on-surface block font-semibold mb-1">
                  1. Technical Depth & Architecture (40%)
                </strong>
                Demonstrates deep command of distributed protocols, storage engine mechanics, consensus cycles, and
                cache coherency.
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-on-surface block font-semibold mb-1">
                  2. System Design Trade-offs (25%)
                </strong>
                Weighs consistency vs availability, latency vs throughput, and financial cost vs horizontal elasticity.
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-on-surface block font-semibold mb-1">
                  3. Problem Solving & Edge Cases (20%)
                </strong>
                Identifies split-brain scenarios, transient network partitions, poison pill payloads, and downstream
                cascading failures.
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
                <strong className="text-on-surface block font-semibold mb-1">
                  4. Communication & Executive Articulation (15%)
                </strong>
                Clear STAR framework, quantified business outcomes within the first 60 seconds, and zero meandering.
              </div>
            </div>

            <div className="flex justify-end pt-space-xs">
              <button
                onClick={() => setShowRubricModal(false)}
                className="px-space-lg py-2 rounded-full bg-primary text-on-primary font-semibold text-sm cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
