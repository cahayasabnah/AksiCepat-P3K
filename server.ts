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

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', node_env: process.env.NODE_ENV });
  });

  // Gemini API Proxy
  app.post('/api/chat', async (req, res) => {
    console.log('Incoming AI Request:', { 
      hasQuery: !!req.body.query, 
      hasPrompt: !!req.body.systemPrompt 
    });

    try {
      const { query, systemPrompt } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('CRITICAL: GEMINI_API_KEY is missing');
        return res.status(500).json({ error: 'API Key tidak ditemukan di environment server' });
      }

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt 
      });
      
      const result = await model.generateContent(query);
      const response = result.response;
      const text = response.text();

      if (!text) {
        console.error('Empty response from Gemini');
        throw new Error('Model tidak mengembalikan teks');
      }

      res.json({ text });
    } catch (error: any) {
      console.error('Gemini API Error Detail:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
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
