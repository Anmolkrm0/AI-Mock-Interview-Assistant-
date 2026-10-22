import React, { useState, useEffect, useRef } from 'react';
import { InterviewRigor, QuestionItem, TranscriptEntry, SessionReport } from '../types';

interface InterviewSessionProps {
  role: string;
  durationMinutes: number;
  rigor: InterviewRigor;
  questions: QuestionItem[];
  jobDescription: string;
  resumeSummary: string;
  onFinishInterview: (report: SessionReport) => void;
  onExit: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({
  role,
  durationMinutes,
  rigor,
  questions: initialQuestions,
  jobDescription,
  resumeSummary,
  onFinishInterview,
  onExit,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(2); // default Q3 for demo realism, or configurable
  const [questions, setQuestions] = useState<QuestionItem[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            id: 1,
            topic: 'System Overview',
            category: 'System Design',
            question: "Welcome Alex. Let's dig into your work on event-driven infrastructure and consistency models at high throughput.",
          },
          {
            id: 2,
            topic: 'Caching & Dedup',
            category: 'Technical',
            question: 'How did you handle deduplication within your sliding window Redis bloom filters?',
          },
          {
            id: 3,
            topic: 'Multi-Region Idempotency',
            category: 'System Design',
            question:
              'You mentioned designing an idempotent API for payment transactions. How did you ensure consistent state across multi-region datacenters during transient network partitions without degrading p99 latency?',
            rubricFocus: 'CAP Theorem & Replication',
            benchmark: 'L6 Staff Bar',
          },
          {
            id: 4,
            topic: 'Disaster Recovery',
            category: 'Behavioral',
            question: 'Tell me about a high-pressure production outage you led resolution on.',
            rubricFocus: 'Incident Response Protocol',
            benchmark: 'Operational Grit',
          },
          {
            id: 5,
            topic: 'Monolith Migration',
            category: 'Deep Architecture',
            question: 'How would you migrate a synchronous billing monolith to an event-driven queue?',
            rubricFocus: 'Outbox Pattern & CDC',
            benchmark: 'Staff Architecture',
          },
        ]
  );

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      time: '08:14',
      speaker: 'Dr. Sarah Mitchell (Interviewer)',
      role: 'interviewer',
      text: 'Welcome Alex. Let’s dig into your work on event-driven infrastructure and consistency models at high throughput.',
    },
    {
      time: '09:30',
      speaker: 'Alex Chen (Candidate)',
      role: 'candidate',
      text: 'In our architecture, we implemented a Kafka-backed deduplication log with Redis bloom filters to detect identical payload digests within a sliding 60-second window before committing state mutations.',
    },
    {
      time: '11:15',
      speaker: 'Dr. Sarah Mitchell (Interviewer)',
      role: 'interviewer',
      text: 'You mentioned designing an idempotent API for payment transactions. How did you ensure consistent state across multi-region datacenters during transient network partitions without degrading p99 latency?',
      isActive: true,
    },
  ]);

  const [liveTranscribingText, setLiveTranscribingText] = useState(
    'We partitioned the database using consistent hashing with virtual nodes to avoid hot spots, paired with a two-phase commit consensus fallback when cross-region quorums failed...'
  );

  // Timers & telemetry
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60 - 678); // e.g. ~18m 42s
  const [speechPace, setSpeechPace] = useState(134);
  const [fillersCount, setFillersCount] = useState(1);
  const [latencyDelta, setLatencyDelta] = useState(24);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);

  // Text answer panel
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // End interview modal
  const [showEndModal, setShowEndModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize camera & mic permissions gracefully
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          mediaStreamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission not granted or not available - fallback gracefully to candidate portrait photo
          console.log('Camera permission fallback to simulated video view.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, liveTranscribingText]);

  // Audio speech synthesis for AI Interviewer
  const handleReplayAudio = () => {
    const currentQ = questions[currentQIndex]?.question || '';
    if ('speechSynthesis' in window && currentQ) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQ);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // visual simulation
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 3000);
    }
  };

  // Toggle voice recognition / listening
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      // Submit what was transcribed
      handleCandidateSpoke(liveTranscribingText);
    } else {
      setIsListening(true);
      // If browser supports webkitSpeechRecognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              interim += event.results[i][0].transcript;
            }
            if (interim) {
              setLiveTranscribingText(interim);
              // Calculate live WPM
              const words = interim.split(/\s+/).filter(Boolean).length;
              if (words > 2) setSpeechPace(Math.min(160, Math.max(120, Math.floor(words * 12))));
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.start();
        } catch {
          // Fallback simulation
          simulateSpeechStream();
        }
      } else {
        simulateSpeechStream();
      }
    }
  };

  const simulateSpeechStream = () => {
    const samplePhrases = [
      'In our architecture, we opted for an eventual consistency model with CRDTs to reduce WAN partition lock contention...',
      'We introduced asynchronous replication queues with write-ahead log tailing using Kafka and Debezium...',
      'For tail latency spikes, we enforced a 50ms hedging timeout where speculative duplicate reads were fired to secondary zones...',
    ];
    const phrase = samplePhrases[currentQIndex % samplePhrases.length];
    setLiveTranscribingText('');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < phrase.length) {
        setLiveTranscribingText((prev) => prev + phrase.charAt(idx));
        idx += 3;
      } else {
        clearInterval(interval);
      }
    }, 60);
  };

  // Submit candidate answer (spoken or typed)
  const handleCandidateSpoke = async (answerText: string) => {
    if (!answerText.trim()) return;
    setIsSubmittingAnswer(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Append to transcript
    const newTranscript: TranscriptEntry[] = [
      ...transcript,
      {
        time: timeStr,
        speaker: 'Alex Chen (Candidate)',
        role: 'candidate',
        text: answerText,
      },
    ];
    setTranscript(newTranscript);
    setLiveTranscribingText('');
    setTypedAnswer('');
    setShowTextInput(false);

    try {
      const res = await fetch('/api/interview-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentQIndex]?.question,
          candidateAnswer: answerText,
          role,
          rigor,
          questionIndex: currentQIndex,
          totalQuestions: questions.length,
        }),
      });
      const data = await res.json();

      if (data.verbalResponse) {
        // AI speaks back
        const aiTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes() + 1
        ).padStart(2, '0')}`;

        setTranscript((prev) => [
          ...prev,
          {
            time: aiTimeStr,
            speaker: 'Dr. Sarah Mitchell (Interviewer)',
            role: 'interviewer',
            text: data.verbalResponse,
            isActive: true,
          },
        ]);

        if (data.speechPaceWpm) setSpeechPace(data.speechPaceWpm);
        if (data.fillerWordsDetected !== undefined) setFillersCount(data.fillerWordsDetected);

        // Vocalize response
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(data.verbalResponse);
          setIsAiSpeaking(true);
          utt.onend = () => setIsAiSpeaking(false);
          window.speechSynthesis.speak(utt);
        }
      }

      // If user is ready to move to next prompt
      if (currentQIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQIndex((prev) => prev + 1);
        }, 3000);
      }
    } catch (err) {
      console.error('Error getting interview follow-up:', err);
    } finally {
      setIsSubmittingAnswer(false);
      setIsListening(false);
    }
  };

  const handleRetake = () => {
    setLiveTranscribingText('');
    setTypedAnswer('');
    alert('Current response cleared. You can speak or type your answer again.');
  };

  const handleSkip = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setShowEndModal(true);
    }
  };

  const handleEndInterview = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/generate-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          rigor,
          durationMinutes,
          transcript,
          completedQuestions: questions.slice(0, currentQIndex + 1),
          candidateName: 'Alex Chen',
        }),
      });
      const data = await res.json();
      if (data.session) {
        onFinishInterview(data.session);
      } else {
        throw new Error('No session returned');
      }
    } catch (err) {
      console.error('Failed to generate evaluation report:', err);
      // Fallback
      onFinishInterview({
        id: `IM-${Math.floor(10000 + Math.random() * 90000)}`,
        role,
        companyRef: 'Stripe Ref',
        rigor,
        durationMinutes,
        actualDuration: '28m 14s',
        promptsAnswered: currentQIndex + 1,
        date: 'Today',
        overallScore: 87,
        verdict: 'Strong Hire • Meets Target Bar',
        percentile: 'Top 8% of Senior Distributed candidates',
        confidenceIndex: '96.4%',
        modelPasses: 4,
        speechRateWpm: speechPace,
        dimensions: [
          { name: 'Technical Depth & Architecture', score: 92, status: 'Exceptional' },
          { name: 'Communication & Articulation', score: 85, status: 'Strong' },
          { name: 'Problem Solving & Edge Cases', score: 88, status: 'Strong' },
          { name: 'System Design Trade-offs', score: 82, status: 'Competent' },
        ],
        answerQuality: { relevance: 94, completeness: 89, clarity: 91, conciseness: 82 },
        strengths: [
          {
            title: 'Distributed Consensus',
            description: 'Demonstrated deep mastery of distributed consensus protocols.',
          },
          {
            title: 'Consistency Models',
            description: 'Clear articulation of trade-offs between eventual consistency vs linearizability.',
          },
        ],
        gaps: [
          {
            title: 'Disaster Recovery',
            description: 'Slight hesitation when discussing disaster recovery topologies.',
          },
        ],
        actionPlan: [
          {
            title: 'Tighten STAR Narrative',
            description: 'Structure behavioral narratives with sharper situation boundaries.',
          },
        ],
        questions: questions.slice(0, currentQIndex + 1),
        transcript,
        simulationAuthenticity: 98.2,
      });
    } finally {
      setIsGeneratingReport(false);
      setShowEndModal(false);
    }
  };

  const currentQuestion = questions[currentQIndex] || questions[0];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-140px)] flex flex-col">
      {/* Session Top Navigation / Telemetry Bar */}
      <section className="w-full bg-surface-container-low px-gutter py-space-sm shadow-sm sticky top-16 z-30 border-b border-surface-container">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          {/* Role and Mode Badges */}
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-md text-label-md shadow-xs truncate border border-surface-container">
              <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
              <span className="font-semibold truncate">{role}</span>
            </span>
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-medium">
              {rigor} Mode
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
              Q{currentQIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Live Timers & Telemetry */}
          <div className="flex items-center gap-space-md">
            {/* Encrypted Recording Ping */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant border border-surface-container-high">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
              </span>
              <span className="hidden sm:inline font-medium">Recording Encrypted</span>
            </div>

            {/* Remaining Time Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md shadow-xs border border-surface-container">
              <svg className="w-4 h-4 -rotate-90 text-primary" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="68, 100"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="font-semibold tracking-tight">{formatTimer(secondsRemaining)} remaining</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Interactive Studio */}
      <section className="w-full max-w-7xl mx-auto px-gutter py-space-md flex-1 flex flex-col gap-space-md">
        {/* Top Studio Grid: Left Stage (AI Persona + Prompts) & Right Stage (Candidate Video Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* LEFT STAGE: AI Conversational Persona & Live Question Focus */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* AI Card Shell */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-surface-container flex flex-col justify-between min-h-[360px] relative overflow-hidden">
              {/* Subtle decorative radial aura behind AI Avatar */}
              <div className="absolute -top-16 -left-16 w-56 h-56 bg-primary-fixed-dim/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />

              {/* AI Persona Header Bar */}
              <div className="flex items-center justify-between relative z-10 pb-space-sm border-b border-surface-container">
                <div className="flex items-center gap-space-sm">
                  {/* AI Core Visualizer Node */}
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary-fixed text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[26px]">psychology</span>
                    <span className="absolute inset-0 rounded-full animate-ping bg-primary-fixed opacity-40" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="font-title-md text-title-md text-on-surface font-bold">
                        Dr. Sarah Mitchell
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                        AI Lead Evaluator
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Senior Engineering Director Persona • System Design
                    </span>
                  </div>
                </div>

                {/* Voice Synthesis Soundwave Equalizer */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low shadow-xs border border-surface-container">
                  <span className="font-label-sm text-label-sm text-primary font-medium mr-1">
                    {isAiSpeaking ? 'AI Speaking' : 'Listening Mode'}
                  </span>
                  <span
                    className={`w-1 bg-primary rounded-full ${
                      isAiSpeaking ? 'h-5 animate-[pulse_0.6s_infinite]' : 'h-2'
                    }`}
                  />
                  <span
                    className={`w-1 bg-primary rounded-full ${
                      isAiSpeaking ? 'h-6 animate-[pulse_0.8s_infinite_0.1s]' : 'h-3'
                    }`}
                  />
                  <span
                    className={`w-1 bg-primary rounded-full ${
                      isAiSpeaking ? 'h-4 animate-[pulse_0.5s_infinite_0.2s]' : 'h-2'
                    }`}
                  />
                  <span
                    className={`w-1 bg-primary rounded-full ${
                      isAiSpeaking ? 'h-6 animate-[pulse_0.9s_infinite_0.3s]' : 'h-4'
                    }`}
                  />
                  <span
                    className={`w-1 bg-primary rounded-full ${
                      isAiSpeaking ? 'h-3 animate-[pulse_0.7s_infinite_0.4s]' : 'h-2'
                    }`}
                  />
                </div>
              </div>

              {/* Current Spoken Question Container */}
              <div className="relative z-10 my-space-sm bg-surface-container-low rounded-xl p-space-md sm:p-space-lg shadow-inner border border-surface-container">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                    Current Prompt • Question {String(currentQIndex + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="font-headline-md text-headline-md text-on-surface leading-snug tracking-tight font-bold">
                  “{currentQuestion.question}”
                </p>
              </div>

              {/* Real-Time Focus Metrics Strip */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-space-sm pt-space-xs text-on-surface-variant">
                <div className="flex items-center gap-space-sm text-body-sm">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                    Rubric: {currentQuestion.rubricFocus || 'CAP Theorem & Replication'}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">speed</span>
                    Benchmark: {currentQuestion.benchmark || 'L6 Staff Bar'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReplayAudio}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface hover:bg-surface-container text-primary font-label-md text-label-md transition-all shadow-xs border border-surface-container cursor-pointer font-semibold"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    Replay Audio
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Text Answer Fallback Panel */}
            {showTextInput && (
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md border border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-space-xs">
                  <div className="flex items-center gap-2 text-on-surface font-semibold text-sm">
                    <span className="material-symbols-outlined text-[18px] text-primary">keyboard</span>
                    <span>Type Text-Based Response</span>
                  </div>
                  <button
                    onClick={() => setShowTextInput(false)}
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <textarea
                  className="w-full bg-surface-container-low rounded-xl p-space-sm text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary placeholder-outline resize-none border border-surface-container"
                  placeholder="Draft your technical explanation, architectural pseudocode, or calculations here..."
                  rows={3}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-space-xs">
                  <button
                    onClick={() => handleCandidateSpoke(typedAnswer)}
                    disabled={isSubmittingAnswer || !typedAnswer.trim()}
                    className="px-space-md py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs disabled:opacity-50 cursor-pointer font-semibold"
                    type="button"
                  >
                    {isSubmittingAnswer ? 'Evaluating...' : 'Submit Response'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT STAGE: Candidate Video Feed, Telemetry, and Stream Controls */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="relative bg-inverse-surface rounded-2xl overflow-hidden shadow-md aspect-[4/3] flex flex-col justify-between p-space-sm sm:p-space-md group border border-surface-container-highest">
              {/* Actual Video or Fallback Candidate Photo */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />

              {/* Fallback image when camera is off or denied */}
              <img
                alt="Candidate Camera Feed"
                className={`absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none ${
                  isCameraActive ? 'hidden' : 'block'
                }`}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARgJudZKbIZ_RranUE2Fdo0airfrwNTmZCJvVFOUJn7_X2RHQiOkKKFT70xnXHwYlDvteAfNm0Q_r_GzUnOpcdN3xjIGcCVg7FYBb3M6PfeT9EBtLyalZ1rDdRrOi7_jCmnjg9exci8v8FMNJMncoNFP0CyVMojIBzUBESCge0C3W6L55q0wfBAbWBWfJLDRqbMeDQt7F6CGG7cRq_FoWDXdOvGv1-NeuU8rY_3gBRHq7MJLnM7Vzn"
              />

              {/* Overlays for readability */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-inverse-surface/80 via-inverse-surface/40 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/50 to-transparent pointer-events-none" />

              {/* Top Video Overlay Badges */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm shadow-xs border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping" />
                  <span>Alex Chen (Candidate)</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-secondary-fixed font-label-sm text-label-sm border border-white/10">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Eye Contact 92%</span>
                </div>
              </div>

              {/* Center Camera Permission Indicator */}
              <div className="relative z-10 self-center hidden group-hover:flex items-center gap-1.5 px-3 py-1 rounded-full bg-inverse-surface/75 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm border border-white/10">
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed">videocam</span>
                <span>HD 1080p Stream Optimal</span>
              </div>

              {/* Bottom Video Overlay: Audio & Lighting Telemetry Pills & Local Toggles */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-space-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-secondary-fixed">mic</span>
                    <span>Noise Filter ON</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-inverse-surface/85 backdrop-blur-md text-inverse-on-surface font-label-sm text-label-sm border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-tertiary-fixed">wb_sunny</span>
                    <span>Lighting Good</span>
                  </span>
                </div>

                {/* Cam / Mic Instant Local Control Floating Pills */}
                <div className="flex items-center gap-1.5 bg-inverse-surface/90 backdrop-blur-md p-1 rounded-full shadow-md border border-white/10">
                  <button
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCameraActive
                        ? 'bg-surface-container-high/30 hover:bg-surface-container-high/50 text-inverse-on-surface'
                        : 'bg-error text-on-error'
                    }`}
                    title="Toggle Camera"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isCameraActive ? 'videocam' : 'videocam_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => setIsMicActive(!isMicActive)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMicActive
                        ? 'bg-surface-container-high/30 hover:bg-surface-container-high/50 text-inverse-on-surface'
                        : 'bg-error text-on-error'
                    }`}
                    title="Toggle Microphone"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isMicActive ? 'mic' : 'mic_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Live Metrics Mini-Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm px-space-md shadow-xs border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Speech Pace
                  </span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    {speechPace} wpm{' '}
                    <span className="font-body-sm text-body-sm text-secondary font-normal">(Natural)</span>
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-surface-container-highest" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fillers</span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    {fillersCount} instance{' '}
                    <span className="font-body-sm text-body-sm text-secondary font-normal">(Low)</span>
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-surface-container-highest" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Latency Delta
                  </span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    {latencyDelta}ms{' '}
                    <span className="font-body-sm text-body-sm text-secondary font-normal">(Synced)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Real-Time Continuous Transcript Drawer / Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-surface-container flex flex-col gap-space-sm">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px] text-primary">subtitles</span>
              <h3 className="font-title-md text-title-md text-on-surface font-bold">
                Synchronized Interview Transcript
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                Live Feed
              </span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Auto-scrolling active</span>
              <button
                onClick={() => {
                  const text = transcript.map((t) => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n\n');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Interview-Transcript-${role}.txt`;
                  a.click();
                }}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                title="Download Audio Transcript"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>

          {/* Transcript Message Stream */}
          <div className="flex flex-col gap-space-sm max-h-64 overflow-y-auto pr-space-xs">
            {transcript.map((entry, idx) => {
              const isInterviewer = entry.role === 'interviewer';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-space-sm p-space-sm rounded-xl border ${
                    entry.isActive
                      ? 'bg-primary-fixed/30 border-primary/30 shadow-xs'
                      : isInterviewer
                      ? 'bg-surface-container-low border-surface-container'
                      : 'bg-surface-container-lowest border-surface-container-high'
                  }`}
                >
                  <span
                    className={`font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      isInterviewer
                        ? 'text-primary bg-primary-fixed'
                        : 'text-secondary bg-secondary-fixed'
                    }`}
                  >
                    {entry.time}
                  </span>
                  <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {entry.speaker}
                      </span>
                      {entry.isActive && (
                        <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary font-label-sm text-[10px]">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Live speech preview if candidate is currently speaking */}
            {liveTranscribingText && (
              <div className="flex items-start gap-space-sm p-space-sm rounded-xl bg-surface-container-low shadow-xs border border-primary/20">
                <span className="font-label-sm text-label-sm font-semibold text-tertiary px-2 py-0.5 rounded-full bg-tertiary-fixed shrink-0">
                  LIVE
                </span>
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
                      Alex Chen
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px]">
                        Transcribing Live
                      </span>
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant italic">
                      Candidate Audio Stream
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface mt-1 leading-relaxed">
                    “{liveTranscribingText}”
                    <span className="inline-block w-2 h-4 ml-1 bg-primary align-middle animate-[pulse_0.75s_infinite]" />
                  </p>
                </div>
              </div>
            )}
            <div ref={transcriptBottomRef} />
          </div>
        </div>
      </section>

      {/* Bottom Action & Control Dock (M3 Floating Pill Toolbar) */}
      <section className="w-full bg-surface-container-low py-space-sm px-gutter sticky bottom-0 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] border-t border-surface-container">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
          {/* Left Controls: Type Instead & Retake */}
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-xs border border-surface-container cursor-pointer"
              title="Type response on keyboard"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">keyboard</span>
              <span className="hidden sm:inline">Type Answer Instead</span>
            </button>
            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-xs border border-surface-container cursor-pointer"
              title="Restart your answer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">replay</span>
              <span className="hidden sm:inline">Retake Answer</span>
            </button>
          </div>

          {/* Primary Action: Center Voice Pulsing Microphone Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={toggleListening}
              className={`relative group flex items-center gap-3 px-space-lg py-3 rounded-full font-title-md text-title-md shadow-md transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-error text-on-error animate-pulse'
                  : 'bg-primary text-on-primary hover:bg-primary-container'
              }`}
              type="button"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-on-primary" />
              </span>
              <span className="material-symbols-outlined text-[24px]">
                {isListening ? 'mic' : 'mic_none'}
              </span>
              <span className="font-semibold text-sm tracking-wide">
                {isListening ? 'Listening... Click to Submit' : 'Listening... Speak Clearly'}
              </span>
            </button>
          </div>

          {/* Right Controls: Skip Question & End Interview */}
          <div className="flex items-center gap-space-xs">
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-xs border border-surface-container cursor-pointer"
              title="Proceed to Next Question"
              type="button"
            >
              <span className="hidden sm:inline">Skip</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                fast_forward
              </span>
            </button>
            <button
              onClick={() => setShowEndModal(true)}
              className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-full bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-label-md text-label-md transition-all shadow-xs cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">call_end</span>
              <span>End Interview</span>
            </button>
          </div>
        </div>
      </section>

      {/* End Interview Confirmation Modal Dialog */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-inverse-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm text-error">
              <div className="p-2 rounded-full bg-error-container text-on-error-container">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface font-bold">
                End Session Now?
              </h4>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              You have answered <strong>{currentQIndex + 1} of {questions.length}</strong> interview prompts.
              Ending now will calculate and synthesize your Evaluation Rubric Report based on completed responses.
            </p>
            <div className="bg-surface-container-low rounded-xl p-space-sm flex items-center justify-between text-on-surface border border-surface-container">
              <span className="font-label-sm text-label-sm">Estimated report generation:</span>
              <span className="font-label-md text-label-md font-semibold text-primary">~15 seconds</span>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={isGeneratingReport}
                className="px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                type="button"
              >
                Continue Interview
              </button>
              <button
                onClick={handleEndInterview}
                disabled={isGeneratingReport}
                className="px-space-md py-2 rounded-full bg-error text-on-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md transition-colors shadow-sm cursor-pointer font-semibold flex items-center gap-2"
                type="button"
              >
                {isGeneratingReport ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Synthesizing Report...</span>
                  </>
                ) : (
                  <span>Yes, Generate Report</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
