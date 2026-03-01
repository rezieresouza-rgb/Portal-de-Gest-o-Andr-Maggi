const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !apiKey) {
    console.error("Missing Supabase or Gemini env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

async function parseAndInsert() {
    const filePath = "C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\HABILIDADES BNCC\\EF69LP01 AO EF69LP56.pdf";

    if (!fs.existsSync(filePath)) {
        console.error("File not found at: ", filePath);
        return;
    }

    console.log("Reading PDF...");
    const dataBuffer = fs.readFileSync(filePath);
    const base64Data = dataBuffer.toString('base64');
    const mimeType = 'application/pdf';

    console.log("Sending to Gemini for extraction...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                },
                {
                    text: `Você é um coordenador pedagógico. Analise este PDF e extraia TODOS os códigos e descrições das habilidades de LÍNGUA PORTUGUESA (EF69LPxx).
            Retorne um JSON seguindo estritamente este formato. Cuidado para não pular nenhuma.`
                }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    skills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                code: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["code", "description"]
                        }
                    }
                },
                required: ["skills"]
            },
            temperature: 0.1
        }
    });

    const parsed = JSON.parse(response.text || '{"skills": []}');
    const skills = parsed.skills || [];

    console.log(`Gemini extracted ${skills.length} skills!`);

    const skillsToInsert = skills.map(s => ({
        code: s.code.trim(),
        description: s.description.trim(),
        subject: "LÍNGUA PORTUGUESA",
        year_range: "EF69"
    }));

    console.log("First 2 skills: ", skillsToInsert.slice(0, 2));

    if (skillsToInsert.length === 0) {
        console.log("No skills found.");
        return;
    }

    console.log("Inserting into Supabase 'bncc_skills'...");
    const { data: result, error } = await supabase
        .from('bncc_skills')
        .upsert(skillsToInsert, { onConflict: 'code' })
        .select();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log(`Successfully inserted/updated ${result ? result.length : 'unknown'} skills!`);
    }
}

parseAndInsert();
