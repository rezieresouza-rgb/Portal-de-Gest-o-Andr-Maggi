const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CLASSROOM_B_ID = 'e3707ca3-d72d-473d-a072-afaa2d616906';

const DATA = [
  { id: '7095e282-f191-412c-a03b-7d087fb4517d', name: 'ALISON GUILHERME RODRIGUES ARAUJO', birth: '2014-02-25', enroll: '2026-01-19' },
  { id: '6882ee4a-3a2e-41e7-9854-a17361018033', name: 'ANTHONY MIGUEL PEREIRA DE SOUZA', birth: '2014-01-27', enroll: '2026-01-19' },
  { id: 'f0654fbb-aa1c-498b-8edc-c70f67bef0fc', name: 'BEKIRE METUKTIRE', birth: '2014-04-23', enroll: '2026-02-05' },
  { id: '5c9030f9-5630-4801-94e7-ec055b0221be', name: 'BEPY ARETI METUKTIRE', birth: '2015-03-16', enroll: '2026-02-05' },
  { id: '7f112822-00dd-4a12-85e1-be315ca210a4', name: 'BRENDA VITORIA SILVA BERTORELLO', birth: '2014-07-12', enroll: '2026-01-19' },
  { id: 'd8609603-8b3b-4f69-9da0-a3e3b0d7a288', name: 'CAMILLY VITORIA BALBINO SOARES', birth: '2015-01-27', enroll: '2026-01-19' },
  { id: 'eb3102ca-76a4-49a1-b6bb-f6ef8285dda7', name: 'DANIEL ROBERT RUFINO DA COSTA', birth: '2014-07-31', enroll: '2026-01-19' },
  { id: '10aa17e1-7b57-4f71-8daf-d026fc218eeb', name: 'EDUARDO PEREIRA DA SILVA SIMPLICIO', birth: '2012-10-23', enroll: '2026-01-19' },
  { id: '93458d05-d034-40d5-9b47-e98c7209e849', name: 'EMANUEL LORENZO DO CARMO BRANCO', birth: '2014-05-21', enroll: '2026-01-19' },
  { id: '0cd91011-48f6-4905-b029-d1b5180beb18', name: 'EVERTON KAUAN DOMICIANO GONÇALVES', birth: '2014-12-03', enroll: '2026-01-19' },
  { id: '3352f708-569c-416d-99fc-933820ab4553', name: 'ENZO GONÇALVES DOS SANTOS', birth: '2014-12-19', enroll: '2026-01-19' },
  { id: 'ec2ef3bd-c26e-4376-b099-cf3c1a443dbf', name: 'GABRIEL DA SILVA SOUZA', birth: '2014-11-27', enroll: '2026-01-19' },
  { id: '6175440a-e7c5-407e-ac53-79fafa31eb35', name: 'GUILHERME CONSTANTINI DE LIMA', birth: '2014-06-16', enroll: '2026-01-19' },
  { id: 'db260e4f-da2f-4113-bb86-cde22fbd02ea', name: 'GLENNDA GOMES DE SOUZA', birth: '2014-07-05', enroll: '2026-02-04' },
  { id: 'c954c448-691f-44f5-99e9-6918b2392ce7', name: 'ISADORA NOBREGA NEGRETE GARCIA', birth: '2014-10-30', enroll: '2026-01-19' },
  { id: '1d85ec28-23ec-4f69-a8e8-10674ab55eb3', name: 'JHENIFER PEREIRA DA SILVA SIMPLICIO', birth: '2014-01-24', enroll: '2026-01-19' },
  { id: '951daf33-314b-4d76-a744-c72eb6d14225', name: 'JOÃO MIGUEL MARTINS NOVAIS', birth: '2014-12-10', enroll: '2026-01-19' },
  { id: 'ab2584a4-4038-4f12-a40c-ea2725772ac1', name: 'JULIANA DE SOUZA CAMPOS', birth: '2014-08-04', enroll: '2026-01-19' },
  { id: '5edf2a6f-99ae-434c-b8b2-a5047578395c', name: 'LAUARA LAIANNY APARECIDA ASSUNÇÃO', birth: '2014-08-14', enroll: '2026-01-19' },
  { id: 'd5227814-cfd0-4ec9-9bd4-e40463b489a8', name: 'LUCAS GABRIEL DE SOUZA', birth: '2015-03-03', enroll: '2026-01-19' },
  { id: '2fdb0afe-c7b5-404f-b999-84530ca69667', name: 'LUIZ HENRIQUE SOUZA MATOS', birth: '2014-04-29', enroll: '2026-01-19' },
  { id: '3802b3be-b797-4e10-9869-2dce896b8197', name: 'MARIA CLARA CARDOSO RESENDE', birth: '2015-05-29', enroll: '2026-01-19' },
  { id: 'ff6f0797-7b44-44e8-8133-0c19a62fbc30', name: 'NATHALY POLLYANE LOPES DA SILVA RIBEIRO', birth: '2014-09-05', enroll: '2026-01-30' }
];

async function run() {
  console.log('--- Iniciando Atualização de Datas - 6º ANO B (23 ALUNOS) ---');
  
  for (const s of DATA) {
    console.log(`Atualizando ${s.name}...`);
    
    // Update student birth_date
    const { error: stErr } = await supabase
      .from('students')
      .update({ birth_date: s.birth })
      .eq('id', s.id);
    
    if (stErr) console.error(`Erro Birth Date:`, stErr.message);

    // Update enrollment_date
    const { error: enErr } = await supabase
      .from('enrollments')
      .update({ enrollment_date: s.enroll })
      .eq('student_id', s.id)
      .eq('classroom_id', CLASSROOM_B_ID);
    
    if (enErr) console.error(`Erro Enrollment Date:`, enErr.message);
    
    if (!stErr && !enErr) console.log('Sucesso.');
  }
  
  console.log('--- Atualização de Datas Concluída! ---');
}

run();
