
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

console.log("genAI keys:", Object.keys(genAI));
if (genAI.models) console.log("genAI.models keys:", Object.keys(genAI.models));

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model instance created successfully!");
  } catch (e) {
    console.log("Error creating model:", e.message);
  }
}

test();
