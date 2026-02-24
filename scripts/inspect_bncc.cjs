
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['História'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Imprimir as linhas 2, 3, 4, 5
    for (let i = 2; i < 10; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
