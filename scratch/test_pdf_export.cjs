const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const photosDir = path.join(artifactBase, 'photos_escolas');
const htmlPath = path.join(artifactBase, 'relatorio_fotografico.html');
const pdfPath = path.join(artifactBase, 'Relatorio_Fotografico_Escolas.pdf');

async function generatePDF() {
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Building PDF HTML with ${files.length} photos...`);

  let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório Fotográfico Escolar - E.E. André Maggi</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 20mm 15mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #0f172a;
            font-size: 22px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }
        .header p {
            color: #64748b;
            font-size: 11px;
            margin: 2px 0;
            font-weight: 600;
            text-transform: uppercase;
        }
        .meta-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 600;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .photo-card {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px;
            page-break-inside: avoid;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .photo-card img {
            width: 100%;
            height: 220px;
            object-fit: cover;
            border-radius: 6px;
            display: block;
        }
        .photo-card .caption {
            margin-top: 6px;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Fotográfico Escolar</h1>
        <p>E.E. André Maggi — Secretaria de Estado de Educação de Mato Grosso (SEDUC/MT)</p>
    </div>

    <div class="meta-box">
        <span>📅 Data: 31 de Julho de 2026</span>
        <span>📸 Total de Fotos: ${files.length} Registros</span>
        <span>🏫 Unidade Escolar: E.E. André Maggi</span>
    </div>

    <div class="grid">
`;

  files.forEach((file, idx) => {
    const photoPath = path.join(photosDir, file).replace(/\\/g, '/');
    htmlContent += `
        <div class="photo-card">
            <img src="file:///${photoPath}" alt="Foto ${idx + 1}" />
            <div class="caption">Registro ${String(idx + 1).padStart(2, '0')} — ${file}</div>
        </div>
`;
  });

  htmlContent += `
    </div>

    <div class="footer">
        Relatório Fotográfico Oficial emitido em ${new Date().toLocaleDateString('pt-BR')} — E.E. André Maggi
    </div>
</body>
</html>
`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`HTML saved to ${htmlPath}`);

  // Try Edge or Chrome headless PDF generation
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  let browserPath = '';
  if (fs.existsSync(edgePath)) browserPath = edgePath;
  else if (fs.existsSync(chromePath)) browserPath = chromePath;

  if (browserPath) {
    console.log(`Printing PDF using browser: ${browserPath}...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd);
    console.log(`✅ PDF successfully generated at: ${pdfPath}`);
  } else {
    console.error("No Edge or Chrome browser found for PDF printing.");
  }
}

generatePDF();
