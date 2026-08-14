const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function compareClassroomStudents() {
  console.log("=== COMPARAÇÃO DETALHADA: ALUNOS DA SECRETARIA (GESTÃO DE TURMAS) VS CÍVICO-MILITAR ===\n");

  // 1. Fetch classrooms
  const { data: dbClassrooms } = await supabase
    .from('classrooms')
    .select('*')
    .order('name');

  // 2. Fetch enrollments like SecretariatClassroomManager does
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
       classroom_id,
       status,
       enrollment_date,
       adjustment_date,
       students (*)
    `);

  // 3. Fetch students like CivicoMilitarModule does
  const { data: dbStudentsCivico } = await supabase
    .from('students')
    .select('*, enrollments(status, classrooms(name, shift))');

  // Map CivicoMilitar students
  const civicoMapped = dbStudentsCivico?.map((s) => {
    // Civico logic:
    const activeEnr = s.enrollments?.find((e) => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO') || s.enrollments?.[0];
    return {
      id: s.id,
      name: s.name,
      registration: s.registration_number,
      civicoTurma: activeEnr?.classrooms?.name || 'SEM TURMA',
      civicoStatus: activeEnr?.status || 'SEM STATUS'
    };
  }) || [];

  const civicoByTurma = {};
  civicoMapped.forEach(s => {
    if (!civicoByTurma[s.civicoTurma]) civicoByTurma[s.civicoTurma] = [];
    civicoByTurma[s.civicoTurma].push(s);
  });

  console.log("==========================================================================");
  console.log("                      RELATÓRIO POR TURMA                                ");
  console.log("==========================================================================");

  let totalSecretariaActive = 0;
  let totalCivicoAssigned = 0;
  const discrepancies = [];

  dbClassrooms?.forEach(cls => {
    const classEnrollments = enrollments?.filter(e => e.classroom_id === cls.id) || [];
    
    // Secretariat active/enrolled students (status is ATIVO, RECLASSIFICADO, MATRICULADO, CURSANDO, or not TRANSFERIDO)
    const secretariaActiveStudents = classEnrollments.filter(e => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO' || e.status === 'MATRICULADO' || e.status === 'CURSANDO');
    
    const civicoStudentsInClass = civicoByTurma[cls.name] || [];

    totalSecretariaActive += secretariaActiveStudents.length;
    totalCivicoAssigned += civicoStudentsInClass.length;

    // Find students present in Secretaria active list for this class BUT not in Civico list for this class
    const civicoStudentIdsInClass = new Set(civicoStudentsInClass.map(s => s.id));
    const missingInCivicoForThisClass = secretariaActiveStudents.filter(e => !civicoStudentIdsInClass.has(e.students?.id));

    if (missingInCivicoForThisClass.length > 0 || secretariaActiveStudents.length !== civicoStudentsInClass.length) {
      discrepancies.push({
        turma: cls.name,
        turno: cls.shift,
        qtdSecretaria: secretariaActiveStudents.length,
        qtdCivico: civicoStudentsInClass.length,
        missingStudents: missingInCivicoForThisClass.map(e => ({
          name: e.students?.name,
          registration: e.students?.registration_number,
          enrollmentStatus: e.status,
          civicoAssignedTurma: civicoMapped.find(m => m.id === e.students?.id)?.civicoTurma
        }))
      });
    }
  });

  console.log(`\nTotal de alunos ATIVOS/MATRICULADOS na Secretaria: ${totalSecretariaActive}`);
  console.log(`Total de alunos ATRIBUÍDOS às turmas no Cívico-Militar: ${totalCivicoAssigned}`);
  console.log(`\nTurmas com divergências de contagem ou alunos omitidos: ${discrepancies.length}\n`);

  discrepancies.forEach(d => {
    console.log(`--------------------------------------------------------------------------`);
    console.log(`🏫 TURMA: ${d.turma} (${d.turno})`);
    console.log(`   - Alunos Ativos na Secretaria (Gestão de Turmas): ${d.qtdSecretaria}`);
    console.log(`   - Alunos Exibidos no Cívico-Militar: ${d.qtdCivico}`);
    if (d.missingStudents.length > 0) {
      console.log(`   ⚠️ Alunos matriculados na Secretaria que NÃO APARECEM no Cívico-Militar nesta turma:`);
      d.missingStudents.forEach(m => {
        console.log(`      * Nome: ${m.name} | Matrícula: ${m.registration} | Status no Banco: '${m.enrollmentStatus}' | No Cívico está em: '${m.civicoAssignedTurma}'`);
      });
    }
  });
}

compareClassroomStudents();
