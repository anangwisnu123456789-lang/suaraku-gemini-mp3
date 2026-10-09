import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "100kb" }));
// Basic protection for a public endpoint so one visitor cannot rapidly exhaust API quota.
const ttsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Batas permintaan tercapai. Silakan tunggu 15 menit lalu coba lagi." }
});
app.use(express.static(path.join(__dirname, "public")));

const voiceMap = {
  Siti: "Aoede",
  Aris: "Fenrir",
  Dewi: "Kore",
  Bima: "Puck",
  Gita: "Leda",
  Rian: "Charon",
  Nia: "Aoede",
  Tika: "Zephyr"
};

app.get("/api/status", (_req, res) => {
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/tts", ttsLimiter, async (req, res) => {
  try {
    const { text, voice = "Aris", style = "Speak naturally in Indonesian, clear and friendly." } = req.body || {};
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "API key belum dipasang. Isi GEMINI_API_KEY di file .env." });
    }
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Masukkan teks yang ingin dijadikan suara." });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: "Teks maksimal 5.000 karakter per permintaan." });
    }

    const chosenVoice = voiceMap[voice] || "Fenrir";
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts",
        input: [{
          type: "user_input",
          content: [{
            type: "text",
            text: text.trim(),
            annotations: [{ type: "speech_metadata", style: String(style).slice(0, 500) }]
          }]
        }],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: chosenVoice }] }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.message || `Gemini API error (${response.status})`;
      return res.status(response.status === 429 ? 429 : 502).json({
        error: `Gagal membuat suara dari Gemini: ${detail}`
      });
    }

    let audioBase64 = payload?.output_audio?.data;
    if (!audioBase64 && Array.isArray(payload?.steps)) {
      for (const step of payload.steps) {
        if (step?.type === "model_output" && Array.isArray(step.content)) {
          for (const part of step.content) if (part?.type === "audio" && part?.data) audioBase64 = part.data;
        }
      }
    }
    if (!audioBase64) {
      return res.status(502).json({ error: "Gemini tidak mengembalikan data audio. Coba lagi atau periksa model TTS pada akun Anda." });
    }

    const wavBuffer = Buffer.from(audioBase64, "base64");
    // Gemini unary TTS returns WAV. Convert to MP3 on the server using ffmpeg-static.
    const ffmpeg = spawn(ffmpegPath, [
      "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
      "-vn", "-codec:a", "libmp3lame", "-q:a", "2", "-f", "mp3", "pipe:1"
    ]);
    const chunks = [];
    let ffmpegError = "";
    ffmpeg.stdout.on("data", chunk => chunks.push(chunk));
    ffmpeg.stderr.on("data", chunk => { ffmpegError += chunk.toString(); });
    ffmpeg.on("error", err => {
      if (!res.headersSent) res.status(500).json({ error: `Konversi MP3 gagal: ${err.message}` });
    });
    ffmpeg.on("close", code => {
      if (code !== 0 || chunks.length === 0) {
        if (!res.headersSent) res.status(500).json({ error: `Konversi MP3 gagal. ${ffmpegError.slice(0, 300)}` });
        return;
      }
      const mp3 = Buffer.concat(chunks);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", mp3.length);
      res.setHeader("Content-Disposition", 'attachment; filename="suaraku-narasi.mp3"');
      res.setHeader("Cache-Control", "no-store");
      res.send(mp3);
    });
    ffmpeg.stdin.on("error", () => {});
    ffmpeg.stdin.end(wavBuffer);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Terjadi kesalahan pada server. Periksa koneksi internet dan konfigurasi." });
  }
});

app.listen(PORT, () => {
  console.log(`SuaraKu berjalan di http://localhost:${PORT}`);
});
