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
Answer the user's question using the context below.
If the answer is not in the context, say that clearly.

${context}

Question:
${question || ""}
`;
    } else if (mode === "summary") {
      prompt = `
Summarize this content in 2 to 4 clear sentences.

${context}
`;
    } else if (mode === "takeaways") {
      prompt = `
Give 3 to 5 key takeaways from this content.
Keep them short and clear.

${context}
`;
    } else if (mode === "quiz") {
      prompt = `
Create 5 multiple choice questions based on this content.
Each question must have 4 options and clearly state the correct answer.

${context}
`;
    } else {
      return res.status(400).json({ error: "Invalid mode." });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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

    const data = await groqResponse.json();
    console.log("Groq raw response:", JSON.stringify(data));

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
      return res.status(200).json({ quiz: text });
    }
  } catch (error) {
    console.error("Groq API error:", error);
    return res.status(500).json({
      error: error.message || "AI failed."
    });
  }
}