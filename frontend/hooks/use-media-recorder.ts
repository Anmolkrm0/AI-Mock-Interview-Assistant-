import { useState, useRef, useCallback } from "react";
import { getAuthHeaders } from "@/services/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const MAX_RECORDING_BYTES = 50 * 1024 * 1024; // 50MB

export function useMediaRecorder(interviewId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [isApproachingLimit, setIsApproachingLimit] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    setRecordedBytes(0);
    setIsApproachingLimit(false);
    setUploadStatus("idle");
    setErrorMessage(null);
    startTimeRef.current = Date.now();

    try {
      // Pick best supported audio mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000, // 64kbps audio gives ~28MB for 1 full hour
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          setRecordedBytes((prev) => {
            const nextSize = prev + event.data.size;
            if (nextSize > MAX_RECORDING_BYTES * 0.85) {
              setIsApproachingLimit(true);
            }
            return nextSize;
          });
        }
      };

      recorder.start(5000); // chunk every 5 seconds
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      setErrorMessage(err.message || "Could not start audio recorder.");
    }
  }, []);

  const stopAndUpload = useCallback(async (): Promise<boolean> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return false;
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        setIsRecording(false);
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size === 0) {
          resolve(false);
          return;
        }

        setUploadStatus("uploading");

        try {
          const headers = await getAuthHeaders();

          // 1. Request upload destination
          const urlRes = await fetch(`${API_BASE}/recordings/upload-url`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              interview_id: interviewId,
              file_name: `recording_${interviewId}.webm`,
              mime_type: "audio/webm",
              file_size_bytes: blob.size,
            }),
          });

          if (!urlRes.ok) {
            const err = await urlRes.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to obtain upload URL.");
          }

          const { upload_url, storage_path } = await urlRes.json();

          // 2. Upload file to Supabase signed URL
          const uploadRes = await fetch(upload_url, {
            method: "PUT",
            headers: {
              "Content-Type": "audio/webm",
            },
            body: blob,
          });

          // 3. Confirm recording in database
          const confirmRes = await fetch(`${API_BASE}/recordings/confirm`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              interview_id: interviewId,
              storage_path,
              mime_type: "audio/webm",
              file_size_bytes: blob.size,
              duration_seconds: durationSeconds,
            }),
          });

          if (!confirmRes.ok) {
            throw new Error("Failed to confirm recording retention.");
          }

          setUploadStatus("success");
          resolve(true);
        } catch (err: any) {
          console.error("Recording upload failed:", err);
          setErrorMessage(err.message || "Failed to upload recording.");
          setUploadStatus("error");
          resolve(false);
        }
      };

      recorder.stop();
    });
  }, [interviewId]);

  return {
    isRecording,
    recordedBytes,
    isApproachingLimit,
    uploadStatus,
    errorMessage,
    startRecording,
    stopAndUpload,
  };
}
