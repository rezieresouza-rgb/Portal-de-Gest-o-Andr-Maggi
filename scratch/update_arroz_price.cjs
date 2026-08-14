const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wwrjskjhemaapnwtumlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI'
);

async function updateArrozPrice() {
  // 1. Find the contract 003/2026
  const { data: contracts, error: cErr } = await supabase
    .from('contracts')
    .select('id, number')
    .ilike('number', '%003/2026%');

  if (cErr) { console.error('Erro ao buscar contrato:', cErr); return; }
  console.log('Contratos encontrados:', contracts);

  if (!contracts || contracts.length === 0) {
    console.log('Nenhum contrato 003/2026 encontrado.');
    return;
  }

  // 2. For each matching contract, find and update the ARROZ BRANCO item
  for (const contract of contracts) {
    console.log(`\nProcessando contrato: ${contract.number} (ID: ${contract.id})`);

    // Find the item
    const { data: items, error: iErr } = await supabase
      .from('contract_items')
      .select('id, description, unit_price')
      .eq('contract_id', contract.id)
      .ilike('description', '%arroz branco%');

    if (iErr) { console.error('Erro ao buscar itens:', iErr); continue; }
    console.log('Itens ARROZ BRANCO encontrados:', items);

    for (const item of items) {
      console.log(`  Item: ${item.description}, Preço atual: ${item.unit_price}`);
      
      // Update the price
      const { data: updated, error: uErr } = await supabase
        .from('contract_items')
        .update({ unit_price: 21.83 })
        .eq('id', item.id)
        .select();

      if (uErr) {
        console.error(`  Erro ao atualizar:`, uErr);
      } else {
        console.log(`  ✅ Preço atualizado para 21.83! Resultado:`, updated);
      }
    }
  }
}

updateArrozPrice();
