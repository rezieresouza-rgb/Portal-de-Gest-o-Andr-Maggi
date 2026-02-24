
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino_Medio.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names EM:', workbook.SheetNames);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 0; i < 10; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
