
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'BNCC_Ensino Fundamental.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    sheetNames.forEach((name, idx) => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Se a aba tem muitos "EFxxLP", é a de Português
        let lpCount = 0;
        data.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (typeof cell === 'string' && cell.includes('EF') && cell.includes('LP')) lpCount++;
            });
        });

        if (lpCount > 10) {
            console.log(`Bingo! Aba de Português detectada no Índice ${idx}: "${name}" com ${lpCount} habilidades.`);
            console.log('--- AMOSTRA PORTUGUÊS ---');
            let samples = 0;
            for (let i = 0; i < data.length && samples < 20; i++) {
                const row = data[i];
                if (row && row.some(c => typeof c === 'string' && c.includes('EF'))) {
                    console.log(`L${i}: ${JSON.stringify(row)}`);
                    samples++;
                }
            }
        }
    });
} catch (error) {
    console.error('Erro:', error.message);
}
