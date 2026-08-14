const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const downloads = 'C:\\Users\\rezie\\Downloads';
const file1 = path.join(downloads, '1 - Cronograma de Inspeções.docx');

async function inspectDoc1() {
  if (fs.existsSync(file1)) {
    const result = await mammoth.convertToHtml({ path: file1 });
    console.log('HTML STRUCTURE OF DOC 1:');
    console.log(result.value);
  } else {
    console.log('File not found directly, checking for docx files in downloads...');
    const files = fs.readdirSync(downloads).filter(f => f.includes('Cronograma de Inspeções'));
    console.log('Matching files:', files);
    for (const f of files) {
      if (f.endsWith('.docx')) {
        const res = await mammoth.convertToHtml({ path: path.join(downloads, f) });
        console.log('--- HTML FOR', f, '---');
        console.log(res.value);
      }
    }
  }
}

inspectDoc1();
