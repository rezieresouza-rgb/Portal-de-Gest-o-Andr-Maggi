const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { registration: "2674900", name: "ADRYAN SOUSA DOS ANJOS", guardian: "DIANA DE SOUSA COSTA", contact: "(66) 99614-3026 / 99628-0019" },
  { registration: "2725279", name: "ALEXANDRE MOURA DOS SANTOS", guardian: "ROSANGELA DE FATIMA MOURA", contact: "(66) 99977-8125 / 99955-5334" },
  { registration: "2673467", name: "ANA CLARA DE OLIVEIRA ANDRADE", guardian: "MOISES LUCAS ANDRADE", contact: "(66) 99610-5824" },
  { registration: "2350612", name: "ELOISA MOREIRA DONATO", guardian: "ROSANGELA MOREIRA DOS SANTOS", contact: "(66) 98125-2076 / 98122-2832" },
  { registration: "2315701", name: "EMILY VITORIA DE ALMEIDA FAUSTINO", guardian: "ERIKA PRISCILA DE ALMEIDA FERREIRA", contact: "(66) 99686-4415 / 99662-1089" },
  { registration: "2671297", name: "GABRIELA HENRIQUE GIZONI DA SILVA", guardian: "ANDREIA HENRIQUE DA SILVA", contact: "(66) 99638-3173 / 99603-1214" },
  { registration: "2663489", name: "GREG NAJAN DO AMARAL", guardian: "MARCIA DUTRA DE SOUZA", contact: "(66) 99657-2827 / 99612-7256" },
  { registration: "2668951", name: "GUILHERME DOS SANTOS AMORIM", guardian: "GEANE CIRILO DOS SANTOS AMORIM", contact: "(66) 99683-3770 / 98115-5650" },
  { registration: "2283387", name: "GUILHERME HENRIQUE MOREIRA DA SILVA", guardian: "NOELMO MOREIRA DA SILVA", contact: "(66) 99633-8824 / 99934-4885" },
  { registration: "2671865", name: "HESTER BEATRIZ DOS SANTOS MARTINHO", guardian: "LEIDIANE DOS SANTOS", contact: "(66) 99631-6311 / 8117-6411" },
  { registration: "2671253", name: "JOÃO LUIZ MESQUITA SILVA DOS SANTOS", guardian: "ABIGAIL MESQUITA SILVA", contact: "(66) 99622-7529 / 99723-3352" },
  { registration: "2401054", name: "JOÃO PEDRO FERMINO DA SILVA", guardian: "TATIANA LOPES DA SILVA", contact: "(66) 99696-2635 / 99618-0737" },
  { registration: "2401444", name: "JOAQUIM LEITE MARCHIORO", guardian: "RESNETH SOUZA LEITE", contact: "(66) 99632-0527" },
  { registration: "2673453", name: "JOSE EDUARDO DOURADO DE ARAUJO", guardian: "JEDA DE SOUSA DOURADO", contact: "(66) 99604-4688 / 99638-7828" },
  { registration: "2721839", name: "JOSE MARCIO LEMOS CABRAL", guardian: "REJIANE BARBOSA LEMOS", contact: "(66) 99623-2720 / 99634-2405" },
  { registration: "2315125", name: "KHYMBERLLY KLERYS VAZ DE OLIVEIRA", guardian: "KELYANE DA SILVA VAZ", contact: "(66) 99656-8264 / 99719-8950" },
  { registration: "2283250", name: "KOKOIREI MARIZA METUKTIRE", guardian: "BERTOTKRAN METUKTIRE", contact: "(66) 99615-1427 / 99717-7758" },
  { registration: "2277854", name: "LUIZ MIGUEL CHAVES MENDONÇA", guardian: "LUCIANE BENEDITA CHAVES MENDONÇA", contact: "(66) 98404-4311 / 99684-2434" },
  { registration: "2257923", name: "MARIA CLARA FERREIRA DOS SANTOS", guardian: "PATRICIA DA SILVA FERREIRA", contact: "(66) 99713-5235 / 99200-3236" },
  { registration: "2671433", name: "MIKAELLY CRISTINA FERREIRA DOS SANTOS", guardian: "SUELI CARDOSO DA CRUZ DOS SANTOS", contact: "(66) 99642-3547 / 99971-0246" },
  { registration: "2661047", name: "NICOLAS JOSE PEREIRA VIANA", guardian: "AURICELIA GONÇALVES VIANA", contact: "(66) 98127-5588" },
  { registration: "2673503", name: "RAYQUE VITOR DOS SANTOS RODRIGUES", guardian: "CHYENNE DOS SANTOS CAVALCANTE RODRIGUES", contact: "(66) 99648-9217 / 99911-1863" }
];

async function updateStudents() {
  const classroomId = '6d6a2f34-3665-4f40-84dc-660c05872898'; // 6º ANO E
  
  for (const student of studentsData) {
    console.log(`Atualizando: ${student.name}`);
    
    // 1. Data check first to avoid NULL violations for REQUIRED fields
    const { data: existing } = await supabase
      .from('students')
      .select('gender, birth_date')
      .eq('registration_number', student.registration)
      .single();

    const payload = {
      registration_number: student.registration,
      name: student.name,
      guardian_name: student.guardian,
      contact_phone: student.contact,
      status: 'ATIVO'
    };

    // If student is new or missing required fields, provide defaults
    if (!existing || !existing.gender) payload.gender = 'M'; // Default to M if unknown
    if (!existing || !existing.birth_date) payload.birth_date = '2000-01-01'; // Dummy date

    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .upsert(payload, { onConflict: 'registration_number' })
      .select('id')
      .single();

    if (studentError) {
      console.error(`Erro ao salvar ${student.name}:`, studentError.message);
      continue;
    }

    // 2. Ensure enrollment in 6E
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: studentRecord.id,
        classroom_id: classroomId,
        year: 2026,
        status: 'ATIVO'
      }, { onConflict: 'student_id,year' });

    if (enrollError) {
      console.error(`Erro ao enturmar ${student.name}:`, enrollError.message);
    }
  }
  console.log('--- FIM DO PROCESSAMENTO ---');
}

updateStudents();
