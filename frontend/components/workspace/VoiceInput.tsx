"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { sendVoiceMessage } from "@/lib/api";
import { ChatMessage } from "@/types";

/** Mic capture -> /agent/voice (Bhashini transcription + agent response).
 * Drop this next to ChatbotWidget's input row; onResult appends both the
 * transcript (as a user message) and the agent's reply to the same thread. */
export function VoiceInput({
  projectId,
  onResult,
}: {
  projectId: string | null;
  onResult: (userText: ChatMessage, assistantText: ChatMessage) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = handleStop;
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleStop() {
    setBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const { transcript, response } = await sendVoiceMessage(projectId, blob);
      const now = new Date().toISOString();
      onResult(
        { role: "user", text: transcript, timestamp: now },
        { role: "assistant", text: response, timestamp: now }
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      disabled={busy}
      className={`focus-ring flex h-9 w-9 items-center justify-center rounded-sm border ${
        recording ? "border-signal-red bg-signal-red/10 text-signal-red" : "border-line-bright text-ink-muted"
      }`}
      title={recording ? "Stop recording" : "Ask by voice"}
      aria-label={recording ? "Stop recording" : "Ask by voice"}
    >
      {recording ? <Square className="h-4 w-4" strokeWidth={1.75} /> : <Mic className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  );
}
