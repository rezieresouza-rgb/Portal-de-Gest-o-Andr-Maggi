
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('--- ALL SHEETS WITH CHAR CODES ---');
    sheetNames.forEach(name => {
        let charCodes = [];
        for (let i = 0; i < name.length; i++) {
            charCodes.push(name.charCodeAt(i));
        }
        console.log(`Sheet: "${name}" | Codes: [${charCodes.join(',')}]`);
    });
} catch (error) {
    console.error('Erro:', error.message);
}
