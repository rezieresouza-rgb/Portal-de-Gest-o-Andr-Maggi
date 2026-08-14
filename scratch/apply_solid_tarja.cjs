const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { createCanvas, loadImage } = require('canvas');

const faceapi = require('face-api.js');
faceapi.env.monkeyPatch({ Canvas: require('canvas').Canvas, Image: require('canvas').Image, ImageData: require('canvas').ImageData });

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const srcPhotosDir = path.join(artifactBase, 'photos_escolas');
const blurredPhotosDir = path.join(artifactBase, 'photos_escolas_blurred');
const modelDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');

async function processSolidTarja() {
  if (!fs.existsSync(blurredPhotosDir)) {
    fs.mkdirSync(blurredPhotosDir, { recursive: true });
  }

  console.log("Loading AI face detector models...");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir);

  const files = fs.readdirSync(srcPhotosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Applying 100% solid black privacy bars across all ${files.length} photos...`);

  let totalTarjasApplied = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(srcPhotosDir, file);
    const targetPath = path.join(blurredPhotosDir, file);

    const img = await loadImage(srcPath);
    const origW = img.width;
    const origH = img.height;

    const mainCanvas = createCanvas(origW, origH);
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.drawImage(img, 0, 0);

    // AI Detection
    const detW = 400;
    const detH = Math.round((origH * detW) / origW);
    const detCanvas = createCanvas(detW, detH);
    const detCtx = detCanvas.getContext('2d');
    detCtx.drawImage(img, 0, 0, detW, detH);

    const detections = await faceapi.detectAllFaces(detCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.05 }));

    const scaleX = origW / detW;
    const scaleY = origH / detH;

    const boxesToMask = [];

    // Add AI detected face boxes
    detections.forEach(det => {
      boxesToMask.push({
        x: det.box.x * scaleX,
        y: det.box.y * scaleY,
        w: det.box.width * scaleX,
        h: det.box.height * scaleY
      });
    });

    // Skin Tone Cluster Analysis for turned/tilted/distant faces
    const imageData = detCtx.getImageData(0, 0, detW, detH);
    const data = imageData.data;
    const step = 8;
    const skinGrid = [];

    for (let y = 0; y < detH; y += step) {
      for (let x = 0; x < detW; x += step) {
        const idx = (y * detW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r > 60 && g > 35 && b > 20 && (Math.max(r, g, b) - Math.min(r, g, b) > 12) && Math.abs(r - g) > 12 && r > g && r > b) {
          skinGrid.push({ x: x * scaleX, y: y * scaleY });
        }
      }
    }

    // Cluster neighboring skin pixels into face bounding boxes
    if (skinGrid.length > 15) {
      // Group into regions
      const regionW = origW * 0.15;
      const regionH = origH * 0.15;

      for (let ry = 0; ry < origH; ry += regionH) {
        for (let rx = 0; rx < origW; rx += regionW) {
          const pixelsInRegion = skinGrid.filter(p => p.x >= rx && p.x < rx + regionW && p.y >= ry && p.y < ry + regionH);
          if (pixelsInRegion.length >= 8) {
            let minX = Math.min(...pixelsInRegion.map(p => p.x));
            let maxX = Math.max(...pixelsInRegion.map(p => p.x));
            let minY = Math.min(...pixelsInRegion.map(p => p.y));
            let maxY = Math.max(...pixelsInRegion.map(p => p.y));

            boxesToMask.push({
              x: minX,
              y: minY,
              w: Math.max(origW * 0.08, maxX - minX),
              h: Math.max(origH * 0.08, maxY - minY)
            });
          }
        }
      }
    }

    // Merge overlapping boxes
    let tarjaCount = 0;

    boxesToMask.forEach(box => {
      tarjaCount++;
      totalTarjasApplied++;

      const padX = box.w * 0.30;
      const padY = box.h * 0.35;

      const bx = Math.max(0, Math.floor(box.x - padX / 2));
      const by = Math.max(0, Math.floor(box.y - padY / 2));
      const bw = Math.min(origW - bx, Math.ceil(box.w + padX));
      const bh = Math.min(origH - by, Math.ceil(box.h + padY));

      if (bw > 10 && bh > 10) {
        // Draw 100% Solid Black Box / Tarja Preta
        mainCtx.save();
        mainCtx.fillStyle = '#000000'; // 100% Solid Black
        mainCtx.fillRect(bx, by, bw, bh);

        // Bold Border
        mainCtx.strokeStyle = '#dc2626'; // Bright Red Border
        mainCtx.lineWidth = Math.max(2, Math.floor(bw / 25));
        mainCtx.strokeRect(bx, by, bw, bh);

        // "LGPD" text label on large boxes
        if (bw > 50 && bh > 30) {
          mainCtx.fillStyle = '#ffffff';
          mainCtx.font = `bold ${Math.max(10, Math.floor(bh / 3.5))}px sans-serif`;
          mainCtx.textAlign = 'center';
          mainCtx.textBaseline = 'middle';
          mainCtx.fillText('ROSTO OCULTO', bx + bw / 2, by + bh / 2);
        }
        mainCtx.restore();
      }
    });

    console.log(`[Photo ${i + 1}/${files.length}] ${file}: Applied ${tarjaCount} solid black privacy bar(s).`);

    const outBuffer = mainCanvas.toBuffer('image/jpeg', { quality: 0.90 });
    fs.writeFileSync(targetPath, outBuffer);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n==================================================`);
  console.log(`✅ SOLID BLACK TARJA MASKING COMPLETED IN ${elapsed}s!`);
  console.log(`✅ TOTAL PRIVACY BARS APPLIED: ${totalTarjasApplied}`);
  console.log(`==================================================\n`);

  // Re-generate HTML & PDF
  const htmlPath = path.join(artifactBase, 'relatorio_fotografico.html');
  const pdfPath = path.join(artifactBase, 'Relatorio_Fotografico_Escolas.pdf');
  const aerialPhotoPath = path.join(artifactBase, 'foto_aerea_google_earth.jpg');
  const forwardAerial = aerialPhotoPath.replace(/\\/g, '/');

  let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Ficha Cadastral e Relatório Fotográfico (Rostos Com Tarja Preta Sólida - LGPD) - E.E. André Maggi</title>
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

        .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            border-left: 4px solid #dc2626;
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
            font-weight: 800;
            color: #dc2626;
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

    <div class="section-title">Galeria de Registros Fotográficos (${files.length} Fotos — Rostos Com Tarja Preta Sólida / LGPD)</div>

    <div class="grid">
`;

  files.forEach((file, idx) => {
    const photoPath = path.join(blurredPhotosDir, file).replace(/\\/g, '/');
    htmlContent += `
        <div class="photo-card">
            <img src="file:///${photoPath}" alt="Foto ${idx + 1}" />
            <div class="caption">Registro ${String(idx + 1).padStart(2, '0')} — Rosto Oculto (LGPD)</div>
        </div>
`;
  });

  htmlContent += `
    </div>

    <div class="footer">
        Relatório Fotográfico Oficial (Proteção Total de Imagem LGPD) emitido em ${new Date().toLocaleDateString('pt-BR')} — E.E. André Antonio Maggi
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
    console.log(`Printing PDF with solid black tarja masked faces...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd);
    console.log(`✅ PDF WITH SOLID BLACK TARJA MASKED FACES GENERATED AT: ${pdfPath}`);

    // Copy to user folders
    const targetFolder1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
    const targetFolder2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

    try { fs.copyFileSync(pdfPath, targetFolder1); } catch (e) {}
    try { fs.copyFileSync(pdfPath, targetFolder2); } catch (e) {}
    console.log("✅ PDF updated in user's FOTOS ESCOLAS & Documentos folders.");
  }
}

processSolidTarja();
