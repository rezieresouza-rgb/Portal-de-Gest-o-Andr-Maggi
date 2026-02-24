
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    // Iterar todas as abas e se encontrar "Portu" ou "Portugue" (mesmo com encoding errado)
    workbook.SheetNames.forEach((name, idx) => {
        if (name.toLowerCase().includes('portu')) {
            console.log(`--- PORTUGUESA DETECTADA (IDX ${idx}: ${name}) ---`);
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            for (let i = 0; i < 30; i++) {
                if (data[i]) console.log(`L${i}: ${JSON.stringify(data[i])}`);
            }
        }
    });
} catch (error) {
    console.error('Erro:', error.message);
}
