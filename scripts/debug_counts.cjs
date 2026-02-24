
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    workbook.SheetNames.forEach((sheetName, idx) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let localCount = 0;

        data.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (typeof cell === 'string') {
                    const match = cell.match(/EF\d+[A-Z\d]+/i);
                    if (match) localCount++;
                }
            });
        });
        console.log(`Index ${idx}: [${sheetName}] | Matches: ${localCount}`);
    });
} catch (error) {
    console.error('Erro:', error.message);
}
