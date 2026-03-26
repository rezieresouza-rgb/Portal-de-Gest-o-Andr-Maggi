
const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\arquivos sistema\\atualiação 23-03-26\\8º ano A.pdf';
let dataBuffer = fs.readFileSync(pdfPath);

async function run() {
    try {
        const data = await pdf(dataBuffer);
        console.log(data.text);
    } catch (err) {
        console.error(err);
    }
}

run();
