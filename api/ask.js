export default async function handler(req, res) {
  // CORS (needed for GitHub Pages → Vercel)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { mode, question, transcript, notes, comments } = req.body;

    // Combine context
    const context = `
Transcript:
${transcript || "No transcript provided."}

Notes:
${notes || "No notes provided."}

Comments:
${comments || "No comments provided."}
`;

    let prompt = "";

    // Different prompts depending on mode
    if (mode === "chat") {
      prompt = `
Answer the user's question based on the content below.

${context}

Question:
${question}
`;
    }

    if (mode === "summary") {
      prompt = `
Summarize the following content in 2–4 clear sentences.

${context}
`;
    }

    if (mode === "takeaways") {
      prompt = `
Give 3–5 key takeaways from this content.
Keep them short and clear.

${context}
`;
    }

    if (mode === "quiz") {
      prompt = `
Create 5 multiple choice questions based on this content.
Each question should have 4 options and clearly mark the correct answer.

${context}
`;
    }

    // Call Groq API (FREE)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content || "No response from AI.";

    // Return based on mode
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
      return res.status(200).json({ quiz: text });
    }

    return res.status(400).json({ error: "Invalid mode" });

  } catch (error) {
    console.error("Groq API error:", error);

    return res.status(500).json({
      error: "AI failed. Check your API key or usage."
    });
  }
}