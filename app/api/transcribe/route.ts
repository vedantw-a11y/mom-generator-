import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.API_BASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // Download the file from Vercel Blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch audio file");
    }

    const buffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const urlPath = new URL(url).pathname;
    const fileName = urlPath.split("/").pop() || "audio.mp3";

    const file = new File([fileBuffer], fileName, {
      type: response.headers.get("content-type") || "audio/mpeg",
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });

    return NextResponse.json({ transcript: transcription });
  } catch (err: unknown) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
