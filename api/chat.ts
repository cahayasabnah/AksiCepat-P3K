import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, systemPrompt } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return res.status(500).json({ error: 'API Key tidak ditemukan di environment server (Vercel)' });
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
      throw new Error('Model tidak mengembalikan teks');
    }

    res.status(200).json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    res.status(status).json({ error: message });
  }
}
