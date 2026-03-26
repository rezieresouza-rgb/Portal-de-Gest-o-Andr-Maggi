
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // 1. Encontrar o contrato
    const { data: contracts, error: cError } = await supabase
      .from('contracts')
      .select('id, supplier_name')
      .ilike('supplier_name', '%N.C. SANTOS%');

    if (cError) throw cError;

    if (!contracts || contracts.length === 0) {
        // Tentar N. DOS SANTOS
        const { data: contracts2, error: cError2 } = await supabase
          .from('contracts')
          .select('id, supplier_name')
          .ilike('supplier_name', '%N. DOS SANTOS%');
        if (cError2) throw cError2;
        if (!contracts2 || contracts2.length === 0) {
            console.log('Contrato não encontrado.');
            return;
        }
        contracts.push(...contracts2);
    }

    for (const contract of contracts) {
        console.log(`Atualizando contrato: ${contract.supplier_name} (${contract.id})`);
        
        // 2. Atualizar o item
        const { data: items, error: uError } = await supabase
          .from('contract_items')
          .update({ brand: 'SZURA' })
          .eq('contract_id', contract.id)
          .ilike('description', '%MANTEIGA%')
          .select();

        if (uError) throw uError;
        
        if (items && items.length > 0) {
            console.log(`Sucesso! ${items.length} itens atualizados.`);
            items.forEach(item => console.log(`- ${item.description}: ${item.brand}`));
        } else {
            console.log('Nenhum item de manteiga encontrado neste contrato.');
        }
    }

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
