
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', 'public', 'Orçamento.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("Sheet Name:", sheetName);
    console.log("First 5 rows:");
    jsonData.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
} catch (error) {
    console.error("Error reading Excel:", error.message);
}
