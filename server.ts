import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Enable CORS for all origins (allows Vercel frontend to talk to Render backend)
  app.use(cors());
  app.use(express.json());

  // Initialize Gemini AI
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is not configured" });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate response", details: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || "Failed to generate response" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/send-receipt", async (req, res) => {
    try {
      const { email, name, items, total } = req.body;

      if (!email || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create a test account for development if no real SMTP is provided
      let transporter;
      
      if (process.env.SMTP_PASS) {
        // Use Gmail with explicit SMTP settings
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // use SSL
          auth: {
            user: 'saransh1860@gmail.com',
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      // Generate HTML for items
      const itemsHtml = items.map((item: any) => {
        // Convert drive/dropbox links to direct download links
        let downloadUrl = item.pdfUrl || '';
        try {
          const urlObj = new URL(downloadUrl);
          if (urlObj.hostname.includes('drive.google.com')) {
            const match = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
            } else {
              const id = urlObj.searchParams.get('id');
              if (id) {
                downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
              }
            }
          } else if (urlObj.hostname.includes('dropbox.com')) {
            urlObj.searchParams.set('dl', '1');
            downloadUrl = urlObj.toString();
          }
        } catch (e) {
          // ignore invalid URLs
        }

        return `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #111827;">${item.title}</h3>
            <p style="color: #4b5563; margin-bottom: 15px;">Price: ₹${item.price}</p>
            ${downloadUrl 
              ? `<a href="${downloadUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download PDF</a>`
              : `<p style="color: #4b5563; font-style: italic;">Please visit your dashboard to view the contents of this bundle.</p>`
            }
          </div>
        `;
      }).join('');

      const info = await transporter.sendMail({
        from: '"NotesAdda" <saransh1860@gmail.com>',
        to: email,
        subject: "Your NotesAdda Purchase Receipt & Downloads",
        html: `
          <div style="font-family: Arial, sans-serif; max-w-2xl; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Thank you for your purchase, ${name || 'Student'}!</h1>
            <p style="color: #374151; font-size: 16px;">Your payment of <strong>₹${total}</strong> was successful. You can download your purchased notes below:</p>
            
            <div style="margin-top: 30px;">
              ${itemsHtml}
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              If you have any questions, please reply to this email or use our AI Tutor on the website.
            </p>
          </div>
        `,
      });

      console.log("Email sent successfully. Message ID: %s", info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("Preview URL (Ethereal): %s", previewUrl);
      }

      res.json({ success: true, previewUrl });
    } catch (error: any) {
      console.error("CRITICAL: Error sending email:", error.message || error);
      if (error.response) {
        console.error("SMTP Response:", error.response);
      }
      res.status(500).json({ error: "Failed to send email", details: error.message });
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
