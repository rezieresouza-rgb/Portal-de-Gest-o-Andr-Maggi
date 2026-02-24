
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const masterFile = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_EI_EF_110518_versao_final_site.xlsx');

try {
    if (!fs.existsSync(masterFile)) {
        console.error('Master file not found!');
        process.exit(1);
    }

    const workbook = XLSX.readFile(masterFile);
    console.log('--- SHEET NAMES ---');
    workbook.SheetNames.forEach((name, idx) => {
        console.log(`[${idx}] ${name}`);
    });

    // Inspect first few rows of a likely sheet (e.g., Mathematics or Portuguese if present)
    // Let's just pick one with a promising name if we can see them.
} catch (error) {
    console.error('Erro:', error.message);
}
