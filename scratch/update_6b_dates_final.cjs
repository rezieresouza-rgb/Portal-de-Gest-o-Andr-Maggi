const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CLASSROOM_B_ID = 'e3707ca3-d72d-473d-a072-afaa2d616906';

// Data from the second print (11 students)
const DATA = [
  { id: '3802b3be-b797-4e10-9869-2dce896b8197', name: 'MARIA CLARA CARDOSO RESENDE', birth: '2015-05-28', enroll: '2026-01-19' }, // Correction (was 29)
  { id: 'ff6f0797-7b44-44e8-8133-0c19a62fbc30', name: 'NATHALY POLLYANE LOPES DA SILVA RIBEIRO', birth: '2014-09-05', enroll: '2026-01-30' },
  { id: '93eec7b9-647f-43df-aaa8-b40cab43f42d', name: 'STEFANY LAURA RODRIGUES LIMA', birth: '2014-05-03', enroll: '2026-01-19' },
  { id: 'b4136780-ca75-4cc8-b9d0-025a75ab1712', name: 'THAEMILLI REGIELLI MARCELINO SOARES', birth: '2014-09-22', enroll: '2026-01-19' },
  { id: 'b40ad97b-11ba-4307-906f-3df26743303f', name: 'VINICIUS RAFAEL NOVAIS DA SILVA', birth: '2015-02-09', enroll: '2026-01-19' },
  { id: 'c8461bd8-52ed-4a48-84b4-5c8bc8fa9347', name: 'VITORIA GABRIELLY DIAS', birth: '2014-07-07', enroll: '2026-01-19' },
  { id: '1df98205-824b-4613-b176-265c040400fb', name: 'YURI GABRIEL ALVES DE AMORIM', birth: '2014-10-20', enroll: '2026-01-19' },
  { id: '4d1296c1-9df6-4662-9242-96c867b846b2', name: 'MEREKORE TAPAYUNA METUKTIRE', birth: '2014-02-20', enroll: '2026-02-10' },
  { id: '88ed71f5-4899-4c7e-83b9-409745eb0c0c', name: 'DAVID LUIZ RIBEIRO DOS SANTOS', birth: '2015-02-23', enroll: '2026-03-02' },
  { id: '5304c39e-c446-440c-99e0-2ca7c6794dc5', name: 'SABRINA DOS SANTOS SILVA', birth: '2014-05-15', enroll: '2026-03-11' },
  { id: '838123ca-0ff0-43f4-a76f-d15c5a9fb444', name: 'MARIA EDUARDA SANTOS CERQUEIRA', birth: '2014-10-20', enroll: '2026-04-08' }
];

async function run() {
  console.log('--- Iniciando Atualização Final de Datas - 6º ANO B (11 ALUNOS) ---');
  
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
  
  console.log('--- Atualização Final Concluída! ---');
}

run();
