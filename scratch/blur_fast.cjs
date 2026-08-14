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

async function processFastBlur() {
  if (!fs.existsSync(blurredPhotosDir)) {
    fs.mkdirSync(blurredPhotosDir, { recursive: true });
  }

  console.log("Loading face detection models (SSD MobileNet V1)...");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir);

  const files = fs.readdirSync(srcPhotosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Optimized processing for ${files.length} photos...`);

  let totalFacesBlurred = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(srcPhotosDir, file);
    const targetPath = path.join(blurredPhotosDir, file);

    const img = await loadImage(srcPath);
    const origW = img.width;
    const origH = img.height;

    // Scale down image for ultra-fast AI face detection
    const maxDim = 600;
    let detW = origW;
    let detH = origH;
    if (origW > maxDim || origH > maxDim) {
      if (origW > origH) {
        detW = maxDim;
        detH = Math.round((origH * maxDim) / origW);
      } else {
        detH = maxDim;
        detW = Math.round((origW * maxDim) / origH);
      }
    }

    const detCanvas = createCanvas(detW, detH);
    const detCtx = detCanvas.getContext('2d');
    detCtx.drawImage(img, 0, 0, detW, detH);

    // Fast Face Detection
    const detections = await faceapi.detectAllFaces(detCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }));
    const tinyDetections = await faceapi.detectAllFaces(detCanvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.15 }));

    const allDetections = [...detections, ...tinyDetections];

    // Main Full-Res Canvas for Output
    const mainCanvas = createCanvas(origW, origH);
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.drawImage(img, 0, 0);

    const scaleX = origW / detW;
    const scaleY = origH / detH;

    allDetections.forEach(det => {
      totalFacesBlurred++;
      // Map bounding box back to full-res image
      const x = det.box.x * scaleX;
      const y = det.box.y * scaleY;
      const width = det.box.width * scaleX;
      const height = det.box.height * scaleY;

      // Expand bounding box (35%) to ensure full head/face coverage
      const padX = width * 0.35;
      const padY = height * 0.40;

      const bx = Math.max(0, Math.floor(x - padX / 2));
      const by = Math.max(0, Math.floor(y - padY / 2));
      const bw = Math.min(origW - bx, Math.ceil(width + padX));
      const bh = Math.min(origH - by, Math.ceil(height + padY));

      if (bw > 0 && bh > 0) {
        // High-density Pixelation
        const pixelSize = Math.max(12, Math.floor(Math.min(bw, bh) / 5));

        const smallCanvas = createCanvas(Math.max(1, Math.floor(bw / pixelSize)), Math.max(1, Math.floor(bh / pixelSize)));
        const smallCtx = smallCanvas.getContext('2d');
        smallCtx.imageSmoothingEnabled = false;

        smallCtx.drawImage(mainCanvas, bx, by, bw, bh, 0, 0, smallCanvas.width, smallCanvas.height);

        mainCtx.imageSmoothingEnabled = false;
        mainCtx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, bx, by, bw, bh);

        // Opaque Blur Oval over the face
        mainCtx.save();
        mainCtx.beginPath();
        mainCtx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, 2 * Math.PI);
        mainCtx.fillStyle = 'rgba(70, 70, 70, 0.55)';
        mainCtx.fill();
        mainCtx.restore();
      }
    });

    const outBuffer = mainCanvas.toBuffer('image/jpeg', { quality: 0.90 });
    fs.writeFileSync(targetPath, outBuffer);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n==================================================`);
  console.log(`✅ FAST ANONYMIZATION COMPLETED IN ${elapsed}s!`);
  console.log(`✅ TOTAL PHOTOS PROCESSED: ${files.length}`);
  console.log(`✅ TOTAL FACES ANONYMIZED: ${totalFacesBlurred}`);
  console.log(`==================================================\n`);

  // Re-generate HTML & PDF
  const htmlPath = path.join(artifactBase, 'relatorio_fotografico.html');
  const pdfPath = path.join(artifactBase, 'Relatorio_Fotografico_Escolas.pdf');

  let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório Fotográfico Escolar (Rostos Protegidos / LGPD) - E.E. André Maggi</title>
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
        <h1>Relatório Fotográfico Escolar (Rostos Protegidos / LGPD)</h1>
        <p>E.E. André Maggi — Secretaria de Estado de Educação de Mato Grosso (SEDUC/MT)</p>
    </div>

    <div class="meta-box">
        <span>📅 Data: 31 de Julho de 2026</span>
        <span>📸 Total: ${files.length} Registros (Privacidade / LGPD Ativada)</span>
        <span>🏫 Unidade: E.E. André Maggi</span>
    </div>

    <div class="grid">
`;

  files.forEach((file, idx) => {
    const photoPath = path.join(blurredPhotosDir, file).replace(/\\/g, '/');
    htmlContent += `
        <div class="photo-card">
            <img src="file:///${photoPath}" alt="Foto ${idx + 1}" />
            <div class="caption">Registro ${String(idx + 1).padStart(2, '0')} — Imagem Protegida</div>
        </div>
`;
  });

  htmlContent += `
    </div>

    <div class="footer">
        Relatório Fotográfico Oficial (Proteção de Imagem LGPD) emitido em ${new Date().toLocaleDateString('pt-BR')} — E.E. André Maggi
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
    console.log(`Printing new PDF with anonymized faces using Edge/Chrome...`);
    const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${htmlPath}"`;
    execSync(cmd);
    console.log(`✅ PDF WITH BLURRED FACES GENERATED AT: ${pdfPath}`);

    // Copy to user folders
    const targetFolder1 = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS\\Relatorio_Fotografico_Escolas.pdf';
    const targetFolder2 = 'C:\\Users\\rezie\\OneDrive\\Documentos\\Relatorio_Fotografico_Escolas.pdf';

    try { fs.copyFileSync(pdfPath, targetFolder1); } catch (e) {}
    try { fs.copyFileSync(pdfPath, targetFolder2); } catch (e) {}
    console.log("✅ PDF updated in user's FOTOS ESCOLAS & Documentos folders.");
  }
}

processFastBlur();
