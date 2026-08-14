const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\rezie\\OneDrive\\Imagens\\FOTOS ESCOLAS';
const artifactBase = 'C:\\Users\\rezie\\.gemini\\antigravity\\brain\\a4bc6a6f-14c1-4c9c-ac5f-0cbbfa559c69';
const photosTargetDir = path.join(artifactBase, 'photos_escolas');

async function processPhotos() {
  if (!fs.existsSync(photosTargetDir)) {
    fs.mkdirSync(photosTargetDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Copying ${files.length} photos to ${photosTargetDir}...`);

  const copiedFiles = [];
  files.forEach((file, idx) => {
    const srcPath = path.join(srcDir, file);
    const targetFileName = `foto_${String(idx + 1).padStart(2, '0')}.jpg`;
    const targetPath = path.join(photosTargetDir, targetFileName);

    fs.copyFileSync(srcPath, targetPath);
    copiedFiles.push({
      originalName: file,
      targetPath: targetPath,
      fileName: targetFileName,
      num: idx + 1
    });
  });

  console.log(`Copied ${copiedFiles.length} photos.`);

  // Build Markdown Artifact
  let markdown = `# 📷 Relatório Fotográfico Escolar - E.E. André Maggi

**Data do Registro**: 31 de Julho de 2026  
**Total de Registros Fotográficos**: ${copiedFiles.length} imagens  
**Instituição**: E.E. André Maggi — SEDUC/MT  

---

> [!NOTE]
> Este relatório fotográfico consolida os registros visuais das atividades escolares, acompanhamento de projetos, rotina cívico-militar, infraestrutura e eventos realizados na instituição.

---

## 🖼️ Galeria de Registros Fotográficos

`;

  // We can group photos into carousels or cards grid!
  // Carousels of 5 photos each for smooth browsing
  const chunkSize = 5;
  for (let i = 0; i < copiedFiles.length; i += chunkSize) {
    const chunk = copiedFiles.slice(i, i + chunkSize);
    markdown += `### 📸 Bloco ${Math.floor(i / chunkSize) + 1} (Registros ${i + 1} a ${Math.min(i + chunkSize, copiedFiles.length)})\n\n`;
    markdown += `\`\`\`\`carousel\n`;
    chunk.forEach((photo, cIdx) => {
      const forwardPath = photo.targetPath.replace(/\\/g, '/');
      if (cIdx > 0) markdown += `<!-- slide -->\n`;
      markdown += `![Registro Fotográfico ${photo.num}](${forwardPath})\n`;
    });
    markdown += `\`\`\`\`\n\n`;
  }

  markdown += `---

## 📋 Lista Completa de Registros

| Nº | Código do Registro | Caminho do Arquivo Local |
| :-: | :--- | :--- |
`;

  copiedFiles.forEach(photo => {
    const forwardPath = photo.targetPath.replace(/\\/g, '/');
    markdown += `| **${photo.num}** | \`${photo.fileName}\` | [Ver Imagem](file:///${forwardPath}) |\n`;
  });

  markdown += `\n---
*Relatório gerado automaticamente pela Plataforma de Gestão E.E. André Maggi em ${new Date().toLocaleDateString('pt-BR')}.*
`;

  const reportPath = path.join(artifactBase, 'relatorio_fotografico_escolas.md');
  fs.writeFileSync(reportPath, markdown, 'utf8');

  console.log(`Report successfully written to ${reportPath}`);
}

processPhotos();
