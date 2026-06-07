import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";

dotenv.config();

// Initialize Gemini SDK with telemetry header as instructed in the skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route - YouTube Transcript Fetcher
  app.post("/api/get-transcript", async (req, res) => {
    try {
      const { videoId } = req.body;
      if (!videoId) {
        return res.status(400).json({ error: "videoId is required" });
      }

      console.log(`Fetching transcript for videoId: ${videoId}`);
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      
      const text = transcriptData.map((item: any) => item.text).join(" ");
      res.json({ text, lines: transcriptData });
    } catch (error: any) {
      console.error("YouTube Transcript Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch transcript from YouTube. Make sure captions / subtitles are enabled on this video." });
    }
  });

  // API Route - AI Japanese Tutor (Aiko-sensei)
  app.post("/api/tutor/chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Base system instruction instructing Gemini to act as Aiko-sensei, an encouraging N4 Japanese tutor
      const systemInstruction = `You are Aiko-sensei (愛子先生), a helpful, supportive, and extremely patient native Japanese language tutor.
Your core expertise is Japanese Language Proficiency Test (JLPT) level N4.
Keep your explanations highly accessible, encouraging, clear, and structured.
When explaining Japanese sentences, always provide:
1. The Japanese writing (with Kanji and Hiragana furigana if possible, e.g., 漢字 (かんじ)).
2. The Romaji pronunciation (e.g., kanji).
3. The English translation.

Provide mnemonic devices, tips to remember them, and contrast them with similar N5 or N4 items when useful.
Format your responses beautifully using structured Markdown (bullet points, bold highlights, code blocks for formulas).
Keep explanations highly interactive and friendly. Never use dry, clinical language. Use gentle and polite Japanese honorifics (e.g. "~san", "Konnichiwa!").`;

      // Structure contents from history if available, appending the new user message
      const chatContents = [];
      
      // If we have current lesson context, let's inject it as system prepended state
      let promptPrefix = "";
      if (context) {
        promptPrefix = `[Current Context - Lesson Day ${context.day}: "${context.title}", Theme: "${context.theme}"]\n`;
      }

      const formattedContents = [
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        })),
        {
          role: "user",
          parts: [{ text: `${promptPrefix}${message}` }]
        }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with the AI Tutor" });
    }
  });

  // API Route - Shadowing Evaluation
  app.post("/api/grading/shadow", async (req, res) => {
    try {
      const { originalText, transcribedText, romaji, translation } = req.body;

      if (!originalText || !transcribedText) {
        return res.status(400).json({ error: "Original and transcribed texts are required" });
      }

      const prompt = `Assess the following Japanese shadowing attempt by a student learning JLPT N4 Japanese:

Target Japanese (Kanji/Hiragana): "${originalText}"
Target Pronunciation (Romaji): "${romaji || ''}"
English Translation: "${translation || ''}"

Student's Spoken Transcription: "${transcribedText}"

Perform the following analysis:
1. Provide a numerical Match Score (0 to 100) based strictly on phonetic match, accuracy of syllables, and missing/extra words. If the texts represent a perfect match (transcription error or speech variations aside), give a high score.
2. Provide a breakdown of what parts were pronounced extremely well.
3. Call out any minor pronunciation or reading slips (e.g., misreading particles like 'ha' as 'ha' instead of 'wa', long vowels, double consonants).
4. Provide constructive, positive coaching on how a native speaker sounds out these sounds (pitch accent hints or rhythm clues).
5. Add a supportive, inspiring sign-off as Aiko-sensei in simple Japanese + English!

Return your response in a structured JSON object with exactly these fields:
- score: number (0-100)
- resultText: string (Markdown formatted description of phonetic alignment)
- wellDoneParts: string (what was correct)
- improvementTips: string (helpful specific phonetic tips)
- feedbackMessage: string (warm encouragement)

Make sure the JSON response does not contain any wrapping except standard JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
          responseSchema: {
            type: "OBJECT",
            properties: {
              score: { type: "INTEGER", description: "Match score between 0 and 100" },
              resultText: { type: "STRING", description: "Assessment of transcription alignment" },
              wellDoneParts: { type: "STRING", description: "Sections of the spoken audio that were spot-on" },
              improvementTips: { type: "STRING", description: "Actionable phonetic feedback" },
              feedbackMessage: { type: "STRING", description: "Encouragement" }
            },
            required: ["score", "resultText", "wellDoneParts", "improvementTips", "feedbackMessage"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Shadow grading error:", error);
      res.status(500).json({ error: error.message || "An error occurred during grading" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
