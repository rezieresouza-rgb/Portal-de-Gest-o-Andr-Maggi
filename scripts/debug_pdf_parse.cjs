
const fs = require('fs');
const pdf = require('pdf-parse');

console.log('PDF type:', typeof pdf);
console.log('PDF keys:', Object.keys(pdf));

const pdfPath = 'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\arquivos sistema\\atualiação 23-03-26\\8º ano A.pdf';
let dataBuffer = fs.readFileSync(pdfPath);

async function run() {
    try {
        const data = await pdf(dataBuffer);
        console.log('--- CONTENT START ---');
        console.log(data.text);
        console.log('--- CONTENT END ---');
    } catch (err) {
        console.error('Error during parsing:', err);
    }
}

run();
