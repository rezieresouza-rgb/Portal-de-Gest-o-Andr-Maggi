const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const printStudents = [
  { reg: "2666110", name: "DAVY HENRIQUE BACHIEGA COSTA", status: "MATRICULADO" },
  { reg: "2666159", name: "JOÃO MIGUEL JESUS ARAUJO THOME", status: "MATRICULADO" },
  { reg: "2666214", name: "ADRIEL COSTA GONÇALO", status: "MATRICULADO" },
  { reg: "2666258", name: "MARIANA BENICIO COSTA", status: "MATRICULADO" },
  { reg: "2666296", name: "JOÃO VITOR DOS SANTOS MATEUS", status: "MATRICULADO" },
  { reg: "2666394", name: "GABRIEL PLACEDINO TREVIZAN", status: "MATRICULADO" },
  { reg: "2666421", name: "JEFERSON TARIFA DOS SANTOS", status: "MATRICULADO" },
  { reg: "2666437", name: "SAMUEL LEANDRO DO VALE", status: "MATRICULADO" },
  { reg: "2667251", name: "ARTHUR DE LIMA SANCHES", status: "MATRICULADO" },
  { reg: "2667225", name: "AKEMILLY MARIA BALDAIA PAIM", status: "MATRICULADO" },
  { reg: "2287110", name: "LOHANE DA SILVA BEZERRA", status: "MATRICULADO" },
  { reg: "2286535", name: "ALLISON VICTOR DOS SANTOS PORTO", status: "TRANSFERIDO DA ESCOLA" },
  { reg: "2288034", name: "GABRIELI MARTINS LIMA", status: "MATRICULADO" },
  { reg: "2289491", name: "TAKAKPYNEITI KABRAL METUKTIRE", status: "MATRICULADO" },
  { reg: "2289783", name: "ELOIZA DE SOUZA DIAS", status: "MATRICULADO" },
  { reg: "2286447", name: "YAN SILVA NUNES", status: "MATRICULADO" },
  { reg: "2458053", name: "GUSTTAVO HENRIQUE DA COSTA SOUZA", status: "MATRICULADO" },
  { reg: "2289500", name: "PAOLLA LIMA DA SILVA", status: "MATRICULADO" },
  { reg: "2323714", name: "GABRIELLY CORREIA DOS SANTOS", status: "MATRICULADO" },
  { reg: "2320081", name: "MATHEUS DE SOUZA FRANÇA", status: "MATRICULADO" },
  { reg: "2305802", name: "JEAN PAULO SOARES DE OLIVEIRA", status: "MATRICULADO" },
  { reg: "2671389", name: "JOYCE DE JESUS DOS SANTOS", status: "MATRICULADO" },
  { reg: "2671365", name: "JORGE HENRIQUE PEREIRA DE AZEVEDO", status: "MATRICULADO" },
  { reg: "2671289", name: "MAXLLEY VICTOR PAULINO BISPO", status: "MATRICULADO" },
  { reg: "2699492", name: "FELIPE GERMANO BENTO DA SILVA", status: "MATRICULADO" },
  { reg: "2709316", name: "HIAGO BRUNO ARAUJO DE ALMEIDA", status: "MATRICULADO" },
  { reg: "2288519", name: "ESTER SANTANA RODRIGUES SANTOS", status: "MATRICULADO" },
  { reg: "2716502", name: "HENRRY GABRIEL CARDOSO DORIA", status: "MATRICULADO" },
  { reg: "2683198", name: "ENZO VINICIOS ALMONDES DE LIMA", status: "MATRICULADO" },
  { reg: "2328592", name: "BEPI METUKTIRE", status: "TRANSFERIDO DA ESCOLA" },
  { reg: "2676547", name: "JOZIFU MATEUS SABINO DE OLIVEIRA", status: "MATRICULADO" },
  { reg: "2732050", name: "CARLOS ANDRÉ PEREIRA MIGUINS", status: "MATRICULADO" },
  { reg: "2734579", name: "ANNA LUCY DA SILVA", status: "MATRICULADO" }
];

async function audit6D() {
  try {
    // Localizar a turma 6º ANO D
    const { data: classroom, error: clsErr } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('name', '6º ANO D')
      .single();

    if (clsErr) {
      console.error("Erro ao encontrar turma 6º ANO D:", clsErr.message);
      return;
    }

    // Buscar alunos vinculados a esta turma no banco de dados
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select(`
        status,
        students (
          id,
          name,
          registration_number
        )
      `)
      .eq('classroom_id', classroom.id);

    if (enrErr) throw enrErr;

    const dbStudents = enrollments.map(e => ({
      reg: e.students?.registration_number?.trim(),
      name: e.students?.name?.trim(),
      status: e.status
    }));

    console.log(`=== AUDITORIA DE INTEGRIDADE: ${classroom.name} ===`);
    console.log(`Total de alunos no print do Sigeduca: ${printStudents.length}`);
    console.log(`Total de registros vinculados no sistema: ${dbStudents.length}\n`);

    const missingStudents = [];

    for (const p of printStudents) {
      // Procurar por matrícula ou nome aproximado
      const found = dbStudents.find(db => 
        (db.reg && db.reg === p.reg) || 
        (db.name && db.name.toLowerCase() === p.name.toLowerCase())
      );

      if (!found) {
        missingStudents.push(p);
      }
    }

    if (missingStudents.length === 0) {
      console.log("✅ RESULTADO: TODOS os alunos listados no print constam no sistema na turma 6º ANO D!");
    } else {
      console.log("⚠️ ATENÇÃO! Os seguintes alunos estão no print do Sigeduca mas NÃO foram encontrados na turma 6º ANO D no sistema:");
      missingStudents.forEach((m, idx) => {
        console.log(`  ${idx + 1}. [${m.reg}] ${m.name} (${m.status})`);
      });
    }

  } catch (err) {
    console.error("Erro geral na auditoria:", err.message);
  }
}

audit6D();
