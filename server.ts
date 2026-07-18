import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
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

  app.post("/api/sync/google-sheets", async (req, res) => {
    try {
      const { url, payload } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Google Sheets Web App URL is required" });
      }

      console.log(`[SYNC SERVICE] Syncing to Google Sheets: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // Google Apps Script redirects (302) are handled by node-fetch/native fetch usually,
      // but sometimes we need to be careful. Native fetch in Node 18+ handles redirects.
      
      const data = await response.text();
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch (e) {
        jsonData = { raw: data };
      }

      res.json({ 
        success: response.ok, 
        status: response.status,
        data: jsonData 
      });
    } catch (error: any) {
      console.error("Google Sheets Sync Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync to Google Sheets" });
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
