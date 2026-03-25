
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!apiKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing config!");
  process.exit(1);
}

const genAI = new GoogleGenAI(apiKey);
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeFile(filePath) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const base64 = fs.readFileSync(filePath).toString("base64");
  
  const prompt = "Você é um especialista em extratos bancários. Extraia todas as transações (Data, Descrição, Valor, Tipo: Entrada/Saída) deste extrato em formato JSON. Formato esperado: { \"transactions\": [ { \"date\": \"YYYY-MM-DD\", \"description\": \"...\", \"value\": 123.45, \"type\": \"ENTRY\" | \"EXPENSE\" } ] }. Não inclua explicações, apenas o JSON.";

  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: "application/pdf" } },
    prompt
  ]);

  const text = result.response.text();
  // Clean potential markdown code blocks
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned).transactions;
}

async function run() {
  const statementFiles = [
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/janeiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/fevereiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/março.pdf'
  ];

  let bankTransactions = [];
  for (const file of statementFiles) {
    if (fs.existsSync(file)) {
      console.log(`Processing ${file}...`);
      try {
        const txs = await analyzeFile(file);
        bankTransactions = bankTransactions.concat(txs);
      } catch (e) {
        console.error(`Error in ${file}:`, e.message);
      }
    }
  }

  const { data: funds } = await supabase.from('funds').select('id').eq('name', 'merenda');
  const merendaId = funds[0].id;
  const { data: dbTransactions } = await supabase.from('transactions').select('*').eq('fund_id', merendaId);

  console.log("\n--- ANALYSIS RESULTS ---");
  const dbMap = new Set(dbTransactions.map(tx => `${tx.date}_${tx.description.trim().toUpperCase()}_${Number(tx.gross_value).toFixed(2)}`));

  console.log("\nMISSING IN DATABASE:");
  bankTransactions.forEach(tx => {
    const key = `${tx.date}_${tx.description.toUpperCase().trim()}_${tx.value.toFixed(2)}`;
    if (!dbMap.has(key)) {
      console.log(`[${tx.date}] ${tx.type.padEnd(8)} | R$ ${tx.value.toFixed(2).padStart(10)} | ${tx.description}`);
    }
  });
}

run().catch(console.error);
