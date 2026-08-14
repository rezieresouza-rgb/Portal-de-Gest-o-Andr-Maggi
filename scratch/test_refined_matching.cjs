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

async function runRefinedAudit() {
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

  const tsContent = fs.readFileSync(path.join(__dirname, '../constants/technicalSheets.ts'), 'utf8');
  const ingredientRegex = /description:\s*['"]([^'"]+)['"]/g;
  const ingredientsSet = new Set();
  let match;
  while ((match = ingredientRegex.exec(tsContent)) !== null) {
    ingredientsSet.add(match[1]);
  }

  const ingredients = Array.from(ingredientsSet).sort();

  const results = [];

  ingredients.forEach(ingName => {
    const normSearch = normalize(ingName);
    const searchWords = normSearch.split(' ').filter(w => w.length > 0);

    let bestMatch = {
      ingredient: ingName,
      matchedItem: "NÃO ENCONTRADO",
      contractNumber: "---",
      supplierName: "NÃO VINCULADO",
      balance: "---",
      score: -1
    };

    for (const c of formattedContracts) {
      for (const contractItem of c.items) {
        const normItem = normalize(contractItem.description);
        const itemWords = normItem.split(' ').filter(w => w.length > 0);
        let score = -1;

        if (normItem === normSearch) {
          score = 100;
        } else if (normItem.startsWith(normSearch + ' ') && !normItem.includes('farinha de mandioca')) {
          // Prefixo direto de ingrediente (ex: MANDIOCA -> MANDIOCA DESCASCADA)
          score = 95;
        } else if (searchWords.length > 0 && searchWords.every(sw => itemWords.includes(sw))) {
          score = 90;
        } else if (itemWords.length > 0 && itemWords.every(iw => searchWords.includes(iw))) {
          score = 85;
        }

        // Regras Especiais de Ingredientes Culinários (Carnes, Polpas, Mandioca)
        if (score < 80) {
          // Mandioca vs Farinha de Mandioca
          if (normSearch === 'mandioca' && normItem.startsWith('mandioca descascada')) {
            score = 95;
          }

          // Carne Suína
          if ((normSearch.includes('suina') || normSearch.includes('suino')) &&
              (normItem.includes('suina') || normItem.includes('suino'))) {
            score = 92;
          }

          // Carne Bovina em Cubos
          if (normSearch.includes('carne') && normSearch.includes('cubo') &&
              normItem.includes('carne') && normItem.includes('cubo')) {
            score = 92;
          }

          // Polpas de Fruta
          if (normSearch.includes('polpa') && normItem.includes('polpa')) {
            score = 90;
          }
        }

        if (score > bestMatch.score) {
          const rem = contractItem.contractedQuantity - contractItem.acquiredQuantity;
          bestMatch = {
            ingredient: ingName,
            matchedItem: contractItem.description,
            contractNumber: c.number,
            supplierName: c.supplierName,
            balance: `${rem} / ${contractItem.contractedQuantity} ${contractItem.unit}`,
            score: score
          };
        }
      }
    }

    results.push(bestMatch);
  });

  console.log("\n==========================================================================");
  console.log("            AUDITORIA REFINADA DOS INGREDIENTES DAS FICHAS TÉCNICAS       ");
  console.log("==========================================================================\n");

  console.table(results.map(r => ({
    "Ingrediente": r.ingredient,
    "Item Mapeado do Contrato": r.matchedItem,
    "Contrato": r.contractNumber,
    "Fornecedor": r.supplierName,
    "Saldo Atual": r.balance,
    "Score": r.score
  })));
}

runRefinedAudit();
