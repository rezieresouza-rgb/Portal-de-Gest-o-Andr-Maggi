const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\rezie\\OneDrive\\Área de Trabalho\\divulgacao_anos_finais_escolas_2025.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

const targetSchoolId = 51190826; // EE ANDRE ANTONIO MAGGI
let targetSchool = null;

// Find the exact keys
const keys = Object.keys(data[0]);
// Let's identify the column names for School ID, State, City, IDEB 2023
// Usually:
// 'SG_UF', 'CO_MUNICIPIO', 'NO_MUNICIPIO', 'ID_ESCOLA' (or 'CO_ENTIDADE'), 'NO_ESCOLA'
// 'VL_OBSERVADO_2023' or 'IDEB_2023'

const idCol = keys.find(k => k.includes('ESCOLA') && (k.includes('ID_') || k.includes('CO_')));
const nameCol = keys.find(k => k.includes('ESCOLA') && k.includes('NO_'));
const ufCol = keys.find(k => k.includes('UF'));
const cityCol = keys.find(k => k.includes('MUNICIPIO') && k.includes('NO_'));
const idebCol = keys.find(k => k.includes('OBSERVADO_2023') || k.includes('IDEB_2023') || k.includes('2023') && k.includes('VL_OBSERVADO'));

console.log('Columns identified:', { idCol, nameCol, ufCol, cityCol, idebCol });

const validData = data.filter(r => {
    let val = r[idebCol];
    return val !== '-' && val !== 'ND' && val !== undefined && val !== null;
}).map(r => {
    return {
        id: r[idCol],
        name: r[nameCol],
        uf: r[ufCol],
        city: r[cityCol],
        ideb: parseFloat(String(r[idebCol]).replace(',', '.'))
    };
}).sort((a, b) => b.ideb - a.ideb);

targetSchool = validData.find(r => String(r.id) === String(targetSchoolId));

if (!targetSchool) {
    console.log('Target school not found or has no IDEB 2023 score.');
    process.exit(1);
}

console.log('Target School Data:', targetSchool);

const rankCountry = validData.findIndex(r => r.id === targetSchool.id) + 1;

const mtData = validData.filter(r => r.uf === 'MT');
const rankMT = mtData.findIndex(r => r.id === targetSchool.id) + 1;

// DRE Sinop municipalities:
const dreSinop = [
    'Boa Esperança do Norte', 'Cláudia', 'Colíder', 'Feliz Natal', 'Ipiranga do Norte',
    'Itanhangá', 'Itaúba', 'Lucas do Rio Verde', 'Nova Santa Helena', 'Nova Ubiratã',
    'Santa Carmem', 'Sinop', 'Sorriso', 'Tabaporã', 'Tapurah', 'União do Sul', 'Vera'
].map(c => c.toUpperCase()); // usually NO_MUNICIPIO is uppercase

const dreData = validData.filter(r => dreSinop.includes((r.city || '').toUpperCase()));
const rankDRE = dreData.findIndex(r => r.id === targetSchool.id) + 1;

const cityData = validData.filter(r => (r.city || '').toUpperCase() === 'COLÍDER' || (r.city || '').toUpperCase() === 'COLIDER');
const rankCity = cityData.findIndex(r => r.id === targetSchool.id) + 1;

console.log('--- RANKINGS ---');
console.log(`Brasil: ${rankCountry} de ${validData.length}`);
console.log(`Mato Grosso (MT): ${rankMT} de ${mtData.length}`);
console.log(`DRE Sinop: ${rankDRE} de ${dreData.length}`);
console.log(`Colíder: ${rankCity} de ${cityData.length}`);
