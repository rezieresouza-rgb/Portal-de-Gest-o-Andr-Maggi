
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    { name: 'Ensino Fundamental', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx') },
    { name: 'Ensino Médio', path: path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino_Medio.xlsx') }
];

let results = {};

files.forEach(file => {
    if (!fs.existsSync(file.path)) {
        console.warn(`File not found: ${file.path}`);
        return;
    }

    const workbook = XLSX.readFile(file.path);
    results[file.name] = [];

    workbook.SheetNames.forEach((name, idx) => {
        const sheet = workbook.Sheets[name];
        if (!sheet['!ref']) return;
        const range = XLSX.utils.decode_range(sheet['!ref']);
        let count = 0;

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
                if (cell && cell.v && typeof cell.v === 'string') {
                    // Flexible regex for EF/EM codes
                    if (cell.v.match(/\(?(EF|EM)\d{2}[A-Z]{2}\d{2}\)?/i)) count++;
                }
            }
        }

        if (count > 0) {
            results[file.name].push({ index: idx, name: name, count: count });
        }
    });
});

fs.writeFileSync('scripts/bncc_scan_results.json', JSON.stringify(results, null, 2));
console.log('Scan completed. Results saved to scripts/bncc_scan_results.json');
