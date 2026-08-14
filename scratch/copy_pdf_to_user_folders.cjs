const fs = require('fs');
const path = require('path');

const srcPdf = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69\\Relatorio_Fotografico_Escolas.pdf';

const targetFolder1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
const targetFolder2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

try {
  fs.copyFileSync(srcPdf, targetFolder1);
  console.log(`Copied PDF to: ${targetFolder1}`);
} catch (e) {
  console.error("Error copying to targetFolder1:", e);
}

try {
  fs.copyFileSync(srcPdf, targetFolder2);
  console.log(`Copied PDF to: ${targetFolder2}`);
} catch (e) {
  console.error("Error copying to targetFolder2:", e);
}
