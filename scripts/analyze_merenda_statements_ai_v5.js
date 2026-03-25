
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' }); // Changed to v1

async function analyzeFile(filePath) {
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const base64 = fs.readFileSync(filePath).toString("base64");
  
  const prompt = "Você é um especialista em extratos bancários. Extraia todas as transações (Data, Descrição, Valor, Tipo: Entrada/Saída) deste extrato em formato JSON. Formato esperado: { \"transactions\": [ { \"date\": \"YYYY-MM-DD\", \"description\": \"...\", \"value\": 123.45, \"type\": \"ENTRY\" | \"EXPENSE\" } ] }. Não inclua explicações, apenas o JSON.";

  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: "application/pdf" } },
    prompt
  ]);

  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned).transactions;
}

async function run() {
  const file = 'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/fevereiro.pdf';
  if (fs.existsSync(file)) {
    console.log(`Processing ${file}...`);
    const txs = await analyzeFile(file);
    console.log(JSON.stringify(txs, null, 2));
  }
}

run();
