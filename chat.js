export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Chỉ hỗ trợ POST." });
  }

  const { messages, isJsonResponse } = req.body || {};

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 20 ||
    messages.some(
      (m) =>
        !["system", "user", "assistant"].includes(m?.role) ||
        typeof m?.content !== "string" ||
        m.content.length > 12000
    )
  ) {
    return res.status(400).json({ error: "Dữ liệu yêu cầu không hợp lệ." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chưa cấu hình GROQ_API_KEY." });
  }

  try {
    const upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages,
          temperature: 0.7,
          max_completion_tokens: 2048,
          ...(isJsonResponse
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
      }
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error?.message || "Groq API gặp lỗi.",
      });
    }

    return res.status(200).json({
      content: data.choices?.[0]?.message?.content || "",
    });
  } catch {
    return res.status(502).json({ error: "Không kết nối được Groq API." });
  }
}