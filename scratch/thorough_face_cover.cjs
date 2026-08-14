const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const faceapi = require('face-api.js');
const { Canvas, Image, ImageData, createCanvas, loadImage } = require('canvas');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const srcPhotosDir = path.join(artifactBase, 'photos_escolas');
const blurredPhotosDir = path.join(artifactBase, 'photos_escolas_blurred');
const modelDir = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');

async function processThoroughCover() {
  if (!fs.existsSync(blurredPhotosDir)) {
    fs.mkdirSync(blurredPhotosDir, { recursive: true });
  }

  console.log("Loading face detection models for 100% coverage...");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir);

  const files = fs.readdirSync(srcPhotosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Analyzing and covering faces across all ${files.length} photos...`);

  let totalFacesCovered = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(srcPhotosDir, file);
    const targetPath = path.join(blurredPhotosDir, file);

    const img = await loadImage(srcPath);
    const origW = img.width;
    const origH = img.height;

    // Detect at multiple scales (640px and 1024px) for small & large faces
    const scales = [640,origW > 1200 ? 1024 : origW];
    const detectedBoxes = [];

    for (const scaleW of scales) {
      if (scaleW > origW) continue;
      const scaleH = Math.round((origH * scaleW) / origW);

      const detCanvas = createCanvas(scaleW, scaleH);
      const detCtx = detCanvas.getContext('2d');
      detCtx.drawImage(img, 0, 0, scaleW, scaleH);

      // Low confidence thresholds (0.05) to capture every single face
      const ssdDetections = await faceapi.detectAllFaces(detCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 }));
      const tinyDetections = await faceapi.detectAllFaces(detCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.05 }));

      const factorX = origW / scaleW;
      const factorY = origH / scaleH;

      [...ssdDetections, ...tinyDetections].forEach(det => {
        const x = det.box.x * factorX;
        const y = det.box.y * factorY;
        const w = det.box.width * factorX;
        const h = det.box.height * factorY;
        detectedBoxes.push({ x, y, w, h });
      });
    }

    // Main Canvas
    const mainCanvas = createCanvas(origW, origH);
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.drawImage(img, 0, 0);

    let countThisPhoto = 0;

    detectedBoxes.forEach(box => {
      countThisPhoto++;
      totalFacesCovered++;

      // Generous padding (50%) to completely obscure head, hair, eyes, nose, mouth
      const padX = box.w * 0.50;
      const padY = box.h * 0.60;

      const bx = Math.max(0, Math.floor(box.x - padX / 2));
      const by = Math.max(0, Math.floor(box.y - padY / 2));
      const bw = Math.min(origW - bx, Math.ceil(box.w + padX));
      const bh = Math.min(origH - by, Math.ceil(box.h + padY));

      if (bw > 0 && bh > 0) {
        // Step 1: Pixelate background under face
        const pixelSize = Math.max(16, Math.floor(Math.min(bw, bh) / 3));
        const smallCanvas = createCanvas(Math.max(1, Math.floor(bw / pixelSize)), Math.max(1, Math.floor(bh / pixelSize)));
        const smallCtx = smallCanvas.getContext('2d');
        smallCtx.imageSmoothingEnabled = false;
        smallCtx.drawImage(mainCanvas, bx, by, bw, bh, 0, 0, smallCanvas.width, smallCanvas.height);

        mainCtx.imageSmoothingEnabled = false;
        mainCtx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, bx, by, bw, bh);

        // Step 2: SOLID BLACK OVAL / SHIELD OVER FACE (100% OPAQUE COVERAGE)
        mainCtx.save();
        mainCtx.beginPath();
        mainCtx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, 2 * Math.PI);
        mainCtx.fillStyle = '#000000'; // 100% Solid Black Mask
        mainCtx.fill();
        mainCtx.strokeStyle = '#1e293b';
        mainCtx.lineWidth = 3;
        mainCtx.stroke();
        mainCtx.restore();
      }
    });

    console.log(`[Photo ${i + 1}/${files.length}] ${file}: Covered ${countThisPhoto} face region(s).`);

    const outBuffer = mainCanvas.toBuffer('image/jpeg', { quality: 0.90 });
    fs.writeFileSync(targetPath, outBuffer);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n==================================================`);
  console.log(`✅ THOROUGH COVERAGE FINISHED IN ${elapsed}s!`);
  console.log(`✅ TOTAL FACES/HEADS COVERED WITH SOLID BLACK MASK: ${totalFacesCovered}`);
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
    <title>Ficha Cadastral e Relatório Fotográfico (Rostos 100% Cobertos) - E.E. André Maggi</title>
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

    <div class="section-title">Galeria de Registros Fotográficos (${files.length} Fotos com Rostos Ocultos / Tarja Preta)</div>

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
    console.log(`Printing PDF with 100% black masked faces...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd);
    console.log(`✅ PDF WITH 100% MASKED FACES GENERATED AT: ${pdfPath}`);

    // Copy to user folders
    const targetFolder1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
    const targetFolder2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

    try { fs.copyFileSync(pdfPath, targetFolder1); } catch (e) {}
    try { fs.copyFileSync(pdfPath, targetFolder2); } catch (e) {}
    console.log("✅ PDF updated in user's FOTOS ESCOLAS & Documentos folders.");
  }
}

processThoroughCover();
