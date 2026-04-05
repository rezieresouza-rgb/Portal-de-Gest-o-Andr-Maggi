const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const studentsData = [
  { reg: "2671253", name: "JOÃO LUIZ MESQUITA SILVA DOS SANTOS", paed: false, transport: true, guardian: "ABIGAIL MESQUITA SILVA", contact: "(66) 99622-7529 / 99723-3352" },
  { reg: "2671433", name: "MIKAELLY CRISTINA FERREIRA DOS SANTOS", paed: false, transport: true, guardian: "SUELI CARDOSO DA CRUZ DOS SANTOS", contact: "(66) 99642-3547 / 99971-0246" },
  { reg: "2401444", name: "JOAQUIM LEITE MARCHIORO", paed: false, transport: true, guardian: "RESNETH SOUZA LEITE", contact: "(66) 99632-0527" },
  { reg: "2671865", name: "HESTER BEATRIZ DOS SANTOS MARTINHO", paed: false, transport: true, guardian: "LEIDIANE DOS SANTOS", contact: "(66) 99631-6311 / 8117-6411" },
  { reg: "2673453", name: "JOSÉ EDUARDO DOURADO DE ARAUJO", paed: false, transport: false, guardian: "JEDA DE SOUSA DOURADO", contact: "(66) 99604-4688 / 99638-7828" },
  { reg: "2673467", name: "ANA CLARA DE OLIVEIRA ANDRADE", paed: false, transport: false, guardian: "MOISES LUCAS ANDRADE", contact: "(66) 99610-5824" },
  { reg: "2673503", name: "RAYQUE VITOR DOS SANTOS RODRIGUES", paed: false, transport: false, guardian: "CHYENNE DOS SANTOS CAVALCANTE RODRIGUES", contact: "(66) 99648-9217 / 99911-1863" },
  { reg: "2315125", name: "KHYMBERLLY KLERYS VAZ DE OLIVEIRA", paed: false, transport: false, guardian: "KELYANE DA SILVA VAZ", contact: "(66) 99656-8264 / 99719-8950" },
  { reg: "2674900", name: "ADRYAN SOUSA DOS ANJOS", paed: false, transport: false, guardian: "DIANA DE SOUSA COSTA", contact: "(66) 99614-3026 / 99628-0019" },
  { reg: "2283250", name: "KOKOIREI MARIZA METUKTIRE", paed: false, transport: false, guardian: "BERTOTKRAN METUKTIRE", contact: "(66) 99615-1427 / 99717-7758" },
  { reg: "2661047", name: "NICOLAS JOSÉ PEREIRA VIANA", paed: true, transport: false, guardian: "AURICELIA GONÇALVES VIANA", contact: "(66) 98127-5588" },
  { reg: "2668951", name: "GUILHERME DOS SANTOS AMORIM", paed: false, transport: false, guardian: "GEANE CIRILO DOS SANTOS AMORIM", contact: "(66) 99683-3770 / 98115-5650" },
  { reg: "2257923", name: "MARYA CLARA FERREIRA DOS SANTOS", paed: false, transport: true, guardian: "PATRICIA DA SILVA FERREIRA", contact: "(66) 99713-5235 / 99200-3236" },
  { reg: "2475353", name: "VICTOR JOAQUIM MARQUES MADEIRA", paed: false, transport: false },
  { reg: "2283387", name: "GUILHERME HENRIQUE MOREIRA DA SILVA", paed: false, transport: false, guardian: "NOELMO MOREIRA DA SILVA", contact: "(66) 99633-8824 / 99934-4885" },
  { reg: "2663489", name: "GREG NAJAN DO AMARAL", paed: false, transport: false, guardian: "MARCIA DUTRA DE SOUZA", contact: "(66) 99657-2827 / 99612-7256" },
  { reg: "2633981", name: "YASMIN MARIA VITORIA NASCIMENTO DA SILVA PEDROSO", paed: false, transport: false },
  { reg: "2634325", name: "SAMUEL LUIZ FERREIRA DA SILVA", paed: false, transport: false },
  { reg: "2339717", name: "YAYCIKE ARISTIDES DO NASCIMENTO JURUNA", paed: false, transport: false },
  { reg: "2350612", name: "ELOISA MOREIRA DONATO", paed: false, transport: false, guardian: "ROSANGELA MOREIRA DOS SANTOS", contact: "(66) 98125-2076 / 98122-2832" },
  { reg: "2401054", name: "JOÃO PEDRO FERMINO DA SILVA", paed: false, transport: true, guardian: "TATIANA LOPES DA SILVA", contact: "(66) 99696-2635 / 99618-0737" },
  { reg: "2315701", name: "EMILY VITORIA DE ALMEIDA FAUSTINO", paed: false, transport: true, guardian: "ERIKA PRISCILA DE ALMEIDA FERREIRA", contact: "(66) 99686-4415 / 99662-1089" },
  { reg: "2671297", name: "GABRIELA HENRIQUE GIZONI DA SILVA", paed: false, transport: true, guardian: "ANDREIA HENRIQUE DA SILVA", contact: "(66) 99638-3173 / 99603-1214" },
  { reg: "2277854", name: "LUIZ MIGUEL CHAVES MENDONÇA", paed: false, transport: false, guardian: "LUCIANE BENEDITA CHAVES MENDONÇA", contact: "(66) 98404-4311 / 99684-2434" },
  { reg: "2312064", name: "RUTE DOS SANTOS MAGIOLO", paed: false, transport: false },
  { reg: "2303869", name: "ROBERMANUELLY ALMEIDA AGUIAR", paed: false, transport: true },
  { reg: "2303740", name: "YZANNY YONARA RIBEIRO DE SOUZA", paed: false, transport: false },
  { reg: "2721632", name: "WIDYNEI HENRIQUE DOS SANTOS CORREA", paed: false, transport: false },
  { reg: "2721839", name: "JOSE MARCIO LEMOS CABRAL", paed: true, transport: true, guardian: "REJIANE BARBOSA LEMOS", contact: "(66) 99623-2720 / 99634-2405" },
  { reg: "2725279", name: "ALEXANDRE MOURA DOS SANTOS", paed: true, transport: false, guardian: "ROSANGELA DE FATIMA MOURA", contact: "(66) 99977-8125 / 99955-5334" }
];

async function finalSync() {
  const classroomId = '6d6a2f34-3665-4f40-84dc-660c05872898';
  
  for (const s of studentsData) {
    console.log(`Sincronizando: ${s.name}`);
    
    const { data: existing } = await supabase.from('students').select('birth_date').eq('registration_number', s.reg).single();

    const payload = {
      registration_number: s.reg,
      name: s.name.toUpperCase(),
      paed: s.paed,
      school_transport: s.transport,
      status: 'ATIVO'
    };

    if (s.guardian) payload.guardian_name = s.guardian;
    if (s.contact) payload.contact_phone = s.contact;
    if (!existing || !existing.birth_date) payload.birth_date = '2000-01-01';

    const { data: st, error } = await supabase.from('students').upsert(payload, { onConflict: 'registration_number' }).select('id').single();
    if (error) { console.error(`Erro: ${s.reg}`, error.message); continue; }

    await supabase.from('enrollments').upsert({
      student_id: st.id,
      classroom_id: classroomId,
      year: 2026,
      status: 'ATIVO'
    }, { onConflict: 'student_id,year' });
  }
  console.log('--- TURMA 6E CORRIGIDA E SINCRONIZADA ---');
}
finalSync();
