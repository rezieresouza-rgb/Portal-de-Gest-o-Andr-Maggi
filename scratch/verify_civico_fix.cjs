const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPerfectSync() {
  console.log("=== TESTANDO CONEXÃO PERFEITA (SECRETARIA VS CÍVICO-MILITAR) ===\n");

  const { data: dbClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .order('name');

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
       classroom_id,
       status,
       students (*)
    `);

  const { data: dbStudents } = await supabase
    .from('students')
    .select('*, enrollments(status, classrooms(name, shift))');

  // CivicoMilitar Logic
  const mappedCivico = dbStudents?.map((s) => {
    const activeEnr = 
      s.enrollments?.find((e) => e.status === 'ATIVO') ||
      s.enrollments?.find((e) => e.status === 'MATRICULADO' || e.status === 'CURSANDO') ||
      s.enrollments?.find((e) => e.status === 'RECLASSIFICADO');

    if (!activeEnr) return null;

    return {
      id: s.id,
      name: s.name,
      registration: s.registration_number,
      turma: activeEnr.classrooms?.name || 'SEM TURMA',
      shift: activeEnr.classrooms?.shift || '---'
    };
  }).filter(Boolean) || [];

  const civicoByTurma = {};
  mappedCivico.forEach(s => {
    if (!civicoByTurma[s.turma]) civicoByTurma[s.turma] = [];
    civicoByTurma[s.turma].push(s);
  });

  let totalSec = 0;
  let totalCiv = 0;
  let matches = 0;

  dbClassrooms?.forEach(cls => {
    // Secretaria logic excluding old reclassified/transferred records when student has an active enrollment elsewhere
    const secStudentsInClass = enrollments?.filter(e => {
      if (e.classroom_id !== cls.id) return false;
      if (e.status === 'TRANSFERIDO DE ESCOLA' || e.status === 'TRANSFERIDO DE TURMA') return false;

      const studentEnrs = enrollments.filter(other => other.students?.id === e.students?.id);
      const hasNewerActive = studentEnrs.some(other => other.classroom_id !== cls.id && other.status === 'ATIVO');
      if (hasNewerActive && e.status !== 'ATIVO') return false;

      return true;
    }) || [];

    const civStudentsInClass = civicoByTurma[cls.name] || [];

    totalSec += secStudentsInClass.length;
    totalCiv += civStudentsInClass.length;

    const isMatch = secStudentsInClass.length === civStudentsInClass.length;
    if (isMatch) matches++;

    console.log(`🏫 Turma: ${cls.name.padEnd(20)} | Secretaria: ${secStudentsInClass.length} alunos | Cívico-Militar: ${civStudentsInClass.length} alunos | ${isMatch ? '✅ 100% SINCRO' : '⚠️ DIVERGENTE'}`);
  });

  console.log(`\n==========================================================================`);
  console.log(` - Total Alunos Ativos na Escola: ${totalSec}`);
  console.log(` - Turmas em 100% de Sincronia: ${matches} de ${dbClassrooms?.length}`);
  console.log(`==========================================================================`);
}

testPerfectSync();
