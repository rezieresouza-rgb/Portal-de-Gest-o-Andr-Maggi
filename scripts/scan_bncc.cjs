
const XLSX = require('xlsx');
const path = require('path');

const files = [
    { name: 'Ensino Fundamental', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx') },
    { name: 'Ensino Médio', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino_Medio.xlsx') }
];

files.forEach(file => {
    console.log(`\n--- ARQUIVO: ${file.name} ---`);
    try {
        const workbook = XLSX.readFile(file.path);
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            let count = 0;
            data.forEach(row => {
                if (!row) return;
                row.forEach(cell => {
                    if (typeof cell === 'string') {
                        const match = cell.match(/\(?(EF|EM)\d+[A-Z\d]+\)?/i);
                        if (match) count++;
                    }
                });
            });
            if (count > 0) {
                console.log(`Aba: ${sheetName.padEnd(25)} | Habilidades: ${count}`);
            }
        });
    } catch (error) {
        console.error(`Erro no arquivo ${file.name}:`, error.message);
    }
});
