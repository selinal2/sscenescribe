import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildQuizPrompt({ transcript, notes, comments }) {
  return `
You are generating a quiz based only on the provided context.

Context:
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}

Create exactly 10 multiple choice questions.

Return ONLY valid JSON in this exact shape:
{
  "quiz": [
    {
      "question": "string",
      "correctAnswer": "string",
      "options": ["string", "string", "string", "string"],
      "explanation": "string",
      "topic": "string"
    }
  ]
}

Rules:
- Exactly 10 questions
- Exactly 4 options per question
- correctAnswer must be one of the 4 options
- explanations should be short and clear
- do not include markdown
- do not include any text outside the JSON
`;
}

function buildSummaryPrompt({ transcript, notes, comments }) {
  return `
You are summarizing a video using only the provided context.

Context:
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}

Write a short summary in 2 to 4 sentences.
Return ONLY the summary text.
`;
}

function buildTakeawaysPrompt({ transcript, notes, comments }) {
  return `
You are extracting key takeaways using only the provided context.

Context:
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}

Return ONLY valid JSON in this exact shape:
{
  "takeaways": [
    "string",
    "string",
    "string"
  ]
}

Rules:
- 3 to 5 takeaways
- each takeaway should be concise
- do not include markdown
- do not include any text outside the JSON
`;
}

function buildChatPrompt({ question, transcript, notes, comments }) {
  return `
You are answering a user's question about a video.

Use only the provided context when possible.
If the answer is not in the context, say that clearly.

Context:
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}

Question:
${question || "No question provided."}

Return ONLY the answer text.
`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJson(text) {
  const trimmed = text.trim();

  const direct = safeJsonParse(trimmed);
  if (direct) return direct;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return safeJsonParse(match[0]);
}

async function runResponse(input) {
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input,
  });

  return response.output_text || "";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const {
      mode,
      question,
      transcript,
      notes,
      comments,
    } = req.body || {};

    if (!mode) {
      return res.status(400).json({ error: "Missing mode" });
    }

    if (mode === "chat") {
      if (!question) {
        return res.status(400).json({ error: "Missing question" });
      }

      const answer = await runResponse(
        buildChatPrompt({ question, transcript, notes, comments })
      );

      return res.status(200).json({ answer });
    }

    if (mode === "summary") {
      const summary = await runResponse(
        buildSummaryPrompt({ transcript, notes, comments })
      );

      return res.status(200).json({ summary });
    }

    if (mode === "takeaways") {
      const raw = await runResponse(
        buildTakeawaysPrompt({ transcript, notes, comments })
      );

      const parsed = extractJson(raw);

      if (!parsed || !Array.isArray(parsed.takeaways)) {
        return res.status(500).json({ error: "Failed to generate takeaways" });
      }

      return res.status(200).json({ takeaways: parsed.takeaways });
    }

    if (mode === "quiz") {
      const raw = await runResponse(
        buildQuizPrompt({ transcript, notes, comments })
      );

      const parsed = extractJson(raw);

      if (!parsed || !Array.isArray(parsed.quiz)) {
        return res.status(500).json({ error: "Failed to generate quiz" });
      }

      const cleanedQuiz = parsed.quiz
        .filter((item) =>
          item &&
          typeof item.question === "string" &&
          typeof item.correctAnswer === "string" &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.explanation === "string" &&
          typeof item.topic === "string"
        )
        .map((item) => ({
          question: item.question,
          correctAnswer: item.correctAnswer,
          options: item.options,
          explanation: item.explanation,
          topic: item.topic,
        }));

      if (!cleanedQuiz.length) {
        return res.status(500).json({ error: "Quiz data was invalid" });
      }

      return res.status(200).json({ quiz: cleanedQuiz.slice(0, 10) });
    }

    return res.status(400).json({ error: "Invalid mode" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the response.",
    });
  }
}