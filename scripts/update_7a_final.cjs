const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroom_id = 'f308d078-c267-4013-b27d-351352f34396'; // 7º ANO A Principal

const students = [
  { reg: "238048", name: "KAUAN EDUARDO BITENCOURT", date: "2026-01-15" },
  { reg: "260523", name: "PEDRO HENRIQUE TREVIZAN DA SILVA", date: "2026-01-15" },
  { reg: "221350", name: "PAMELA VITORIA RAMOS ANDRADE", date: "2026-01-15" },
  { reg: "259631", name: "SARAH DOS SANTOS LIMA", date: "2026-01-15" },
  { reg: "260376", name: "SARAH PEREIRA DE ALMEIDA", date: "2026-01-15" },
  { reg: "260338", name: "SOPHIA PEREIRA DE ALMEIDA", date: "2026-01-15" },
  { reg: "264263", name: "TAYNARA FIGUEIREDO VASCON", date: "2026-01-15" },
  { reg: "215538", name: "VICTTOR HUGO MONTEIRO DE SOUZA", date: "2026-01-15" },
  { reg: "265735", name: "DAVI LUCA BARBOZA MOREIRA", date: "2026-01-15" },
  { reg: "255500", name: "DHAFINE LAVINYA GOMES FERREIRA", date: "2026-01-15" },
  { reg: "264363", name: "EMANUELLY MORAES GOMES", date: "2026-01-15" },
  { reg: "222108", name: "EMANUELLY VITORIA DIAS PRATES", date: "2026-01-15" },
  { reg: "2223191", name: "EMILLY VITORIA FOCAS DE AMORIM", date: "2026-01-15" },
  { reg: "220546", name: "ENDREW ALVES DE SOUZA", date: "2026-01-15" },
  { reg: "258045", name: "ENZO DA COSTA LIMA", date: "2026-01-15" },
  { reg: "264415", name: "ENZO JOSE DE SOUZA NICOLETTI", date: "2026-01-15" },
  { reg: "2232309", name: "ERYKSON KAUAN PEREIRA DA SILVA", date: "2026-01-15" },
  { reg: "2651033", name: "FABRICIO LEANDRO FLOR VERDADEIRO", date: "2026-01-15" },
  { reg: "259836", name: "FELIPE BONETTI MILHEIRO", date: "2026-01-15" },
  { reg: "259863", name: "GABRIEL HENRIQUE DUARTE", date: "2026-01-15", paed: true },
  { reg: "259832", name: "GIOVANA KETTELYIN NASCIMENTO DA COSTA", date: "2026-01-15" },
  { reg: "2587895", name: "GUSTAVO AMORIM DOS SANTOS", date: "2026-01-15" },
  { reg: "263102", name: "GUSTAVO SILVA FLOR", date: "2026-01-15" },
  { reg: "2221294", name: "HELOISE PEDROTTI RAMOS", date: "2026-01-15" },
  { reg: "240507", name: "ISABELA SOARES DO BEM", date: "2026-01-15" },
  { reg: "2235314", name: "JOAO GABRIEL DA SILVA", date: "2026-01-15" },
  { reg: "259301", name: "JOAO LUCAS DO NASCIMENTO LIMA", date: "2026-01-15" },
  { reg: "2245470", name: "JULLIA RAFAELA GOMES DA CRUZ", date: "2026-01-15" },
  { reg: "2589706", name: "NAYANE FERNANDES DA SILVA", date: "2026-01-15" },
  { reg: "255633", name: "LORRAYNE SOUZA JACINTO", date: "2026-01-15" }
];

async function sync7A() {
  console.log('--- INICIANDO SINCRONIZAÇÃO OFICIAL 7º ANO A ---');

  // 1. Limpar enturmações atuais
  console.log('Limpando 131 registros antigos...');
  await supabase.from('enrollments').delete().eq('classroom_id', classroom_id);

  for (const s of students) {
    console.log(`Verificando/Cadastrando: ${s.name}...`);
    
    // Buscar ou Upsert aluno
    let { data: st } = await supabase.from('students')
      .select('id')
      .eq('registration_number', s.reg)
      .single();

    if (!st) {
      const { data: nst } = await supabase.from('students').insert({
        registration_number: s.reg,
        name: s.name,
        is_paed: s.paed || false,
        school_transport: true
      }).select('id').single();
      st = nst;
    } else {
      // Atualizar status
      await supabase.from('students').update({
        is_paed: s.paed || false,
        school_transport: true
      }).eq('id', st.id);
    }

    // Enturmar
    if (st) {
      await supabase.from('enrollments').insert({
        student_id: st.id,
        classroom_id: classroom_id,
        enrollment_date: s.date
      });
    }
  }

  console.log('--- 7º ANO A FINALIZADO COM 30 ALUNOS ---');
}

sync7A();
