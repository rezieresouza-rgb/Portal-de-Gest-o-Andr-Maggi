const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  { id: '838123ca-0ff0-43f4-a76f-d15c5a9fb444', name: 'MARIA EDUARDA SANTOS CERQUEIRA', reg: '2717192', resp: 'LUZINEIDE DOS REIS SANTOS', tel: '(75) 999095322' },
  { id: '4d1296c1-9df6-4662-9242-96c867b846b2', name: 'MEREKORE TAPAYUNA METUKTIRE', reg: '2725869', resp: 'TAKAKPE TAPAYUNA METUKTIRE', tel: '66996615198 / 66999044570' },
  { id: 'ff6f0797-7b44-44e8-8133-0c19a62fbc30', name: 'NATHALY POLLYANE LOPES DA SILVA RIBEIRO', reg: '2721831', resp: 'ANDREA KARIN LOPES DA SILVA', tel: '(66) 996265850 / (66) 999235841' },
  { id: '5304c39e-c446-440c-99e0-2ca7c6794dc5', name: 'SABRINA DOS SANTOS SILVA', reg: '2431373', resp: 'CARLOS ANTONIO SILVA', tel: '(66) 999761073 / (66) 996329629' },
  { id: '93eec7b9-647f-43df-aaa8-b40cab43f42d', name: 'STEFANY LAURA RODRIGUES LIMA', reg: '2569404', resp: 'IVANILDE RODRIGUES DA CONCEIÇÃO', tel: '(66) 999898827 / (66) 996893449' },
  { id: 'b4136780-ca75-4cc8-b9d0-025a75ab1712', name: 'THAEMILLI REGIELLI MARCELINO SOARES', reg: '2673467', resp: 'ALINE MARCELINO SOUZA SOARES', tel: '660' },
  { id: 'b40ad97b-11ba-4307-906f-3df26743303f', name: 'VINICIUS RAFAEL NOVAIS DA SILVA', reg: '2716708', resp: 'CLAUDEMIR JOSE DA SILVA', tel: '(66) 992474158 / (66) 992530506' },
  { id: 'c8461bd8-52ed-4a48-84b4-5c8bc8fa9347', name: 'VITORIA GABRIELLY DIAS', reg: '2689354', resp: 'LUCIANA HELENA DIAS SAMPAIO SILVA', tel: '(67) 992398056 / (66) 996820270' }
];

async function run() {
  console.log('--- Iniciando Lote 5 - 6º ANO B (8 ALUNOS) ---');
  
  for (const up of UPDATES) {
    console.log(`Atualizando ${up.name}...`);
    const { error } = await supabase
      .from('students')
      .update({
        name: up.name,
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
  
  console.log('--- Lote 5 Concluído! ---');
}

run();
