
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    { name: 'Ensino Fundamental', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx') },
    { name: 'Ensino Médio', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino_Medio.xlsx') }
];

files.forEach(file => {
    console.log(`\n--- FILE: ${file.name} ---`);
    if (!fs.existsSync(file.path)) {
        console.warn(`File not found: ${file.path}`);
        return;
    }

    const workbook = XLSX.readFile(file.path);
    workbook.SheetNames.forEach((name, idx) => {
        console.log(`[${idx}] "${name}"`);
        const sheet = workbook.Sheets[name];
        if (!sheet['!ref']) return;
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        for (let i = 0; i < 5; i++) {
            if (data[i]) console.log(`  Row ${i}: ${JSON.stringify(data[i]).substring(0, 100)}`);
        }
    });
});
