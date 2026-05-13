import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post('/api/chat', async (req, res) => {
    try {
      const { query, systemPrompt } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Missing GEMINI_API_KEY environment variable');
        return res.status(500).json({ error: 'API Key tidak ditemukan di environment server' });
      }

      const client = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      if (!response.text) {
        throw new Error('Model tidak mengembalikan teks');
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal Server Error';
      res.status(status).json({ error: message });
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
