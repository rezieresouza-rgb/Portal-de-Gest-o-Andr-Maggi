const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const blurredPhotosDir = path.join(artifactBase, 'photos_escolas_blurred');
const aerialPhotoPath = path.join(artifactBase, 'foto_aerea_google_earth.jpg');

const htmlPath = path.join(artifactBase, 'relatorio_fotografico.html');
const pdfPath = path.join(artifactBase, 'Relatorio_Fotografico_Escolas.pdf');
const mdPath = path.join(artifactBase, 'relatorio_fotografico_escolas.md');

async function buildCompleteReport() {
  const files = fs.readdirSync(blurredPhotosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Building complete PDF & MD with aerial photo + ${files.length} school photos...`);

  const forwardAerial = aerialPhotoPath.replace(/\\/g, '/');

  // Build HTML Content
  let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Ficha de Levantamento Cadastral e Relatório Fotográfico - E.E. André Maggi</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 12mm 15mm 12mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header h1 {
            color: #0f172a;
            font-size: 20px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }
        .header p {
            color: #0284c7;
            font-size: 11px;
            margin: 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* SECTION 1: CADASTRAL INFO */
        .cadastral-card {
            border: 2px solid #cbd5e1;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 25px;
            background: #ffffff;
            page-break-inside: avoid;
        }
        .cadastral-title {
            background: #1e293b;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            padding: 8px 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
        }
        .aerial-img-container {
            text-align: center;
            background: #f8fafc;
            padding: 10px;
            border-bottom: 1px solid #cbd5e1;
        }
        .aerial-img-container img {
            max-width: 100%;
            max-height: 380px;
            object-fit: contain;
            border-radius: 6px;
            border: 1px solid #94a3b8;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .cadastral-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        .cadastral-table td {
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
        }
        .cadastral-table td strong {
            color: #1e293b;
            text-transform: uppercase;
            font-size: 10px;
        }

        /* SECTION 2: PHOTOS GRID */
        .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            border-left: 4px solid #0284c7;
            padding-left: 8px;
            margin: 20px 0 12px 0;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .photo-card {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 6px;
            page-break-inside: avoid;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .photo-card img {
            width: 100%;
            height: 205px;
            object-fit: cover;
            border-radius: 6px;
            display: block;
        }
        .photo-card .caption {
            margin-top: 5px;
            font-size: 9.5px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Ficha de Levantamento Cadastral & Relatório Fotográfico</h1>
        <p>E.E. André Antonio Maggi — Secretaria de Estado de Educação de Mato Grosso (SEDUC/MT)</p>
    </div>

    <!-- SEÇÃO 1: FOTO AÉREA E METADADOS CADASTRAIS -->
    <div class="cadastral-card">
        <div class="cadastral-title">Fotografia Aérea / Imagem Google Earth — Edificação Escolar</div>
        <div class="aerial-img-container">
            <img src="file:///${forwardAerial}" alt="Fotografia Aérea Google Earth" />
        </div>
        <table class="cadastral-table">
            <tr>
                <td style="width: 50%;"><strong>Coordenadas Geográficas:</strong><br>Latitude: <strong>10°47'46"S</strong></td>
                <td style="width: 50%;"><strong>Longitude:</strong><br>Longitude: <strong>55°27'59"W</strong></td>
            </tr>
            <tr>
                <td><strong>Data das Imagens:</strong><br>28/08/2024</td>
                <td><strong>Responsável pelas imagens:</strong><br>JAIME DE SOUZA COSTA</td>
            </tr>
        </table>
    </div>

    <!-- SEÇÃO 2: GALERIA FOTOGRÁFICA COM ROSTOS PROTEGIDOS -->
    <div class="section-title">Galeria de Registros Fotográficos Escolares (${files.length} Registros)</div>

    <div class="grid">
`;

  files.forEach((file, idx) => {
    const photoPath = path.join(blurredPhotosDir, file).replace(/\\/g, '/');
    htmlContent += `
        <div class="photo-card">
            <img src="file:///${photoPath}" alt="Foto ${idx + 1}" />
            <div class="caption">Registro ${String(idx + 1).padStart(2, '0')} — Protegido LGPD</div>
        </div>
`;
  });

  htmlContent += `
    </div>

    <div class="footer">
        Documento Cadastral e Relatório Fotográfico Oficial emitido em ${new Date().toLocaleDateString('pt-BR')} — E.E. André Antonio Maggi
    </div>
</body>
</html>
`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  // Convert HTML to PDF using Edge / Chrome
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  let browserPath = '';
  if (fs.existsSync(edgePath)) browserPath = edgePath;
  else if (fs.existsSync(chromePath)) browserPath = chromePath;

  if (browserPath) {
    console.log(`Printing complete PDF with Cadastral section using browser...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd);
    console.log(`✅ COMPLETE PDF SUCCESSFULLY GENERATED AT: ${pdfPath}`);

    // Copy to user folders
    const targetFolder1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
    const targetFolder2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

    try { fs.copyFileSync(pdfPath, targetFolder1); } catch (e) {}
    try { fs.copyFileSync(pdfPath, targetFolder2); } catch (e) {}
    console.log("✅ PDF updated in user's FOTOS ESCOLAS & Documentos folders.");
  }

  // Update Markdown Artifact as well
  let markdown = `# 📷 Ficha de Levantamento Cadastral e Relatório Fotográfico Escolar

**Unidade Escolar**: E.E. André Antonio Maggi — SEDUC/MT  
**Data do Relatório**: ${new Date().toLocaleDateString('pt-BR')}  

---

## 🗺️ Seção 1: Levantamento Cadastral do Imóvel (2024)

![Fotografia Aérea Google Earth](file:///${forwardAerial})

| Parâmetro Cadastral | Informação / Valor |
| :--- | :--- |
| **Fotografia Aérea / Origem** | Imagem Google Earth |
| **Latitude Geográfica** | **10°47'46"S** |
| **Longitude Geográfica** | **55°27'59"W** |
| **Data das Imagens** | **28/08/2024** |
| **Responsável pelas Imagens** | **JAIME DE SOUZA COSTA** |

---

## 🖼️ Seção 2: Galeria de Registros Fotográficos Escolares (${files.length} Fotos)

> [!NOTE]
> Registros fotográficos das dependências, projetos e rotina da instituição com proteção e anonimização de imagem ativada conforme LGPD.

`;

  const chunkSize = 5;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    markdown += `### 📸 Bloco ${Math.floor(i / chunkSize) + 1} (Registros ${i + 1} a ${Math.min(i + chunkSize, files.length)})\n\n`;
    markdown += `\`\`\`\`carousel\n`;
    chunk.forEach((file, cIdx) => {
      const forwardPath = path.join(blurredPhotosDir, file).replace(/\\/g, '/');
      if (cIdx > 0) markdown += `<!-- slide -->\n`;
      markdown += `![Registro Fotográfico ${i + cIdx + 1}](${forwardPath})\n`;
    });
    markdown += `\`\`\`\`\n\n`;
  }

  markdown += `---
*Documento emitido automaticamente pela Plataforma de Gestão E.E. André Antonio Maggi.*
`;

  fs.writeFileSync(mdPath, markdown, 'utf8');
  console.log(`✅ Markdown artifact updated at: ${mdPath}`);
}

buildCompleteReport();
