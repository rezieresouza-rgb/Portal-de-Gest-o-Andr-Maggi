const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

async function runWeeklyAudit() {
  console.log("=== SIMULANDO A GERAÇÃO DE LISTA DE COMPRAS DAS 5 SEMANAS DA MERENDA ===");

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(name)')
    .eq('status', 'ATIVO');

  const formattedContracts = contracts.map((c) => ({
    id: c.id,
    number: c.number,
    supplierName: c.supplier?.name || "Desconhecido",
    items: c.items.map((i) => ({
      id: i.id,
      description: i.description,
      contractedQuantity: i.contracted_quantity,
      acquiredQuantity: i.acquired_quantity,
      unit: i.unit,
      unitPrice: i.unit_price
    }))
  }));

  // Parse technicalSheets.ts to get sheets
  const tsContent = fs.readFileSync(path.join(__dirname, '../constants/technicalSheets.ts'), 'utf8');

  const prepBlocks = tsContent.split('preparationName:');
  const sheets = [];

  for (let i = 1; i < prepBlocks.length; i++) {
    const block = prepBlocks[i];
    const nameMatch = block.match(/^\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;
    const prepName = nameMatch[1];

    const ingMatches = [...block.matchAll(/description:\s*['"]([^'"]+)['"]/g)];
    const ingredients = ingMatches.map(m => m[1]);
    sheets.push({ prepName, ingredients });
  }

  const auditResults = [];

  sheets.forEach(sheet => {
    sheet.ingredients.forEach(ingName => {
      const normSearch = normalize(ingName);
      const searchWords = normSearch.split(' ').filter(w => w.length > 0);

      let bestMatch = {
        sheetName: sheet.prepName,
        ingredient: ingName,
        contractItem: "NÃO ENCONTRADO",
        contractNumber: "---",
        supplier: "NÃO VINCULADO",
        balance: "---",
        score: -1
      };

      for (const c of formattedContracts) {
        for (const ci of c.items) {
          const normItem = normalize(ci.description);
          const itemWords = normItem.split(' ').filter(w => w.length > 0);
          let score = -1;

          if (normItem === normSearch) {
            score = 100;
          } else if (searchWords.length > 0 && searchWords.every(sw => itemWords.includes(sw))) {
            score = 90;
          } else if (itemWords.length > 0 && itemWords.every(iw => searchWords.includes(iw))) {
            score = 80;
          } else if (normItem.startsWith(normSearch + ' ')) {
            score = 70;
          }

          // Fuzzy matcher
          if (score < 60) {
            if (normSearch.includes('ISCA') && normItem.includes('ISCA')) score = 65;
            if (normSearch.includes('CUBO') && normItem.includes('CUBO')) score = 65;
            if (normSearch.includes('POLPA') && normItem.includes('POLPA')) score = 65;
            if (normSearch.includes('FERMENTO') && normItem.includes('FERMENTO')) score = 65;
            if ((normSearch.includes('SUINA') || normSearch.includes('SUINO')) &&
              (normItem.includes('SUINA') || normItem.includes('SUINO'))) score = 65;
          }

          if (score > bestMatch.score) {
            const rem = ci.contractedQuantity - ci.acquiredQuantity;
            bestMatch = {
              sheetName: sheet.prepName,
              ingredient: ingName,
              contractItem: ci.description,
              contractNumber: c.number,
              supplier: c.supplierName,
              balance: `${rem} / ${ci.contractedQuantity} ${ci.unit}`,
              score: score
            };
          }
        }
      }

      auditResults.push(bestMatch);
    });
  });

  // Unique ingredients audit
  const uniqueItemsMap = new Map();
  auditResults.forEach(r => {
    if (!uniqueItemsMap.has(r.ingredient)) {
      uniqueItemsMap.set(r.ingredient, r);
    }
  });

  const uniqueAudit = Array.from(uniqueItemsMap.values());
  const matched = uniqueAudit.filter(r => r.score >= 60);
  const unmapped = uniqueAudit.filter(r => r.score < 60);

  console.log(`\n==========================================================================`);
  console.log(`               AUDITORIA DE ITENS ÚNICOS DA MERENDA ESCOLAR              `);
  console.log(`==========================================================================\n`);
  console.log(`Total de Ingredientes Distintos das Fichas Técnicas: ${uniqueAudit.length}`);
  console.log(`Vínculos Válidos / Conformes aos Contratos: ${matched.length}`);
  console.log(`Não Mapeados (Ingredientes sem Contrato Ativo): ${unmapped.length}`);

  console.log("\n--- TABELA DE MAPEAMENTO COMPLETA ---");
  console.table(matched.map(r => ({
    "Ingrediente": r.ingredient,
    "Item do Contrato": r.contractItem,
    "Contrato": r.contractNumber,
    "Fornecedor": r.supplier,
    "Saldo Atual": r.balance,
    "Score": r.score
  })));

  if (unmapped.length > 0) {
    console.log("\n⚠️ ITENS SEM CONTRATO DIRETO:");
    console.table(unmapped.map(r => ({
      "Ingrediente": r.ingredient,
      "Status": "Item não consta nos contratos ativos"
    })));
  }
}

runWeeklyAudit();
