const fs = require('fs');
const path = require('path');

const hubPath = path.join(__dirname, 'components', 'Hub.tsx');
let content = fs.readFileSync(hubPath, 'utf-8');

// The line is something like:
// 'REGÊNCIA': ['teacher', 'scheduling', 'library', 'almoxarifado', 'civico_militar', 'training', 'educarte', 'gamification'],
// or with strange characters if it was already messed up in source, but git restore fixed it.
content = content.replace(/'REGÊNCIA': \[[^\]]+\]/, "'REGÊNCIA': ['teacher', 'scheduling', 'training', 'gamification']");
// In case of encoding issue 'REGSNCIA':
content = content.replace(/'REGSNCIA': \[[^\]]+\]/, "'REGÊNCIA': ['teacher', 'scheduling', 'training', 'gamification']");
content = content.replace(/'REGNCIA': \[[^\]]+\]/, "'REGÊNCIA': ['teacher', 'scheduling', 'training', 'gamification']");

fs.writeFileSync(hubPath, content, 'utf-8');
console.log('Fixed REGÊNCIA');
