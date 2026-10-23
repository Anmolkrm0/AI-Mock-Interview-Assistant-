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
  Sparkles,
  User
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

  // Active stream reference for unmount cleanup
  const activeStreamRef = useRef<MediaStream | null>(null);

  // 1. FAST, RESILIENT CAMERA & MIC INITIALIZATION
  const requestCameraAccess = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        console.warn("getUserMedia is not supported on this browser.");
        return null;
      }

      let localStream: MediaStream | null = null;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err1) {
        console.warn("Combined getUserMedia failed, trying fallback:", err1);
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
          const aStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
          if (vStream || aStream) {
            localStream = new MediaStream();
            vStream?.getVideoTracks().forEach((t) => localStream!.addTrack(t));
            aStream?.getAudioTracks().forEach((t) => localStream!.addTrack(t));
          }
        } catch (err2) {
          console.warn("Fallback getUserMedia failed:", err2);
        }
      }

      if (localStream) {
        activeStreamRef.current = localStream;
        setStream(localStream);
        setIsVideoOff(false);
        return localStream;
      }
      return null;
    } catch (err) {
      console.warn("Camera request error:", err);
      return null;
    }
  };

  useEffect(() => {
    requestCameraAccess();
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => t.stop());
        activeStreamRef.current = null;
      }
    };
  }, []);

  // Bind video element safely without re-render thrashing
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && !isVideoOff) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    }
  }, [stream, isVideoOff]);

  // Synchronize configuration refs
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

  // 2. TEXT-TO-SPEECH (CLEAN, SAFE, ZERO LOOPS)
  const stopSpeakingAndStartListening = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    startListening();
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      startListening();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      if (ttsTimerRef.current) {
        clearTimeout(ttsTimerRef.current);
        ttsTimerRef.current = null;
      }

      const cleanText = text.replace(/[*_#`~[\]]/g, " ").replace(/\s+/g, " ").trim();
      if (!cleanText) {
        if (onEnd) onEnd();
        startListening();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      (window as any).__currentUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Natural") ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel") ||
              v.name.includes("Alex"))
        ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      const onDone = () => {
        if (ttsTimerRef.current) {
          clearTimeout(ttsTimerRef.current);
          ttsTimerRef.current = null;
        }
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        (window as any).__currentUtterance = null;
        if (onEnd) onEnd();
        startListening();
      };

      utterance.onend = onDone;
      utterance.onerror = (e) => {
        console.warn("Speech synthesis error event:", e);
        onDone();
      };

      // Hard max timeout safety: never allow isSpeaking to stay stuck
      const wordCount = cleanText.split(/\s+/).length;
      const maxDuration = Math.max(3000, Math.min(10000, wordCount * 350));
      ttsTimerRef.current = setTimeout(() => {
        if (isSpeakingRef.current) {
          onDone();
        }
      }, maxDuration);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis failed:", err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
      startListening();
    }
  };

  // 3. REAL-TIME SPEECH-TO-TEXT (STT)
  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return null;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

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
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          console.warn("Microphone access denied or service unavailable for STT");
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isListeningRef.current && !isMicMutedRef.current && !isSpeakingRef.current && !isTextModeRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !isMicMutedRef.current && !isSpeakingRef.current && !isTextModeRef.current) {
              try {
                recognition.start();
                setIsListening(true);
              } catch (e) {}
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      setSpeechSupported(true);
      return recognition;
    } catch (err) {
      console.warn("Failed to init SpeechRecognition:", err);
      setSpeechSupported(false);
      return null;
    }
  };

  const startListening = () => {
    if (isMicMutedRef.current || isTextModeRef.current) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;

    let rec = recognitionRef.current;
    if (!rec) {
      rec = initSpeechRecognition();
    }
    if (rec) {
      try {
        isListeningRef.current = true;
        rec.start();
        setIsListening(true);
      } catch (e: any) {
        setIsListening(true);
        setTimeout(() => {
          try {
            if (isListeningRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (err) {}
        }, 200);
      }
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

  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (ttsTimerRef.current) {
        clearTimeout(ttsTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // 4. WEBSOCKET CONNECTION
  useEffect(() => {
    let isCancelled = false;
    let ws: WebSocket | null = null;
    let pingTimer: any = null;

    async function connectWebSocket() {
      let token = "";
      try {
        const resolved = await getAuthToken();
        if (resolved) token = resolved;
      } catch (err) {
        console.warn("Could not retrieve auth token:", err);
      }

      if (isCancelled) return;

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.hostname}:8000/api/v1`;
      const url = `${host}/interviews/${interviewId}/live-ws?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCancelled) {
          ws?.close();
          return;
        }
        setConnectionStatus("connected");
        setErrorMsg(null);

        // Ping after 3.5s ONLY if session_init was not received
        pingTimer = setTimeout(() => {
          if (!isCancelled && ws && ws.readyState === WebSocket.OPEN && !sessionInitReceivedRef.current) {
            ws.send(JSON.stringify({ type: "init_request" }));
          }
        }, 3500);
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "session_init") {
            sessionInitReceivedRef.current = true;
            setJobRole(payload.job_role);
            setRigor(payload.rigor);
            setRemainingSeconds(payload.remaining_seconds);
            setTotalQuestions(payload.total_questions);
            setQuestionIndex(payload.current_question_index);

            if (payload.current_question) {
              setCurrentQuestion(payload.current_question);
              setSpokenTranscript("");
              setInterimTranscript("");

              // Set transcript once
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

              speakText(payload.current_question.text);
            }
          } else if (payload.type === "question_update") {
            sessionInitReceivedRef.current = true;
            setQuestionIndex(payload.current_question_index);
            setCurrentQuestion(payload.current_question);
            setSpokenTranscript("");
            setInterimTranscript("");

            const speechText = payload.ai_speech_text || payload.current_question.text;
            speakText(speechText);

            // Deduplicate: avoid appending if question text is already the last message
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.text === payload.current_question.text) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: `q-${Date.now()}`,
                  sender: "ai",
                  text: payload.current_question.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ];
            });
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
        if (!isCancelled) {
          console.error("WebSocket error:", e);
          setErrorMsg("Connecting to interviewer... Click Retry if taking longer than 5 seconds.");
        }
      };

      ws.onclose = (e) => {
        if (!isCancelled) {
          setConnectionStatus("disconnected");
          if (e.reason) setErrorMsg(e.reason);
        }
      };
    }

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (pingTimer) clearTimeout(pingTimer);
      stopListening();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (ws) {
        ws.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
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

  const toggleVideo = async () => {
    if (!stream || stream.getVideoTracks().length === 0) {
      await requestCameraAccess();
      return;
    }
    const tracks = stream.getVideoTracks();
    const nextVideoState = !isVideoOff;
    tracks.forEach((track) => {
      track.enabled = !nextVideoState;
    });
    setIsVideoOff(nextVideoState);
  };

  const handleStopAndSubmit = () => {
    stopListening();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (speechSafetyTimerRef.current) {
      clearTimeout(speechSafetyTimerRef.current);
      speechSafetyTimerRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    pendingSpeechTextRef.current = null;

    const currentSpoken = `${spokenTranscript} ${interimTranscript}`.trim();
    const answerToSubmit = currentSpoken || textAnswer.trim();

    if (!answerToSubmit) {
      alert("Please speak or enter an answer before submitting, or click 'Skip Question'.");
      return;
    }

    // Add to local transcript immediately
    setTranscript((prev) => [
      ...prev,
      {
        id: `ans-${Date.now()}`,
        sender: "user",
        text: answerToSubmit,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (isTextMode && textAnswer.trim()) {
        wsRef.current.send(
          JSON.stringify({
            type: "text_answer",
            text: answerToSubmit,
          })
        );
      } else {
        wsRef.current.send(
          JSON.stringify({
            type: "voice_answer_complete",
            transcript: answerToSubmit,
          })
        );
      }
    }

    // Reset buffers
    setSpokenTranscript("");
    setInterimTranscript("");
    setTextAnswer("");
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
    handleStopAndSubmit();
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
    <div className="h-screen max-h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Session Bar */}
      <header className="h-14 shrink-0 px-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
              {jobRole}
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/60 font-semibold uppercase">
                {rigor.replace("_", " ")}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Question {questionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Server-Synchronized Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
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
            <span className="capitalize text-slate-300 text-xs">{connectionStatus}</span>
          </div>

          {/* End Interview */}
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            End Session
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Area: Question, AI Avatar & Stage, Spoken Answer, Pinned Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 border-r border-slate-800 overflow-hidden bg-slate-900">
          {/* Scrollable Upper Area */}
          <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto">
            {/* Camera & Mic Permission Banner if stream not yet connected */}
            {!stream && (
              <div className="bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border border-blue-600/60 p-3 rounded-xl shadow-lg flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 text-xs text-blue-100">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                  <span>
                    <strong>Camera &amp; Microphone Setup:</strong> Click to connect your webcam and microphone for auto-speaking and live speech transcription.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await requestCameraAccess();
                    unlockSpeechAndMedia();
                    startListening();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-md transition"
                >
                  Enable Camera &amp; Mic
                </button>
              </div>
            )}

            {/* Current Question Display */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 shadow-md shrink-0">
              {errorMsg && (
                <div className="p-2.5 mb-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between">
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
                    className="px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-semibold shrink-0 transition"
                  >
                     Retry
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Current Question • {currentQuestion?.competency || (errorMsg ? "Connection Error" : "System Design")}
                </span>
                <div className="flex items-center gap-2">
                  {currentQuestion && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeakingAndStartListening();
                        } else {
                          speakText(currentQuestion.text);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
                        isSpeaking
                          ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40 animate-pulse"
                          : "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30"
                      }`}
                      title={isSpeaking ? "Click to stop question audio" : "Click to hear the question spoken aloud"}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeaking ? "Stop Audio" : "Listen Question"}</span>
                    </button>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                    {currentQuestion?.difficulty || "Medium"}
                  </span>
                </div>
              </div>
              <div className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {currentQuestion?.text ? (
                  currentQuestion.text
                ) : errorMsg ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-rose-300 font-normal text-xs sm:text-sm">
                      {errorMsg}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="self-start px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
                    >
                      Reconnect Now
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Connecting to interviewer...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                          wsRef.current.send(JSON.stringify({ type: "init_request" }));
                        } else {
                          window.location.reload();
                        }
                      }}
                      className="px-2.5 py-1 text-xs rounded-md bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 transition border border-blue-500/30 font-medium"
                    >
                      Reload Session
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Interactive Stage: AI Interviewer Persona + Candidate PiP */}
            <div className="relative flex-1 min-h-[200px] max-h-[300px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
              {/* AI Avatar & Voice Animation Stage */}
              <div className="flex flex-col items-center justify-center text-center p-4 z-0">
                {/* Glowing Avatar Ring */}
                <div className="relative mb-2.5">
                  {isSpeaking && (
                    <div className="absolute -inset-3 rounded-full bg-blue-500/20 animate-ping" />
                  )}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSpeaking
                        ? "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 ring-4 ring-blue-500/40 shadow-xl shadow-blue-500/30"
                        : "bg-gradient-to-tr from-slate-800 to-slate-700 ring-2 ring-slate-700"
                    }`}
                  >
                    <Bot className={`w-8 h-8 sm:w-10 sm:h-10 text-white ${isSpeaking ? "animate-pulse" : ""}`} />
                  </div>
                </div>

                {/* Persona Title */}
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-200">
                  <span>AI Lead Interviewer</span>
                </div>

                {/* Dynamic Audio Visualizer / State */}
                {isSpeaking ? (
                  <div className="flex items-center gap-1 mt-1.5 text-blue-400">
                    <span className="w-1 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.45s]" />
                    <span className="w-1 h-6 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.35s]" />
                    <span className="text-xs font-semibold text-blue-300 ml-1.5">Speaking question...</span>
                  </div>
                ) : isListening && !isSpeaking ? (
                  <div className="flex items-center gap-1.5 mt-1.5 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Listening to your response...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Ready</span>
                  </div>
                )}
              </div>

              {/* Top-Left Stage Label */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-800 text-[11px] font-semibold text-slate-300">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Interview Coach</span>
              </div>

              {/* Candidate Local Camera View (Picture-in-Picture) */}
              <div className="absolute bottom-3 right-3 w-40 h-28 sm:w-48 sm:h-32 rounded-xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl z-10 flex flex-col justify-between">
                {stream && stream.getVideoTracks().length > 0 && !isVideoOff ? (
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && stream && el.srcObject !== stream) {
                        el.srcObject = stream;
                        el.play().catch((err) => console.warn("Video play error:", err));
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : isVideoOff ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-slate-950">
                    <VideoOff className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-300">Camera is Off</span>
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className="mt-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold"
                    >
                      Turn On
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-slate-950">
                    <User className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[10px] font-medium text-slate-400 mb-1">Camera inactive</span>
                    <button
                      type="button"
                      onClick={requestCameraAccess}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold shadow"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}

                {/* Candidate Badge */}
                <div className="absolute bottom-1 left-1 right-1 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur text-[10px] font-semibold flex items-center justify-between text-slate-300 pointer-events-none">
                  <span className="truncate">You</span>
                  {isMicMuted ? (
                    <MicOff className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Mic className={`w-3 h-3 ${isListening ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                  )}
                </div>
              </div>
            </div>

            {/* Spoken Answer Live Transcription Panel */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 shadow-sm shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isListening && !isSpeaking ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                    }`}
                  />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    Your Spoken Answer (Live Transcribing)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Explicit Click to Speak / Record Toggle Button */}
                  {isListening ? (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 text-xs font-bold transition-all shadow-sm shadow-rose-900/40"
                      title="Click to pause voice recording"
                    >
                      <Radio className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                      <span>Recording Active • Click to Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startListening}
                      disabled={isMicMuted}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-900/30"
                      title="Click to start transcribing your answer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Click to Speak / Record</span>
                    </button>
                  )}

                  {isSpeaking && (
                    <span className="text-[10px] sm:text-[11px] font-semibold text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Volume2 className="w-2.5 h-2.5 animate-bounce" />
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
                      className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Live Audio Waves when Listening */}
              {isListening && !isSpeaking && (
                <div className="flex items-center justify-between px-2.5 py-1 bg-emerald-950/40 rounded-lg border border-emerald-800/40 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-300">
                      Microphone Active: Speak now to transcribe in real-time
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.45s]" />
                    <span className="w-1 h-5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.35s]" />
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={2}
                  spellCheck={false}
                  data-gramm="false"
                  value={spokenTranscript + (interimTranscript ? ` ${interimTranscript}` : "")}
                  onChange={(e) => {
                    setSpokenTranscript(e.target.value);
                    setInterimTranscript("");
                  }}
                  placeholder={
                    isSpeaking
                      ? "Interviewer is speaking the question aloud... Voice will unlock when question completes."
                      : isMicMuted
                      ? "Microphone is muted. Click Unmute below to answer."
                      : isListening
                      ? "Listening to your voice... Speak clearly and your words will appear here immediately."
                      : "Click 'Click to Speak / Record' above to start voice transcription, or type your answer here directly."
                  }
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  💡 Speak your answer, review the live text, and click{" "}
                  <strong className="text-slate-300">Stop &amp; Submit Answer</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleStopAndSubmit}
                  disabled={!(spokenTranscript || interimTranscript).trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Stop &amp; Submit Answer
                </button>
              </div>
            </div>
          </div>

          {/* Pinned Bottom Action Bar (Guaranteed visible at bottom) */}
          <div className="shrink-0 px-4 sm:px-5 py-2.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3 z-20">
            {/* Left Action Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isMicMuted
                    ? "bg-rose-600/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isMicMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isVideoOff
                    ? "bg-rose-600/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-blue-400" />}
                <span>{isVideoOff ? "Turn Camera On" : "Turn Camera Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTextMode(!isTextMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isTextMode
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Text Mode</span>
              </button>
            </div>

            {/* Center Action: Prominent Stop & Submit Button */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleStopAndSubmit}
                disabled={!(spokenTranscript || interimTranscript || textAnswer).trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/40 active:scale-95"
                title="Stop speaking and submit your answer to the interviewer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Stop &amp; Submit</span>
              </button>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetakeAnswer}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleSkipQuestion}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip Question</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Synchronized Live Transcript & Text Answer Box (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-slate-900/50 p-4 sm:p-5 justify-between overflow-hidden">
          {/* Transcript Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Synchronized Live Transcript
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Auto-scrolling</span>
          </div>

          {/* Transcript Messages Container (Full height scroll) */}
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2">
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
                  className={`p-3 rounded-xl text-xs sm:text-sm max-w-[88%] leading-relaxed ${
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
                <div className="p-3 rounded-xl text-xs sm:text-sm max-w-[88%] leading-relaxed bg-blue-600/80 border border-blue-400/40 text-white rounded-br-sm shadow-sm">
                  {spokenTranscript}
                  {interimTranscript && (
                    <span className="text-blue-200 italic"> {interimTranscript}</span>
                  )}
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Text Input Area (if text answer mode is toggled) or Status Indicator */}
          {isTextMode ? (
            <div className="mt-3 pt-3 border-t border-slate-800 shrink-0">
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
                  className="flex-1 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none font-sans"
                />
                <button
                  type="button"
                  onClick={handleSendTextAnswer}
                  className="px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-center shrink-0">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                Voice Mode Active • Speak into your microphone to answer
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
