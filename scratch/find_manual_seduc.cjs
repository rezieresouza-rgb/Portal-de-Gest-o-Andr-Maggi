const fs = require('fs');
const path = require('path');

const downloads = 'C:\\Users\\rezie\\Downloads';

function findManual() {
  const files = fs.readdirSync(downloads);
  console.log('Searching in Downloads for MANUAL / SEDUC...');
  const matches = files.filter(f => 
    f.toLowerCase().includes('manual') || 
    f.toLowerCase().includes('seduc') || 
    f.toLowerCase().includes('manutenção') ||
    f.toLowerCase().includes('manutencao')
  );

  console.log('Matched files:', matches);
}

findManual();
