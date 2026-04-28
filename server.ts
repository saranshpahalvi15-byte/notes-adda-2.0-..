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
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Gemini AI
  const apiKey = process.env.CUSTOM_API_KEY || process.env.GEMINI_API_KEY || '';
  console.log("API KEY PREFIX:", apiKey ? apiKey.substring(0, 5) : "MISSING");
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/debug-env", (req, res) => {
    import('fs').then(fs => fs.writeFileSync('server-env-dump.json', JSON.stringify(process.env, null, 2)));
    res.json({ 
      hasKey: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 5) : "MISSING",
      keyLength: apiKey ? apiKey.length : 0
    });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(500).json({ error: "API Key is missing. Please configure the CUSTOM_API_KEY or GEMINI_API_KEY environment variable." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Format messages for the Gemini API
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const systemInstruction = `You are an elite, highly capable AI Tutor and Academic Assistant for 'Notes Adda', a premium digital marketplace for student notes (Classes 9-12 in India). 
Your capabilities:
- You explain complex academic concepts (Math, Science, History, etc.) with extreme clarity, using analogies and step-by-step breakdowns.
- You format your responses beautifully using Markdown (bolding key terms, using bullet points, and providing code blocks or math formulas where appropriate).
- You are encouraging, patient, and adapt to the student's level of understanding.
- You help students navigate the Notes Adda platform and recommend studying strategies.
- ***NEW FEATURE***: You should inform students about "Mock Tests" which they can purchase. Once purchased, they can upload their answer sheets for "Expert Evaluation", where our experts will evaluate their step-by-step methods and assign marks exactly like a human teacher using the official solution keys!
- If asked a question outside of academics or the platform, politely guide the conversation back to their studies.
Always strive to be the most helpful, insightful, and powerful tutor they have ever interacted with.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview', // Switched to 3-flash-preview as per SDK guidelines
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      const keyPrefix = apiKey ? apiKey.substring(0, 5) : "MISSING";
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate response", details: `${error.message} (Key prefix: ${keyPrefix})` });
      } else {
        res.write(`data: ${JSON.stringify({ error: `${error.message || "Failed to generate response"} (Key prefix: ${keyPrefix})` })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/evaluate-mock-test", async (req, res) => {
    try {
      const { userAnswersBase64, solutionBase64, userMimeType, solutionMimeType, maxMarks } = req.body;
      
      if (!userAnswersBase64 || !solutionBase64) {
        return res.status(400).json({ error: "Missing required files (user answers or solution)" });
      }

      if (!apiKey) {
        return res.status(500).json({ error: "API Key is missing." });
      }

      const systemInstruction = `You are an expert, meticulous human evaluator for academic tests.
You are given two documents:
1. The student's written answers.
2. The official answer key/solution provided by the examiner.

Your task:
- Carefully compare the student's answers against the official solution.
- Evaluate step-by-step just like a human teacher would.
- Assign marks for each question based on accuracy, methodology, and correctness according to the provided solution.
- Output a detailed evaluation report.
- Clearly state the Total Marks obtained out of ${maxMarks || 100} at the end.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // use a pro model for better reasoning and pdf handling
        contents: [
          {
            role: 'user',
            parts: [
               { inlineData: { mimeType: solutionMimeType || 'application/pdf', data: solutionBase64 } },
               { text: "Here is the OFFICIAL SOLUTION. Please use this as the absolute truth for grading." },
               { inlineData: { mimeType: userMimeType || 'application/pdf', data: userAnswersBase64 } },
               { text: `Here are the STUDENT'S ANSWERS. Please evaluate them against the official solution and assign marks.` }
            ]
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      res.json({ evaluation: response.text });
    } catch (error: any) {
      console.error('Error in mock test evaluation:', error);
      res.status(500).json({ error: "Failed to evaluate mock test", details: error.message });
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
        } as any);
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
