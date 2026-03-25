
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

async function listModels() {
  try {
    const result = await ai.models.list();
    console.log("Available models:");
    result.models.forEach(m => console.log(m.name));
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}

listModels();
