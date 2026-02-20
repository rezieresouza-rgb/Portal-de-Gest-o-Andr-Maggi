import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually since we don't want to rely on dotenv package availability
const envPath = path.resolve(__dirname, '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 10) + "...");

const main = async () => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        console.log("Fetching available models...");

        // The SDK structure for listing models might vary, checking documentation approach or standard fetch
        // Since @google/genai 1.3.0 is a wrapper, we try the exposed method.
        // If explicit listModels isn't on the root, we might need to access it differently.
        // Based on library patterns:

        // Note: The new @google/genai might not expose listModels directly on the client instance the same way as google-generative-ai.
        // Let's try to infer or fallback to a raw fetch if needed, but let's assume models.list() or similar.

        // Attempt standard listing if available, or just try a simple generate to see if it works with specific models.
        // Since I cannot verify the SDK signature of @google/genai 1.3.0 exactly from here without docs, 
        // I will try a raw fetch to the API endpoint which is universal.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        console.log("Written to models.json");
    } catch (error) {
        console.error("Error listing models:", error);
    }
};

main();
