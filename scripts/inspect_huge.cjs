
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const hugeFile = path.join('c:', 'Users', 'rezie', 'Downloads', 'divulgacao_anos_finais_escolas_2023.xlsx');

try {
    const workbook = XLSX.readFile(hugeFile, { bookSheets: true });
    console.log('--- SHEET NAMES (HUGE FILE) ---');
    workbook.SheetNames.forEach((name, idx) => {
        console.log(`[${idx}] ${name}`);
    });
} catch (error) {
    console.error('Error:', error.message);
}
