import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractPdfText(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        return `ERROR: ${error.message}`;
    }
}

const rootFolder = "C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\PREGÃO";
const subFolder = path.join(rootFolder, "CONTRATOS ASSINADOS");

async function processFolder(folder) {
    if (!fs.existsSync(folder)) {
        console.log(`Folder not found: ${folder}`);
        return;
    }
    const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.pdf'));
    for (const file of files) {
        if (file === 'as.pdf') continue;
        const filePath = path.join(folder, file);
        console.log(`\n--- FILE: ${file} ---`);
        const text = await extractPdfText(filePath);
        console.log(text.substring(0, 5000));
    }
}

(async () => {
    console.log("Processing root folder...");
    await processFolder(rootFolder);
    console.log("\nProcessing CONTRATOS ASSINADOS...");
    await processFolder(subFolder);
})();
