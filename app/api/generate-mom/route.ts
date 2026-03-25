import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transcript, fileName } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const today = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert meeting secretary. Create a professional Minutes of Meeting (MOM) document from the following meeting transcript.

Meeting file: ${fileName}
Date: ${today}

Transcript:
${transcript}

Generate a structured MOM with the following sections (use markdown formatting):

# Minutes of Meeting

## Meeting Details
- **Date:** ${today}
- **File:** ${fileName}
- **Duration:** (estimate from transcript length if possible)

## Attendees
List all people mentioned or who spoke in the meeting. If names are unclear, write "Participant 1", "Participant 2", etc.

## Agenda / Topics Discussed
List the main topics that were discussed.

## Key Discussion Points
Summarize the important points discussed under each topic.

## Decisions Made
List all decisions that were finalized during the meeting.

## Action Items
List all tasks assigned with:
- Task description
- Owner (who is responsible)
- Deadline (if mentioned)

## Next Steps
Any follow-ups or next meeting details if mentioned.

## Summary
A brief 2-3 sentence overall summary of the meeting.

Be concise, professional, and accurate. Only include what was actually discussed in the transcript.`,
        },
      ],
    });

    const mom = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ mom });
  } catch (err: unknown) {
    console.error("MOM generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MOM generation failed" },
      { status: 500 }
    );
  }
}
