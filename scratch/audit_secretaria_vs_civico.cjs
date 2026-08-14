const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase config missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAudit() {
  console.log("=== AUDITORIA: SECRETARIA (GESTÃO DE TURMAS) VS CÍVICO-MILITAR ===");

  // 1. Fetch classrooms
  const { data: classrooms, error: classErr } = await supabase
    .from('classrooms')
    .select('*')
    .order('name', { ascending: true });

  if (classErr) {
    console.error("Erro ao buscar classrooms:", classErr);
    return;
  }

  console.log(`Encontradas ${classrooms?.length || 0} turmas cadastradas:`);
  classrooms?.forEach(c => console.log(` - ID: ${c.id} | Nome: ${c.name} | Turno: ${c.shift}`));

  // 2. Fetch all enrollments
  const { data: enrollments, error: enrErr } = await supabase
    .from('enrollments')
    .select('*, student:students(*), classroom:classrooms(*)');

  if (enrErr) {
    console.error("Erro ao buscar enrollments:", enrErr);
    return;
  }

  console.log(`\nTotal de matrículas (enrollments) no banco: ${enrollments?.length || 0}`);

  // Group enrollments by status
  const statusCounts = {};
  enrollments?.forEach(e => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });
  console.log("Distribuição por status de matrícula:", statusCounts);

  // 3. Fetch all students
  const { data: students, error: studErr } = await supabase
    .from('students')
    .select('*, enrollments(*, classrooms(*))');

  if (studErr) {
    console.error("Erro ao buscar alunos:", studErr);
    return;
  }

  console.log(`\nTotal de alunos (students) no banco: ${students?.length || 0}`);

  // Analyze students
  const missingFromCivico = [];
  const noEnrollments = [];
  const differentStatusEnrollments = [];

  students?.forEach(s => {
    const enrollmentsList = s.enrollments || [];
    
    if (enrollmentsList.length === 0) {
      noEnrollments.push(s);
    } else {
      // Logic used in CivicoMilitarModule:
      // const activeEnr = s.enrollments?.find((e: any) => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO') || s.enrollments?.[0];
      const activeEnrCivico = enrollmentsList.find(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO') || enrollmentsList[0];
      
      // Check if any enrollment has status != 'ATIVO' / 'RECLASSIFICADO' (e.g. 'MATRICULADO', 'CURSANDO', etc.)
      const otherEnr = enrollmentsList.find(e => e.status !== 'ATIVO' && e.status !== 'RECLASSIFICADO');
      if (otherEnr) {
        differentStatusEnrollments.push({ student: s, enrollment: otherEnr });
      }

      if (!activeEnrCivico || !activeEnrCivico.classrooms) {
        missingFromCivico.push({
          studentId: s.id,
          name: s.name,
          registration: s.registration_number,
          enrollmentsCount: enrollmentsList.length,
          enrollmentStatuses: enrollmentsList.map(e => `${e.status} (Turma: ${e.classrooms?.name || 'SEM SALA'})`)
        });
      }
    }
  });

  console.log("\n==========================================================================");
  console.log("                    DIAGNÓSTICO DE DIVERGÊNCIAS                           ");
  console.log("==========================================================================");

  console.log(`\n1. Alunos SEM nenhuma matrícula vinculada (${noEnrollments.length}):`);
  noEnrollments.slice(0, 20).forEach(s => {
    console.log(` - [ID: ${s.id}] ${s.name} (Matrícula: ${s.registration_number})`);
  });

  console.log(`\n2. Alunos com matrículas com status DIFERENTE de 'ATIVO'/'RECLASSIFICADO' (${differentStatusEnrollments.length}):`);
  differentStatusEnrollments.forEach(item => {
    console.log(` - ${item.student.name} | Status: '${item.enrollment.status}' | Turma: ${item.enrollment.classrooms?.name || 'SEM SALA'}`);
  });

  console.log(`\n3. Alunos sem Turma no Módulo Cívico-Militar ("SEM TURMA") (${missingFromCivico.length}):`);
  console.table(missingFromCivico);

  // 4. Breakdown per class in Secretaria (Gestão de Turmas)
  console.log("\n==========================================================================");
  console.log("             CONFERÊNCIA TURMA POR TURMA (SECRETARIA VS CÍVICO)          ");
  console.log("==========================================================================");

  classrooms?.forEach(cls => {
    const classEnrollments = enrollments?.filter(e => e.classroom_id === cls.id) || [];
    const activeClassEnrollments = classEnrollments.filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
    const inactiveClassEnrollments = classEnrollments.filter(e => e.status !== 'ATIVO' && e.status !== 'RECLASSIFICADO');

    console.log(`\n🏫 Turma: ${cls.name} (${cls.shift})`);
    console.log(`   - Total de Alunos na Secretaria: ${classEnrollments.length}`);
    console.log(`   - Ativos/Reclassificados: ${activeClassEnrollments.length}`);
    console.log(`   - Outros Status: ${inactiveClassEnrollments.length}`);
    
    if (inactiveClassEnrollments.length > 0) {
      console.log(`   ⚠️ Alunos que podem estar OMITIDOS no Cívico-Militar:`);
      inactiveClassEnrollments.forEach(e => {
        console.log(`      * ${e.student?.name} (Status: '${e.status}')`);
      });
    }
  });
}

runAudit();
