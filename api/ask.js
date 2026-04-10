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
    const { mode, question, transcript, notes, comments } = req.body || {};

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY in Vercel." });
    }

    const context = `
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}
`;

    let prompt = "";

    if (mode === "chat") {
      prompt = `
Answer the user's question using only the context below when possible.
If the answer is not in the context, say that clearly.

${context}

Question:
${question || ""}
`;
    } else if (mode === "summary") {
      prompt = `
Write a short summary in 2 to 4 sentences using only this context.

${context}
`;
    } else if (mode === "takeaways") {
      prompt = `
Give 3 to 5 key takeaways from this context.
Keep them short and clear.
Return plain text only.

${context}
`;
    } else if (mode === "quiz") {
      prompt = `
Create exactly 10 multiple choice questions using only this context.

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
- correctAnswer must be one of the options
- explanation should be short
- topic should be short
- no markdown
- no text outside the JSON

${context}
`;
    } else {
      return res.status(400).json({ error: "Invalid mode." });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({
        error: data?.error?.message || "Groq request failed."
      });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.status(500).json({
        error: "Groq returned no message content."
      });
    }

    if (mode === "chat") {
      return res.status(200).json({ answer: text });
    }

    if (mode === "summary") {
      return res.status(200).json({ summary: text });
    }

    if (mode === "takeaways") {
      return res.status(200).json({ takeaways: text });
    }

    if (mode === "quiz") {
      let parsed = null;

      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            parsed = null;
          }
        }
      }

      if (!parsed || !Array.isArray(parsed.quiz)) {
        return res.status(500).json({
          error: "Quiz response could not be parsed."
        });
      }

      const cleanedQuiz = parsed.quiz
        .filter(
          (item) =>
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
          topic: item.topic
        }));

      return res.status(200).json({ quiz: cleanedQuiz.slice(0, 10) });
    }
  } catch (error) {
    console.error("Groq API error:", error);
    return res.status(500).json({
      error: error.message || "AI failed."
    });
  }
}