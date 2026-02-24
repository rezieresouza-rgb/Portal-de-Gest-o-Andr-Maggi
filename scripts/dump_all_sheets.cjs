
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('--- ALL SHEETS DUMP ---');
    sheetNames.forEach((name, idx) => {
        console.log(`\n[${idx}] SHEET NAME: "${name}"`);
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Print first 5 non-empty rows
        let printed = 0;
        for (let i = 0; i < data.length && printed < 5; i++) {
            const row = data[i];
            if (row && row.length > 0) {
                console.log(`  R${i}: ${JSON.stringify(row).substring(0, 150)}`);
                printed++;
            }
        }
    });
} catch (error) {
    console.error('Erro:', error.message);
}
