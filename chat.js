const express = require("express");
const path = require("path");
const chatRouter = require("./api/chat");

const app = express();

app.use(express.json({ limit: "100kb" }));

// API: POST /api/chat
app.use("/api/chat", chatRouter);

// Phục vụ index.html, config.js, js/, ...
app.use(express.static(__dirname));

// Render cấp cổng qua biến PORT
const port = process.env.PORT || 10000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server đang chạy tại cổng ${port}`);
});
