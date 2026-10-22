"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Clock, 
  SkipForward, 
  RotateCcw, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Loader2, 
  Volume2,
  VolumeX,
  Radio,
  Award,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthToken } from "@/services/api";

interface QuestionData {
  id: string;
  sequence: number;
  text: string;
  competency: string;
  difficulty: string;
}

interface TranscriptEntry {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export default function LiveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  // Media streams
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // WebSocket and Interview State
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Session Data
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [rigor, setRigor] = useState("target_bar");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(1800);

  // Transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Text Answer Mode
  const [isTextMode, setIsTextMode] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  // Speech Synthesis & Recognition state
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const isListeningRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isTextModeRef = useRef(false);

  // Confirm End Modal
  const [showEndModal, setShowEndModal] = useState(false);

  // 1. Initialize Camera & Microphone
  useEffect(() => {
    let localStream: MediaStream | null = null;
    async function setupMedia() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err: any) {
        console.warn("Camera/Mic access denied or unavailable:", err);
      }
    }
    setupMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 2. Synchronize configuration refs
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
    if (isMicMuted) {
      stopListening();
    } else if (!isSpeakingRef.current && !isTextModeRef.current) {
      startListening();
    }
  }, [isMicMuted]);

  useEffect(() => {
    isTextModeRef.current = isTextMode;
    if (isTextMode) {
      stopListening();
    } else if (!isSpeakingRef.current && !isMicMutedRef.current) {
      startListening();
    }
  }, [isTextMode]);

  // 3. Audio Speech Synthesis (AI Interviewer Speaks Question)
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Temporarily pause recognition while interviewer speaks so computer speaker is not captured
      stopListening();

      // Clean markdown tags and asterisks from speech
      const cleanText = text.replace(/[*_#`~]/g, " ").replace(/\s+/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Karen") ||
            v.name.includes("Alex"))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferred) {
        utterance.voice = preferred;
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      utterance.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onEnd) onEnd();
        // Once interviewer finishes speaking, automatically start listening to candidate
        if (!isMicMutedRef.current && !isTextModeRef.current) {
          startListening();
        }
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onEnd) onEnd();
        if (!isMicMutedRef.current && !isTextModeRef.current) {
          startListening();
        }
      };

      // Ensure speech synthesis audio context is active
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis execution error:", err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
      if (!isMicMutedRef.current && !isTextModeRef.current) {
        startListening();
      }
    }
  };

  // 4. Real-time Speech-to-Text Recognition (Transcribes Candidate's Voice Live)
  const startListening = () => {
    if (!recognitionRef.current || isSpeakingRef.current || isMicMutedRef.current || isTextModeRef.current) {
      return;
    }
    try {
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Recognition may already be running
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // 5. Initialize Speech Recognition & Voices
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript + " ";
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          setSpokenTranscript((prev) => (prev ? `${prev.trim()} ${final.trim()}` : final.trim()));
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically keep listening if active, unmuted, and interviewer is not talking
        if (isListeningRef.current && !isMicMutedRef.current && !isSpeakingRef.current && !isTextModeRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Failed to init SpeechRecognition:", err);
      setSpeechSupported(false);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // 6. Initialize WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;

    async function connectWebSocket() {
      let token = "";
      try {
        const resolved = await getAuthToken();
        if (resolved) token = resolved;
      } catch (err) {
        console.warn("Could not retrieve auth token:", err);
      }

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.hostname}:8000/api/v1`;
      const url = `${host}/interviews/${interviewId}/live-ws?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        setErrorMsg(null);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "session_init") {
            setJobRole(payload.job_role);
            setRigor(payload.rigor);
            setRemainingSeconds(payload.remaining_seconds);
            setTotalQuestions(payload.total_questions);
            setQuestionIndex(payload.current_question_index);
            if (payload.current_question) {
              setCurrentQuestion(payload.current_question);
              setSpokenTranscript("");
              setInterimTranscript("");
              // Add AI welcome & question to transcript
              setTranscript([
                {
                  id: "init-1",
                  sender: "ai",
                  text: payload.welcome_message,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
                {
                  id: "init-2",
                  sender: "ai",
                  text: payload.current_question.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);

              // Speak the first question aloud!
              speakText(payload.current_question.text);
            }
          } else if (payload.type === "question_update") {
            setQuestionIndex(payload.current_question_index);
            setCurrentQuestion(payload.current_question);
            setSpokenTranscript("");
            setInterimTranscript("");

            // Speak the incoming question out loud!
            const speechText = payload.ai_speech_text || payload.current_question.text;
            speakText(speechText);

            setTranscript((prev) => [
              ...prev,
              {
                id: `q-${Date.now()}`,
                sender: "ai",
                text: payload.current_question.text,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          } else if (payload.type === "retake_acknowledged") {
            setSpokenTranscript("");
            setInterimTranscript("");
            if (currentQuestion) {
              speakText(`Let's retake this question: ${currentQuestion.text}`);
            }
          } else if (payload.type === "interview_finalized") {
            stopListening();
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            router.push(`/interview/${interviewId}/processing`);
          } else if (payload.type === "error") {
            setErrorMsg(payload.message || "Interviewer session error");
            setConnectionStatus("disconnected");
          }
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMsg("WebSocket connection error. Retrying...");
      };

      ws.onclose = (e) => {
        setConnectionStatus("disconnected");
        if (e.reason) {
          setErrorMsg(e.reason);
        }
      };
    }

    connectWebSocket();

    return () => {
      stopListening();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (ws) {
        ws.close();
      }
    };
  }, [interviewId, router]);

  // 3. Countdown Timer Interval
  useEffect(() => {
    if (connectionStatus !== "connected") return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Control Handlers
  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleSendTextAnswer = () => {
    if (!textAnswer.trim() || !wsRef.current) return;
    const userText = textAnswer.trim();

    // Add to local transcript immediately
    setTranscript((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    wsRef.current.send(
      JSON.stringify({
        type: "text_answer",
        text: userText,
      })
    );

    setTextAnswer("");
    setIsTextMode(false);
  };

  const handleSendVoiceAnswer = () => {
    const fullAnswer = `${spokenTranscript} ${interimTranscript}`.trim();
    if (!fullAnswer || !wsRef.current) return;

    // Add to local transcript immediately
    setTranscript((prev) => [
      ...prev,
      {
        id: `voice-${Date.now()}`,
        sender: "user",
        text: fullAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    stopListening();
    wsRef.current.send(
      JSON.stringify({
        type: "voice_answer_complete",
        transcript: fullAnswer,
      })
    );

    setSpokenTranscript("");
    setInterimTranscript("");
  };

  const handleSkipQuestion = () => {
    if (!wsRef.current) return;
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpokenTranscript("");
    setInterimTranscript("");
    setTranscript((prev) => [
      ...prev,
      {
        id: `skip-${Date.now()}`,
        sender: "user",
        text: "[Skipped Question]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    wsRef.current.send(JSON.stringify({ type: "skip_question" }));
  };

  const handleRetakeAnswer = () => {
    if (!wsRef.current) return;
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpokenTranscript("");
    setInterimTranscript("");
    wsRef.current.send(JSON.stringify({ type: "retake_answer" }));
    setTranscript((prev) => [
      ...prev,
      {
        id: `retake-${Date.now()}`,
        sender: "user",
        text: "[Retake Answer Requested]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleEndInterview = () => {
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "end_interview" }));
    }
    router.push(`/interview/${interviewId}/processing`);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Session Bar */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white flex items-center gap-2">
              {jobRole}
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/60 font-semibold uppercase">
                {rigor.replace("_", " ")}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Question {questionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server-Synchronized Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-mono font-semibold">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500 animate-spin"
                  : "bg-rose-500"
              }`}
            />
            <span className="capitalize text-slate-300">{connectionStatus}</span>
          </div>

          {/* End Interview */}
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            End Session
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left / Center Area: AI Interviewer Video & Current Question (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between border-r border-slate-800 overflow-y-auto">
          {/* Current Question Display */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-lg mb-6">
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setConnectionStatus("connecting");
                    window.location.reload();
                  }}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shrink-0 transition"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Current Question • {currentQuestion?.competency || (errorMsg ? "Connection Error" : "System Design")}
              </span>
              <div className="flex items-center gap-2">
                {currentQuestion && (
                  <button
                    type="button"
                    onClick={() => speakText(currentQuestion.text)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all"
                    title="Click to hear the interviewer speak this question aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeaking ? "Speaking..." : "Listen Question"}</span>
                  </button>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                  {currentQuestion?.difficulty || "Medium"}
                </span>
              </div>
            </div>
            <div className="text-lg font-semibold text-white leading-relaxed">
              {currentQuestion?.text ? (
                currentQuestion.text
              ) : errorMsg ? (
                <span className="text-rose-300 font-normal text-sm">
                  Unable to connect to the live interview session. Please click Retry above to reconnect.
                </span>
              ) : (
                <div className="flex items-center gap-3 text-slate-300">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Connecting to interviewer...</span>
                </div>
              )}
            </div>
          </div>

          {/* Video / AI Persona Feed */}
          <div className="relative min-h-[260px] max-h-[360px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            {/* Candidate Local Camera View */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
            />

            {isVideoOff && (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <VideoOff className="w-12 h-12 mb-2" />
                <span className="text-xs font-semibold">Camera is Turned Off</span>
              </div>
            )}

            {/* AI Avatar Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700 text-xs font-semibold text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <span>AI Lead Interviewer</span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  Speaking...
                </span>
              )}
            </div>
          </div>

          {/* Spoken Answer Live Transcription Panel (Real-Time Voice to Text) */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening && !isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                  }`}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  Your Spoken Answer (Live Transcribing)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isListening && !isSpeaking && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-spin text-emerald-400" />
                    Listening to Microphone...
                  </span>
                )}
                {isSpeaking && (
                  <span className="text-[11px] font-semibold text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-bounce" />
                    Interviewer Speaking...
                  </span>
                )}
                {(spokenTranscript || interimTranscript) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpokenTranscript("");
                      setInterimTranscript("");
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
                  >
                    Clear &amp; Re-speak
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={spokenTranscript + (interimTranscript ? ` ${interimTranscript}` : "")}
                onChange={(e) => {
                  setSpokenTranscript(e.target.value);
                  setInterimTranscript("");
                }}
                placeholder={
                  isSpeaking
                    ? "Interviewer is speaking the question..."
                    : isMicMuted
                    ? "Microphone is muted. Click Unmute to answer."
                    : "Speak your answer clearly into your microphone... As you talk, your words will transcribe here in text form in real-time."
                }
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none font-sans"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">
                💡 Speak your answer, review the text above, and click{" "}
                <strong className="text-slate-300">Submit Spoken Answer</strong> when finished.
              </p>
              <button
                type="button"
                onClick={handleSendVoiceAnswer}
                disabled={!(spokenTranscript || interimTranscript).trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Spoken Answer
              </button>
            </div>
          </div>

          {/* Action Bar Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-xl border transition-all ${
                  isMicMuted
                    ? "bg-rose-600/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-xl border transition-all ${
                  isVideoOff
                    ? "bg-rose-600/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsTextMode(!isTextMode)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isTextMode
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Text Answer Mode
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetakeAnswer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>

              <button
                type="button"
                onClick={handleSkipQuestion}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <SkipForward className="w-4 h-4" />
                Skip Question
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Live Transcript & Text Answer Box (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-slate-900/50">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Synchronized Live Transcript
              </h2>
              <span className="text-xs text-slate-500">Auto-scrolling</span>
            </div>

            {/* Transcript Messages Container */}
            <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
              {transcript.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col ${
                    item.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-400">
                      {item.sender === "ai" ? "Interviewer" : "Candidate"}
                    </span>
                    <span>• {item.timestamp}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[88%] leading-relaxed ${
                      item.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-sm shadow-sm"
                        : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}

              {/* Live Preview of Candidate's Spoken Answer as they talk */}
              {(spokenTranscript || interimTranscript) && (
                <div className="flex flex-col items-end opacity-90 transition-opacity">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                      Candidate (Transcribing Spoken Words...)
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl text-xs sm:text-sm max-w-[88%] leading-relaxed bg-blue-600/80 border border-blue-400/40 text-white rounded-br-sm shadow-sm">
                    {spokenTranscript}
                    {interimTranscript && (
                      <span className="text-blue-200 italic"> {interimTranscript}</span>
                    )}
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Text Input Area (if text answer mode is toggled) */}
          {isTextMode ? (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendTextAnswer();
                    }
                  }}
                  placeholder="Type your response... (Press Enter to submit)"
                  className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
                <button
                  type="button"
                  onClick={handleSendTextAnswer}
                  className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Listening to spoken answer. Speak clearly into your microphone.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal to End Interview */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">End Practice Session?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Ending the interview will finalize your session, save your transcript, and generate your evidence-based competency evaluation report.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-300"
              >
                Continue Practice
              </button>
              <button
                type="button"
                onClick={handleEndInterview}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-md shadow-rose-600/30"
              >
                Finalize &amp; Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
