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

async function runAudit() {
  console.log("=== INICIANDO VARREDURA COMPLETA DA LISTA DE COMPRAS VS CONTRATOS ===");

  // 1. Fetch all active contracts and contract_items from Supabase DB
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*), supplier:suppliers(name)')
    .eq('status', 'ATIVO');

  if (error) {
    console.error("Erro ao carregar contratos:", error);
    return;
  }

  console.log(`Carregados ${contracts.length} contratos ativos do banco de dados.`);

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
      unitPrice: i.unit_price,
      brand: i.brand
    }))
  }));

  // Read technicalSheets ts file content to extract ingredients
  const sheetsFile = fs.readFileSync(path.join(__dirname, '../constants/technicalSheets.ts'), 'utf8');
  
  // Extract all unique ingredient descriptions from TECHNICAL_SHEETS
  const ingredientRegex = /description:\s*['"]([^'"]+)['"]/g;
  const ingredientsSet = new Set();
  let match;
  while ((match = ingredientRegex.exec(sheetsFile)) !== null) {
    ingredientsSet.add(match[1]);
  }

  // Also add items from contracts to test reverse lookup
  const allIngredients = Array.from(ingredientsSet).sort();

  console.log(`Encontrados ${allIngredients.length} ingredientes únicos nas Fichas Técnicas.`);

  const auditReport = [];

  for (const ingName of allIngredients) {
    const normSearch = normalize(ingName);
    const searchWords = normSearch.split(' ').filter(w => w.length > 0);

    let bestMatch = {
      ingredient: ingName,
      matchedItem: "NÃO ENCONTRADO",
      contractNumber: "---",
      supplierName: "NÃO VINCULADO",
      contracted: 0,
      acquired: 0,
      remaining: 0,
      unit: "---",
      score: -1,
      matchType: "SEM CORRESPONDÊNCIA",
      status: "⚠️ NÃO MAPEADO"
    };

    let exactMatchCount = 0;
    let partialMatches = [];

    for (const c of formattedContracts) {
      for (const contractItem of c.items) {
        const normItem = normalize(contractItem.description);
        const itemWords = normItem.split(' ').filter(w => w.length > 0);
        let score = -1;
        let type = "";

        if (normItem === normSearch) {
          score = 100;
          type = "EXATA";
          exactMatchCount++;
        } else if (searchWords.length > 0 && searchWords.every(sw => itemWords.includes(sw))) {
          score = 90;
          type = "PALAVRAS INTEIRAS";
          partialMatches.push(contractItem.description);
        } else if (itemWords.length > 0 && itemWords.every(iw => searchWords.includes(iw))) {
          score = 80;
          type = "REVERSA POR PALAVRAS";
          partialMatches.push(contractItem.description);
        } else if (normItem.startsWith(normSearch + ' ')) {
          score = 70;
          type = "PREFIXO COM ESPAÇO";
          partialMatches.push(contractItem.description);
        }

        if (score > bestMatch.score) {
          const remaining = (contractItem.contractedQuantity || 0) - (contractItem.acquiredQuantity || 0);
          bestMatch = {
            ingredient: ingName,
            matchedItem: contractItem.description,
            contractNumber: c.number,
            supplierName: c.supplierName,
            contracted: contractItem.contractedQuantity,
            acquired: contractItem.acquiredQuantity,
            remaining: remaining,
            unit: contractItem.unit,
            score: score,
            matchType: type,
            status: score >= 80 ? "✅ OK" : "⚠️ ATENÇÃO"
          };
        }
      }
    }

    auditReport.push(bestMatch);
  }

  console.log("\n==========================================================================");
  console.log("             RELATÓRIO DE AUDITORIA: INGREDIENTES VS CONTRATOS           ");
  console.log("==========================================================================\n");

  console.table(auditReport.map(r => ({
    "Ingrediente (Ficha)": r.ingredient,
    "Item do Contrato": r.matchedItem,
    "Contrato": r.contractNumber,
    "Fornecedor": r.supplierName,
    "Saldo Restante": `${r.remaining} / ${r.contracted} ${r.unit}`,
    "Tipo": r.matchType,
    "Status": r.status
  })));

  // Check for any potential conflicts or multiple contract items sharing similar words
  console.log("\n=== VERIFICAÇÃO DE ITENS COM NOMES SIMILARES NO MESMO OU OUTRO CONTRATO ===");
  formattedContracts.forEach(c => {
    console.log(`\n📄 Contrato: ${c.number} (${c.supplierName})`);
    c.items.forEach(i => {
      const rem = i.contractedQuantity - i.acquiredQuantity;
      console.log(`   - [ID: ${i.id.substring(0,8)}] ${i.description}: ${rem} / ${i.contractedQuantity} ${i.unit} (R$ ${i.unitPrice})`);
    });
  });
}

runAudit();
