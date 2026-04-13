const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  { id: 'ec2ef3bd-c26e-4376-b099-cf3c1a443dbf', reg: '2286825', resp: 'ROSANGELA DA SILVA SOUZA', tel: '(66) 999261944' },
  { id: 'db260e4f-da2f-4113-bb86-cde22fbd02ea', reg: '2569402', resp: 'MARIA DE FÁTIMA PEREIRA', tel: '(66) 992565506' },
  { id: '6175440a-e7c5-407e-ac53-79fafa31eb35', reg: '2286559', resp: 'FÁTIMA CONSTANTINI DE LIMA', tel: '(66) 997140258 / 999153636' },
  { id: 'c954c448-691f-44f5-99e9-6918b2392ce7', reg: '2569403', resp: 'DORALICE NOBREGA ALVES', tel: '(66) 997133922 / (93) 981226144' },
  { id: '1d85ec28-23ec-4f69-a8e8-10674ab55eb3', reg: '2230457', resp: 'VILMA PEREIRA DA SILVA', tel: '(66) 99676294 / 998541952' },
  { id: '951daf33-314b-4d76-a744-c72eb6d14225', reg: '2683745', resp: 'NATALINA NOVAIS', tel: '(66) 996562331 / (66) 992427832' },
  { id: 'ab2584a4-4038-4f12-a40c-ea2725772ac1', reg: '2286964', resp: 'FRANCIELLI WELITA DE SOUZA', tel: '(66) 996744530' },
  { id: '5edf2a6f-99ae-434c-b8b2-a5047578395c', reg: '2287021', resp: 'ELIANE APARECIDA ANDRÉ', tel: '(66) 996201651 / (66) 999731242' }
];

const GHOST_ID_GUILHERME = 'fc6aaf9d-1572-4ea8-b900-4cedc5aa111e';
const CLASSROOM_B_ID = 'e3707ca3-d72d-473d-a072-afaa2d616906';

async function run() {
  console.log('--- Iniciando Lote 3 - 6º ANO B (8 ALUNOS) ---');
  
  // 1. Deletar duplicata de Guilherme
  console.log('Limpando duplicata de Guilherme...');
  const { error: delErr } = await supabase.from('students').delete().eq('id', GHOST_ID_GUILHERME);
  if (delErr) console.error('Erro ao deletar:', delErr.message);
  else console.log('Sucesso.');

  // 2. Atualizar alunos
  for (const up of UPDATES) {
    console.log(`Atualizando ID: ${up.id}...`);
    const { error: upErr } = await supabase.from('students').update({
       registration_number: up.reg,
       guardian_name: up.resp,
       contact_phone: up.tel,
       status: 'ATIVO'
    }).eq('id', up.id);
    
    if (upErr) console.error('Erro:', upErr.message);
    else console.log('Sucesso.');

    // 3. Enturmar Guilherme se necessário (ID 6175440a...)
    if (up.id === '6175440a-e7c5-407e-ac53-79fafa31eb35') {
       console.log('Enturmando Guilherme no 6º ANO B...');
       const { error: enrErr } = await supabase.from('enrollments').insert([{
         student_id: up.id,
         classroom_id: CLASSROOM_B_ID,
         status: 'ATIVO',
         enrollment_date: '2026-04-11'
       }]);
       if (enrErr) console.error('Erro ao enturmar:', enrErr.message);
       else console.log('Sucesso.');
    }
  }
  
  console.log('--- Lote 3 Concluído! ---');
}

run();
