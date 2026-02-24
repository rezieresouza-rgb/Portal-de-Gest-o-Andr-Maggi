
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('--- SCAN GERAL DE HABILIDADES ---');
    sheetNames.forEach((name, idx) => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let count = 0;

        data.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (typeof cell === 'string') {
                    const match = cell.match(/EF\d+[A-Z\d]{2,}/i);
                    if (match) count++;
                }
            });
        });

        console.log(`[${idx}] Aba: "${name}" | Habilidades: ${count}`);
    });
} catch (error) {
    console.error('Erro:', error.message);
}
