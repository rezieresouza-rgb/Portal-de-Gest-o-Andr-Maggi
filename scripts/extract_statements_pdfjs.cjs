
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist');

async function extractPdfText(pdfPath) {
    try {
        const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
        const pdfDoc = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    } catch (error) {
        return `ERROR: ${error.message}`;
    }
}

const statementFolder = "C:/Users/rezie/OneDrive/Área de Trabalho/analisar";

async function processFolder(folder) {
    if (!fs.existsSync(folder)) {
        console.log(`Folder not found: ${folder}`);
        return;
    }
    const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.pdf'));
    for (const file of files) {
        const filePath = path.join(folder, file);
        console.log(`\n\n=== FILE: ${file} ===`);
        const text = await extractPdfText(filePath);
        console.log(text);
    }
}

(async () => {
    console.log("Processing bank statements...");
    await processFolder(statementFolder);
})();
