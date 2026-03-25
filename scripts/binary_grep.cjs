
const fs = require('fs');

function findBalance(filePath) {
  const buf = fs.readFileSync(filePath);
  const text = buf.toString('binary');
  
  console.log(`\n=== SEARCHING ${filePath} ===`);
  
  // Look for SALDO or similar strings (common in BR bank statements: SALDO, SALDO ANTERIOR, SALDO ATUAL)
  const regex = /SALDO.{0,50}(\d+[\.,]\d{2})/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Found: ${match[0]}`);
  }

  // Also look for REPASSE
  const repasseRegex = /REPASSE.{0,50}(\d+[\.,]\d{2})/gi;
  while ((match = repasseRegex.exec(text)) !== null) {
      console.log(`Repasse Found: ${match[0]}`);
  }
}

findBalance('test_janeiro.pdf');
