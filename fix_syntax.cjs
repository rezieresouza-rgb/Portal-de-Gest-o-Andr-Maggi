const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'modules', 'GamificationModule.tsx');
let content = fs.readFileSync(filepath, 'utf8');

content = content.replaceAll("type: 'ranking' | 'ranking_alunos' | 'pontos_manuais' | 'auditoria'", "'auditoria'");
content = content.replaceAll("type: 'ranking' | 'ranking_alunos' | 'pontos_manuais' | 'pontos_manuais'", "'pontos_manuais'");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed syntax errors');
