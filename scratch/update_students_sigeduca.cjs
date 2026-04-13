const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  {
    id: '7095e282-f191-412c-a03b-7d087fb4517d',
    name: 'ALISON GUILHERME RODRIGUES ARAUJO',
    registration_number: '2569401',
    guardian_name: 'MARIA APARECIDA RODRIGUES DOS SANTOS',
    contact_phone: '66999886751 / 66984389440'
  },
  {
    id: '6882ee4a-3a2e-41e7-9854-a17361018033',
    name: 'ANTHONY MIGUEL PEREIRA DE SOUZA',
    registration_number: '2683159',
    guardian_name: 'ELIZABETE PEREIRA DOS SANTOS',
    contact_phone: '66996184554'
  },
  {
    id: 'f0654fbb-aa1c-498b-8edc-c70f67bef0fc',
    name: 'BEKIRE METUKTIRE',
    registration_number: '2239407',
    guardian_name: 'YAPY METUKTIRE',
    contact_phone: '66996541319 / 66999918886'
  },
  {
    id: '5c9030f9-5630-4801-94e7-ec055b0221be',
    name: 'BEPY ARETI METUKTIRE',
    registration_number: '2724743',
    guardian_name: 'YAPY METUKTIRE',
    contact_phone: '66996541319 / 66999918886'
  },
  {
    id: '7f112822-00dd-4a12-85e1-be315ca210a4',
    name: 'BRENDA VITORIA SILVA BERTORELLO',
    registration_number: '2673461',
    guardian_name: 'AMANDA BRUNA DE SOUZA SILVA BERTORELLO',
    contact_phone: '6600'
  },
  {
    id: 'd8609603-8b3b-4f69-9da0-a3e3b0d7a288',
    name: 'CAMILLY VITORIA BALBINO SOARES',
    registration_number: '2702574',
    guardian_name: 'LINDIMARA APARECIDA GARCIA DOS SANTOS',
    contact_phone: '66996150622 / 66669813322'
  },
  {
    id: 'eb3102ca-76a4-49a1-b6bb-f6ef8285dda7',
    name: 'DANIEL ROBERT RUFINO DA COSTA',
    registration_number: '2284461',
    guardian_name: 'VANESSA ROBERT DO NASCIMENTO',
    contact_phone: '66996124073 / 66996116893'
  },
  {
    id: '88ed71f5-4899-4c7e-83b9-409745eb0c0c',
    name: 'DAVID LUIZ RIBEIRO DOS SANTOS',
    registration_number: '2729021',
    guardian_name: 'VALDEIR FAUSTINO DOS SANTOS',
    contact_phone: '66999588218'
  }
];

async function run() {
  console.log('--- Iniciando Atualização de Alunos (SIGEDUCA) ---');
  
  for (const up of UPDATES) {
    console.log(`Atualizando ${up.name}...`);
    const { error } = await supabase
      .from('students')
      .update({
        registration_number: up.registration_number,
        guardian_name: up.guardian_name,
        contact_phone: up.contact_phone
      })
      .eq('id', up.id);
    
    if (error) {
      console.error(`Erro ao atualizar ${up.name}:`, error.message);
    } else {
      console.log(`Sucesso.`);
    }
  }
  
  console.log('--- Atualização concluída! ---');
}

run();
