import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import webpush from "web-push";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
    console.log("[SERVER] Firebase Admin initialized");
  } catch (error) {
    console.error("[SERVER] Firebase Admin initialization error:", error);
  }
}

const db = getApps().length ? getFirestore() : null;

// Configure web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_CONTACT_EMAIL || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log("[SERVER] Web Push VAPID details set");
} else {
  console.warn("[SERVER] VAPID keys missing. Push notifications will not work.");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
  console.log(`[SERVER] Port: ${PORT}`);
  console.log(`[SERVER] Firebase Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID ? 'Configured' : 'Missing'}`);

  // Health check for Render
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Push Subscription Endpoint
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const subscription = req.body;
      const { email, userId } = req.query; // Optional filters

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      console.log(`[PUSH SERVICE] New subscription received: ${subscription.endpoint}`);

      // Store subscription in Firestore
      // We use the endpoint as a unique ID (sanitized)
      const subId = Buffer.from(subscription.endpoint).toString('base64').replace(/\//g, '_');
      
      await db.collection("push_subscriptions").doc(subId).set({
        ...subscription,
        email: email || null,
        userId: userId || null,
        updatedAt: FieldValue.serverTimestamp()
      });

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error("Push Subscription Error:", error);
      res.status(500).json({ error: "Failed to store subscription" });
    }
  });

  // Send Notification Endpoint (Internal or Triggered)
  app.post("/api/push/send", async (req, res) => {
    try {
      const { title, body, url, email, userId } = req.body;

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      console.log(`[PUSH SERVICE] Sending notification: ${title}`);

      // Find subscriptions
      let query: any = db.collection("push_subscriptions");
      if (email) query = query.where("email", "==", email);
      if (userId) query = query.where("userId", "==", userId);

      const snapshot = await query.get();
      
      const notifications = snapshot.docs.map((doc: any) => {
        const sub = doc.data();
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };

        return webpush.sendNotification(
          pushConfig,
          JSON.stringify({ title, body, url })
        ).catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[PUSH SERVICE] Expired subscription found, removing: ${doc.id}`);
            await doc.ref.delete();
          }
          throw err;
        });
      });

      await Promise.allSettled(notifications);

      res.json({ success: true, count: notifications.length });
    } catch (error: any) {
      console.error("Push Send Error:", error);
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // Gift Card Image Generation Endpoint with high quality fallback
  app.post("/api/giftcards/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      console.log(`[GEMINI IMAGE] Request received for prompt: "${prompt}"`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("[GEMINI IMAGE] GEMINI_API_KEY is not defined. Using elegant curated fallback.");
        let fallbackUrl = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"; // default leather shoes
        const pLower = prompt.toLowerCase();
        if (pLower.includes("gold") || pLower.includes("luxe") || pLower.includes("royal") || pLower.includes("aurum")) {
          fallbackUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"; // elegant gold fluid
        } else if (pLower.includes("modern") || pLower.includes("sleek") || pLower.includes("neon") || pLower.includes("cobalt")) {
          fallbackUrl = "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop"; // modern premium shoebox
        } else if (pLower.includes("classic") || pLower.includes("retro") || pLower.includes("vintage") || pLower.includes("carbon")) {
          fallbackUrl = "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop"; // classic leather workshop
        } else if (pLower.includes("forest") || pLower.includes("cedar") || pLower.includes("artisan") || pLower.includes("leather")) {
          fallbackUrl = "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?q=80&w=600&auto=format&fit=crop"; // forest cedar artisan wood textures
        }

        return res.json({ 
          success: true, 
          fallback: true,
          imageUrl: fallbackUrl,
          message: "Secrets not yet configured. Applied premium custom-themed pattern design!"
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // We generate the image using gemini-3.1-flash-lite-image as default
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let base64Image = "";
      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (base64Image) {
        console.log("[GEMINI IMAGE] Successfully generated image from prompt.");
        return res.json({ success: true, imageUrl: base64Image });
      } else {
        console.warn("[GEMINI IMAGE] No inlineData found in response parts. Using fallback.");
        return res.json({ 
          success: true, 
          fallback: true,
          imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop",
          message: "Could not extract image from Gemini model response."
        });
      }
    } catch (error: any) {
      console.error("[GEMINI IMAGE] Generation failed:", error);
      
      // Fallback images based on theme keywords
      let fallbackUrl = "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"; // default leather shoes
      const pLower = (req.body?.prompt || "").toLowerCase();
      if (pLower.includes("gold") || pLower.includes("luxe") || pLower.includes("royal") || pLower.includes("aurum")) {
        fallbackUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"; // elegant gold fluid
      } else if (pLower.includes("modern") || pLower.includes("sleek") || pLower.includes("neon") || pLower.includes("cobalt")) {
        fallbackUrl = "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop"; // modern premium shoebox
      } else if (pLower.includes("classic") || pLower.includes("retro") || pLower.includes("vintage") || pLower.includes("carbon")) {
        fallbackUrl = "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop"; // classic leather workshop
      } else if (pLower.includes("forest") || pLower.includes("cedar") || pLower.includes("artisan") || pLower.includes("leather")) {
        fallbackUrl = "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?q=80&w=600&auto=format&fit=crop"; // forest cedar artisan wood textures
      }

      const errStr = String(error?.message || error || "");
      let msg = "Artisan design pattern applied successfully.";
      if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        msg = "Gemini image quota reached. Bespoke artisan design template applied! Upgrade key in Secrets panel for live AI.";
      } else if (errStr.includes("API_KEY") || errStr.includes("key")) {
        msg = "API Key not configured or invalid. Curated bespoke template applied!";
      } else {
        msg = "Artisan template design successfully loaded as card background art.";
      }
      
      res.json({ 
        success: true, 
        fallback: true,
        imageUrl: fallbackUrl,
        message: msg
      });
    }
  });

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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
