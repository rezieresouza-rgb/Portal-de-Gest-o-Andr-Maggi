const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

console.log('PDF Parse Export:', typeof pdf);
console.log('PDF Parse Keys:', Object.keys(pdf));

async function extractPdfText(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        // Try both direct call and .default to handle different module formats
        const parse = typeof pdf === 'function' ? pdf : pdf.default;
        if (typeof parse !== 'function') {
            return `ERROR: pdf-parse is not a function (${typeof parse})`;
        }
        const data = await parse(dataBuffer);
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
