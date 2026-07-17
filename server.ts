import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/chat", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API Key is missing. Please configure it in Settings > Secrets." });
    }
    
    try {
      const { message, history } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "You are a helpful assistant for a Shoe Repair and Cobbler Management System. Provide tips on cobbler techniques, material suggestions, customer service drafts, or general management advice. Be concise and professional.",
        },
      });
      
      // If we wanted to pass history we could, but for simplicity we'll just send the current message 
      // or we can pass a formatted history string.
      const fullMessage = history && history.length > 0 
        ? `Previous Context:\n${history.map((m: any) => `${m.role}: ${m.content}`).join('\n')}\n\nCurrent Question: ${message}`
        : message;

      const response = await chat.sendMessage({ message: fullMessage });
      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to get AI response" });
    }
  });

  app.post("/api/notify/email", async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      // In a real application, you would integrate SendGrid, Postmark, AWS SES, etc. here.
      // For now, we simulate the email sending with a delay and a console log.
      console.log(`\n[EMAIL SERVICE] Sending email...`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}\n`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({ success: true, message: `Email sent successfully to ${to}` });
    } catch (error: any) {
      console.error("Email Notification Error:", error);
      res.status(500).json({ error: "Failed to send email notification" });
    }
  });

  app.post("/api/notify/sms", async (req, res) => {
    try {
      const { to, message } = req.body;
      // In a real application, you would integrate Twilio, SNS, MessageBird, etc. here.
      // For now, we simulate the SMS sending with a delay and a console log.
      console.log(`\n[SMS SERVICE] Sending SMS...`);
      console.log(`To: ${to}`);
      console.log(`Message: ${message}\n`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      res.json({ success: true, message: `SMS sent successfully to ${to}` });
    } catch (error: any) {
      console.error("SMS Notification Error:", error);
      res.status(500).json({ error: "Failed to send SMS notification" });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
