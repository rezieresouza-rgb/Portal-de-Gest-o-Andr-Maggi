
const fs = require('fs');
const path = require('path');

const candidates = [
    'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\arquivos sistema\\atualiação 23-03-26\\8º ano A.pdf',
    'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\arquivos sistema\\8º ano A.pdf',
    'C:\\Users\\rezie\\Downloads\\8º ano A.pdf'
];

candidates.forEach(p => {
    if (fs.existsSync(p)) {
        console.log(`FOUND: ${p}`);
    } else {
        console.log(`NOT FOUND: ${p}`);
    }
});
