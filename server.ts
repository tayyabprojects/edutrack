import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse body content
  app.use(express.json({ limit: '10mb' }));

  // API Endpoints: Gemini Report Generator
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { reportType, timePeriod, data, customApiKey } = req.body;

      const workingKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!workingKey) {
        return res.status(400).json({ 
          error: 'Gemini API key is missing. Please provide it in the input/settings.' 
        });
      }

      // Initialize Gemini SDK with working key and telemetry headers
      const ai = new GoogleGenAI({
        apiKey: workingKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = `You are an AI School Administrator and Consultant assistant specialized in Pakistani schools. 
Your goal is to parse school data logs (students, attendance, fees, exams, staff, expenses) inside a SaaS app called EduTrack, and produce a professional, highly informative, bilingual school analytics report.
Provide constructive, actionable feedback suitable for Pakistani school principal, parents, and owners.

Output your report strictly in JSON format as specified. Write details customized to the requested report:
- English section: Beautiful, structured, with sub-headings, key findings, and action items.
- Urdu section: Polished Urdu, respectful tone, similar structure under standard heading titles.`;

      const contentsPrompt = `Report Name: ${reportType}
Time Horizon: ${timePeriod}
School Ledger Database Context (JSON):
${JSON.stringify(data, null, 2)}

Please analyze this school ledger and output the report containing:
- Executive summary (مجموعی خلاصہ)
- Critical findings (اہم نتائج اور مشاہدات)
- Key administrative recommendations for improvement (اصلاحی اور انتظامی تجاویز)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contentsPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              english: {
                type: Type.STRING,
                description: 'The English translation of the report containing formatted markdown text.'
              },
              urdu: {
                type: Type.STRING,
                description: 'The Urdu (اردو) translation of the report in formatted markdown text.'
              }
            },
            required: ['english', 'urdu']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedReport = JSON.parse(responseText.trim());
      return res.json(parsedReport);
    } catch (error) {
      console.error('Gemini Report Creation failed:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred during AI generation' 
      });
    }
  });

  // Serve static assets in Vite development or production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTrack back-end running on http://localhost:${PORT}`);
  });
}

startServer();
