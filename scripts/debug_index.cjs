
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[1]]; // Tentar o índice 1
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Checking Sheet Index 1: ${workbook.SheetNames[1]}`);
    for (let i = 0; i < 20; i++) {
        console.log(`R${i}: ${JSON.stringify(data[i])}`);
    }
} catch (error) {
    console.error('Erro:', error.message);
}
