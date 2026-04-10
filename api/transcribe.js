export const config = {
  api: {
    bodyParser: false
  }
};

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
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
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY in Vercel." });
    }

    const contentType = req.headers["content-type"] || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return res.status(400).json({ error: "Expected multipart/form-data upload." });
    }

    const bodyBuffer = await readRequestBody(req);

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": contentType,
          "Content-Length": String(bodyBuffer.length)
        },
        body: bodyBuffer
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({
        error: data?.error?.message || "Transcription request failed."
      });
    }

    return res.status(200).json({
      text: data?.text || "",
      segments: Array.isArray(data?.segments) ? data.segments : []
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return res.status(500).json({
      error: error.message || "Transcription failed."
    });
  }
}