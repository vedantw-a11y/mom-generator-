"use client";

import { useState, useRef } from "react";
import MOMDisplay from "@/components/MOMDisplay";

type Stage = "idle" | "uploading" | "transcribing" | "generating" | "done" | "error";

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [mom, setMom] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageLabel: Record<Stage, string> = {
    idle: "",
    uploading: "Uploading recording...",
    transcribing: "Transcribing audio (this may take a minute)...",
    generating: "Generating Minutes of Meeting...",
    done: "",
    error: "",
  };

  async function processFile(file: File) {
    setError("");
    setMom("");
    setFileName(file.name);

    const allowed = ["audio/", "video/"];
    if (!allowed.some((t) => file.type.startsWith(t))) {
      setError("Please upload an audio or video file (MP3, MP4, WAV, M4A, etc.)");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be under 100MB.");
      return;
    }

    try {
      // Step 1: Upload
      setStage("uploading");
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await uploadRes.json();

      // Step 2: Transcribe
      setStage("transcribing");
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || "Transcription failed");
      }
      const { transcript } = await transcribeRes.json();

      // Step 3: Generate MOM
      setStage("generating");
      const momRes = await fetch("/api/generate-mom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, fileName: file.name }),
      });
      if (!momRes.ok) {
        const err = await momRes.json();
        throw new Error(err.error || "MOM generation failed");
      }
      const { mom: generatedMom } = await momRes.json();

      setMom(generatedMom);
      setStage("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleReset() {
    setStage("idle");
    setMom("");
    setError("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isProcessing = ["uploading", "transcribing", "generating"].includes(stage);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">MOM Generator</h1>
          <p className="text-slate-500 mt-2">Upload a meeting recording and get Minutes of Meeting instantly</p>
        </div>

        {/* Upload Area */}
        {(stage === "idle" || stage === "error") && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700">Drop your recording here</p>
            <p className="text-slate-400 mt-1">or click to browse</p>
            <p className="text-sm text-slate-400 mt-3">Supports MP3, MP4, WAV, M4A, WEBM · Max 100MB</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-slate-800 text-lg">{stageLabel[stage]}</p>
            <p className="text-slate-400 text-sm mt-2">{fileName}</p>

            {/* Progress Steps */}
            <div className="flex justify-center gap-6 mt-8">
              {(["uploading", "transcribing", "generating"] as Stage[]).map((s, i) => {
                const stages: Stage[] = ["uploading", "transcribing", "generating"];
                const currentIdx = stages.indexOf(stage);
                const stepIdx = i;
                const isDone = stepIdx < currentIdx;
                const isActive = stepIdx === currentIdx;
                return (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isDone ? "bg-green-500 text-white" :
                      isActive ? "bg-blue-600 text-white" :
                      "bg-slate-200 text-slate-400"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ${isActive ? "text-blue-600 font-medium" : "text-slate-400"}`}>
                      {s === "uploading" ? "Upload" : s === "transcribing" ? "Transcribe" : "Generate"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MOM Result */}
        {stage === "done" && mom && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Minutes of Meeting</h2>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← New Recording
              </button>
            </div>
            <MOMDisplay mom={mom} fileName={fileName} />
          </div>
        )}
      </div>
    </main>
  );
}
