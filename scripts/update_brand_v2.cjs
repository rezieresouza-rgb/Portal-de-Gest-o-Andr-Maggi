
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join('c:', 'Users', 'rezie', 'Downloads', 'portal-de-gestão-andré-maggi', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // 1. Encontrar o fornecedor
    console.log('Buscando fornecedor...');
    const { data: suppliers, error: sError } = await supabase
      .from('suppliers')
      .select('id, name, full_name')
      .or('name.ilike.%N. DOS SANTOS%,full_name.ilike.%N. DOS SANTOS%,name.ilike.%N.C. SANTOS%,full_name.ilike.%N.C. SANTOS%');

    if (sError) throw sError;

    if (!suppliers || suppliers.length === 0) {
      console.log('Fornecedor não encontrado.');
      return;
    }

    for (const sup of suppliers) {
      console.log(`Fornecedor encontrado: ${sup.name} (${sup.id})`);
      
      // 2. Encontrar contratos deste fornecedor
      const { data: contracts, error: cError } = await supabase
        .from('contracts')
        .select('id, number')
        .eq('supplier_id', sup.id);

      if (cError) throw cError;

      if (!contracts || contracts.length === 0) {
        console.log(`Nenhum contrato encontrado para o fornecedor ${sup.name}.`);
        continue;
      }

      for (const contract of contracts) {
        console.log(`Verificando contrato ${contract.number} (${contract.id})...`);
        
        // 3. Atualizar o item
        const { data: items, error: uError } = await supabase
          .from('contract_items')
          .update({ brand: 'SZURA' })
          .eq('contract_id', contract.id)
          .ilike('description', '%MANTEIGA%')
          .select();

        if (uError) throw uError;
        
        if (items && items.length > 0) {
            console.log(`Sucesso! ${items.length} itens de MANTEIGA atualizados para SZURA.`);
            items.forEach(item => console.log(`- ${item.description}: SZURA`));
        } else {
            console.log('Nenhum item de MANTEIGA encontrado neste contrato.');
        }
      }
    }

  } catch (err) {
    console.error('Erro:', err.message);
  }
}

run();
