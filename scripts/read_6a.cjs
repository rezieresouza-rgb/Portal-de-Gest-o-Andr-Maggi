const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\arquivos sistema\\atualiação 23-03-26\\6º ano A.pdf';
let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
