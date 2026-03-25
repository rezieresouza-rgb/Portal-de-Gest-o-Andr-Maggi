
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!apiKey || !supabaseUrl || !supabaseKey) {
  console.error("Missing configuration in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenAI(apiKey);
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeFile(filePath) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                description: { type: Type.STRING },
                value: { type: Type.NUMBER },
                type: { type: Type.STRING, description: "ENTRY or EXPENSE" }
              },
              required: ["date", "description", "value", "type"]
            }
          }
        }
      }
    }
  });

  const base64 = fs.readFileSync(filePath).toString("base64");
  
  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: "application/pdf"
      }
    },
    "Você é um analista financeiro. Extraia todas as transações (entradas e saídas) deste extrato bancário. Indique ENTRY para entradas e EXPENSE para saídas. Retorne um JSON estruturado."
  ]);

  return JSON.parse(result.response.text()).transactions;
}

async function run() {
  const statementFiles = [
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/janeiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/fevereiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/março.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento janeiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento fevereiro.pdf',
    'C:/Users/rezie/OneDrive/Área de Trabalho/analisar/investimento março.pdf'
  ];

  console.log("Analyzing bank statements...");
  let bankTransactions = [];
  for (const file of statementFiles) {
    if (fs.existsSync(file)) {
      console.log(`Processing ${file}...`);
      const txs = await analyzeFile(file);
      bankTransactions = bankTransactions.concat(txs);
    }
  }

  // Fetch DB transactions for merenda
  const { data: funds } = await supabase.from('funds').select('id').eq('name', 'merenda');
  const merendaId = funds[0].id;
  const { data: dbTransactions } = await supabase.from('transactions').select('*').eq('fund_id', merendaId);

  console.log("\n--- DISCREPANCY ANALYSIS ---");
  
  // Group by day-description-value for comparison
  const normalize = (tx) => `${tx.date}_${tx.description.toUpperCase().trim()}_${Number(tx.value).toFixed(2)}`;
  
  const dbMap = new Set(dbTransactions.map(tx => `${tx.date}_${tx.description.trim().toUpperCase()}_${Number(tx.gross_value).toFixed(2)}`));
  
  console.log("\nTransactions in BANK but MISSING in DB:");
  bankTransactions.forEach(tx => {
    // Basic filter to ignore common bank fees or transfers if they are not relevant, 
    // but the user wants to know why it's not matching, so show all.
    const key = `${tx.date}_${tx.description.toUpperCase().trim()}_${tx.value.toFixed(2)}`;
    if (!dbMap.has(key)) {
      console.log(`[${tx.date}] ${tx.type.padEnd(8)} | R$ ${tx.value.toFixed(2).padStart(10)} | ${tx.description}`);
    }
  });

  console.log("\nTransactions in DB but MISSING in BANK:");
  dbTransactions.forEach(tx => {
    const key = `${tx.date}_${tx.description.trim().toUpperCase()}_${Number(tx.gross_value).toFixed(2)}`;
    const bankMatches = bankTransactions.some(btx => {
        const bKey = `${btx.date}_${btx.description.toUpperCase().trim()}_${btx.value.toFixed(2)}`;
        // Allow fuzzy description matching? For now exact.
        return bKey === key;
    });
    if (!bankMatches) {
        console.log(`[${tx.date}] ${tx.type.padEnd(8)} | R$ ${Number(tx.gross_value).toFixed(2).padStart(10)} | ${tx.description}`);
    }
  });
}

run().catch(console.error);
