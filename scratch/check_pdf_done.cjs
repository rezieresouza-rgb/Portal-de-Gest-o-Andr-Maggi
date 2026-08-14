const fs = require('fs');
const path = require('path');

const target1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
const target2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

if (fs.existsSync(target1)) {
  const stat1 = fs.statSync(target1);
  console.log(`PDF 1 exists: ${stat1.size} bytes | Mtime: ${stat1.mtime}`);
} else {
  console.log("PDF 1 not copied yet.");
}

if (fs.existsSync(target2)) {
  const stat2 = fs.statSync(target2);
  console.log(`PDF 2 exists: ${stat2.size} bytes | Mtime: ${stat2.mtime}`);
} else {
  console.log("PDF 2 not copied yet.");
}
