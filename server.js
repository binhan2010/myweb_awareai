const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "100kb" }));

// Groq API proxy. The secret stays on the server in process.env.GROQ_API_KEY.
app.post("/api/chat", async (req, res) => {
  const { messages, isJsonResponse = false } = req.body || {};

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 20 ||
    messages.some(
      (message) =>
        !["system", "user", "assistant"].includes(message?.role) ||
        typeof message?.content !== "string" ||
        message.content.length > 12000
    )
  ) {
    return res.status(400).json({ error: "Dữ liệu yêu cầu không hợp lệ." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Missing GROQ_API_KEY environment variable.");
    return res.status(500).json({ error: "Máy chủ chưa cấu hình API key." });
  }

  try {
    const groqResponse = await fetch(
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
          ...(isJsonResponse === true
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
      }
    );

    const data = await groqResponse.json().catch(() => ({}));
    if (!groqResponse.ok) {
      console.error("Groq API error:", groqResponse.status, data.error?.message);
      return res.status(groqResponse.status).json({
        error: data.error?.message || "Groq API gặp lỗi.",
      });
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content) {
      return res.status(502).json({ error: "Groq không trả về nội dung." });
    }

    return res.status(200).json({ content });
  } catch (error) {
    console.error("Groq request failed:", error);
    return res.status(502).json({ error: "Không kết nối được Groq API." });
  }
});

// Serve the site's HTML, JavaScript, CSS, and other assets from this folder.
app.use(express.static(__dirname));

// Railway provides PORT at runtime. Listen on all network interfaces.
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`AWAREAI server listening on port ${port}`);
});

