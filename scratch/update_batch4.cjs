const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  { id: 'd5227814-cfd0-4ec9-9bd4-e40463b489a8', name: 'LUCAS GABRIEL DE SOUZA', reg: '2674867', resp: 'REZIERE DE SOUZA', tel: '(66) 996648410' },
  { id: '2fdb0afe-c7b5-404f-b999-84530ca69667', name: 'LUIZ HENRIQUE SOUZA MATOS', reg: '2685041', resp: 'JULIANE DE OLIVEIRA MATOS', tel: '(66) 999256856 / (66) 996068012' },
  { id: '3802b3be-b797-4e10-9869-2dce896b8197', name: 'MARIA CLARA CARDOSO RESENDE', reg: '2681029', resp: 'MARIA DA CONCEIÇÃO PEREIRA CARDOSO', tel: '(98) 970116377' }
];

async function run() {
  console.log('--- Iniciando Lote 4 - 6º ANO B (3 ALUNOS) ---');
  
  for (const up of UPDATES) {
    console.log(`Atualizando ${up.name}...`);
    const { error } = await supabase
      .from('students')
      .update({
        registration_number: up.reg,
        guardian_name: up.resp,
        contact_phone: up.tel
      })
      .eq('id', up.id);
    
    if (error) {
      console.error(`Erro ao atualizar ${up.name}:`, error.message);
    } else {
      console.log(`Sucesso.`);
    }
  }
  
  console.log('--- Lote 4 Concluído! ---');
}

run();
