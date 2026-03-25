"use client";

import { useState } from "react";

interface Props {
  mom: string;
  fileName: string;
}

export default function MOMDisplay({ mom, fileName }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(mom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([mom], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOM_${fileName.replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Render markdown-like text with basic formatting
  function renderMOM(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-2 mb-3">{line.slice(2)}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-bold text-blue-700 mt-6 mb-2 border-b border-blue-100 pb-1">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="font-semibold text-slate-800 mt-3 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-4 text-slate-700 mb-1 flex gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{line.slice(2)}</span>
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        const num = line.match(/^(\d+)\. /)?.[1];
        return (
          <li key={i} className="ml-4 text-slate-700 mb-1 flex gap-2">
            <span className="text-blue-600 font-semibold min-w-[20px]">{num}.</span>
            <span>{line.replace(/^\d+\. /, "")}</span>
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-slate-800 mt-2">{line.slice(2, -2)}</p>;
      }
      if (line === "") {
        return <div key={i} className="h-2" />;
      }
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-slate-700 mb-1">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {fileName}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* MOM Content */}
      <div className="p-6 prose max-w-none">
        <ul className="list-none p-0 m-0">
          {renderMOM(mom)}
        </ul>
      </div>
    </div>
  );
}
