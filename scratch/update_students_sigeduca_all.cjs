const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  // First 8
  { id: '7095e282-f191-412c-a03b-7d087fb4517d', reg: '2569401', resp: 'MARIA APARECIDA RODRIGUES DOS SANTOS', tel: '66999886751 / 66984389440' },
  { id: '6882ee4a-3a2e-41e7-9854-a17361018033', reg: '2683159', resp: 'ELIZABETE PEREIRA DOS SANTOS', tel: '66996184554' },
  { id: 'f0654fbb-aa1c-498b-8edc-c70f67bef0fc', reg: '2239407', resp: 'YAPY METUKTIRE', tel: '66996541319 / 66999918886' },
  { id: '5c9030f9-5630-4801-94e7-ec055b0221be', reg: '2724743', resp: 'YAPY METUKTIRE', tel: '66996541319 / 66999918886' },
  { id: '7f112822-00dd-4a12-85e1-be315ca210a4', reg: '2673461', resp: 'AMANDA BRUNA DE SOUZA SILVA BERTORELLO', tel: '6600' },
  { id: 'd8609603-8b3b-4f69-9da0-a3e3b0d7a288', reg: '2702574', resp: 'LINDIMARA APARECIDA GARCIA DOS SANTOS', tel: '66996150622 / 66669813322' },
  { id: 'eb3102ca-76a4-49a1-b6bb-f6ef8285dda7', reg: '2284461', resp: 'VANESSA ROBERT DO NASCIMENTO', tel: '66996124073 / 66996116893' },
  { id: '88ed71f5-4899-4c7e-83b9-409745eb0c0c', reg: '2729021', resp: 'VALDEIR FAUSTINO DOS SANTOS', tel: '66999588218' },
  // New 4
  { id: '10aa17e1-7b57-4f71-8daf-d026fc218eeb', reg: '2156760', resp: 'VILMA PEREIRA DA SILVA', tel: '66996767294 / 66996541952' },
  { id: '93458d05-d034-40d5-9b47-e98c7209e849', reg: '2671946', resp: 'ANGELA MARIA RODRIGUES DO CARMO', tel: '93991457999' },
  { id: '3352f708-569c-416d-99fc-933820ab4553', reg: '2682303', resp: 'ROSELAINE SILVA DOS SANTOS', tel: '66996927199 / 66999781807' },
  { id: '0cd91011-48f6-4905-b029-d1b5180beb18', reg: '2321383', resp: 'JOSIANI DOMICIANO GONÇALVES', tel: '66995467499 / 66996828561' }
];

async function run() {
  console.log('--- Iniciando Atualização de Alunos (SIGEDUCA - 12 ALUNOS) ---');
  
  for (const up of UPDATES) {
    console.log(`Atualizando ID: ${up.id}...`);
    const { error } = await supabase
      .from('students')
      .update({
        registration_number: up.reg,
        guardian_name: up.resp,
        contact_phone: up.tel
      })
      .eq('id', up.id);
    
    if (error) {
      console.error(`Erro:`, error.message);
    } else {
      console.log(`Sucesso.`);
    }
  }
  
  console.log('--- Atualização concluída! ---');
}

run();
