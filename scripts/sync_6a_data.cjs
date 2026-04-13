const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const classroomId = '65988e66-36c6-41b6-988c-60892c5c8053'; // 6º ANO A

const studentsData = [
  { reg: "2668996", name: "ANA CLARA PEREIRA BRITO", gender: "FEMININO", birth: "2015-02-12", enroll: "2026-01-19" },
  { reg: "2668972", name: "BEPIET PANARA METUKTIRE", gender: "MASCULINO", birth: "2014-02-28", enroll: "2026-01-19" },
  { reg: "2669069", name: "CRISLAINE VICTORIA FARIAS DE ALMEIDA", gender: "FEMININO", birth: "2014-05-27", enroll: "2026-01-19" },
  { reg: "2669227", name: "CRISLANE EDUARDA FARIAS DE ALMEIDA", gender: "FEMININO", birth: "2014-05-27", enroll: "2026-01-19" },
  { reg: "2667873", name: "DAVI LUCAS LIMA RODRIGUES", gender: "MASCULINO", birth: "2014-05-08", enroll: "2026-01-19" },
  { reg: "2668931", name: "EMILY CRISTINA DO NASCIMENTO", gender: "FEMININO", birth: "2014-04-30", enroll: "2026-01-19" },
  { reg: "2668902", name: "ENZO ARTHUR DA SILVA SANTOS", gender: "MASCULINO", birth: "2015-03-02", enroll: "2026-01-19" },
  { reg: "2723256", name: "FELIPE NUNES DA SILVA", gender: "MASCULINO", birth: "2014-06-05", enroll: "2026-02-02" },
  { reg: "2302994", name: "GUILHERME SOUZA ALVES", gender: "MASCULINO", birth: "2014-07-03", enroll: "2026-01-19" },
  { reg: "2286436", name: "GUSTAVO HENRIQUE DE PAULA DE LARA", gender: "MASCULINO", birth: "2015-03-05", enroll: "2026-01-19" },
  { reg: "2668889", name: "ISADORA CAETANO MATEUS", gender: "FEMININO", birth: "2014-10-09", enroll: "2026-01-19" },
  { reg: "2304199", name: "JASMIM RAFAELA AMÂNCIO DE LIMA", gender: "FEMININO", birth: "2015-03-23", enroll: "2026-01-19" },
  { reg: "2668897", name: "JOÃO GABRIEL DE OLIVEIRA MARTINS", gender: "MASCULINO", birth: "2014-12-19", enroll: "2026-01-19" },
  { reg: "2667419", name: "JOÃO LUCAS DE SOUZA DA SILVA", gender: "MASCULINO", birth: "2015-01-01", enroll: "2026-01-19" },
  { reg: "2292207", name: "JOÃO OTÁVIO GONSALVES DE LIMA", gender: "MASCULINO", birth: "2014-04-18", enroll: "2026-01-19" },
  { reg: "2286454", name: "JOÃO VITOR PEREIRA DA SILVA", gender: "MASCULINO", birth: "2014-06-18", enroll: "2026-01-19" },
  { reg: "2667474", name: "KAUAN FEITOSA MORAES", gender: "MASCULINO", birth: "2014-10-28", enroll: "2026-01-19" },
  { reg: "2667915", name: "LEONEL FELIPE OLIVEIRA DOS SANTOS", gender: "MASCULINO", birth: "2014-02-13", enroll: "2026-01-19" },
  { reg: "2667952", name: "MARIA FERNANDA EQUIDONE MACHADO", gender: "FEMININO", birth: "2014-10-08", enroll: "2026-01-19" },
  { reg: "2667264", name: "MICHEL AZEVEDO PEREIRA", gender: "FEMININO", birth: "2014-04-04", enroll: "2026-01-19" },
  { reg: "2667299", name: "MIGUEL AZEVEDO PEREIRA", gender: "MASCULINO", birth: "2014-04-04", enroll: "2026-01-19" },
  { reg: "2325694", name: "MIKAELY TIBURCIO SILVA", gender: "MASCULINO", birth: "2014-10-02", enroll: "2026-01-19" },
  { reg: "2670913", name: "MISAEL LUIZ DA SILVA DIAS", gender: "MASCULINO", birth: "2015-01-06", enroll: "2026-01-19" },
  { reg: "2287215", name: "PAULA FERNANDA COIMBRA DA SILVA", gender: "FEMININO", birth: "2014-08-02", enroll: "2026-01-19" },
  { reg: "2668909", name: "SABRINA VITORIA MATIAS MARTINS", gender: "FEMININO", birth: "2014-06-27", enroll: "2026-01-19" },
  { reg: "2667896", name: "WELBER LERRANDRO LOPES APARECIDO", gender: "FEMININO", birth: "2013-05-06", enroll: "2026-01-19" },
  { reg: "2667280", name: "YURY LINS DOS SANTOS MOTA", gender: "MASCULINO", birth: "2014-12-21", enroll: "2026-01-19" },
  { reg: "2397899", name: "FERNANDO DJARA TXUCARRAMÃE", gender: "MASCULINO", birth: "2014-05-08", enroll: "2026-02-06" },
  { reg: "2347759", name: "EMILLY VITÓRIA GOMES DOS SANTOS", gender: "FEMININO", birth: "2014-06-24", enroll: "2026-02-09" },
  { reg: "2726402", name: "DAVI CARVALHO SALMENTO", gender: "MASCULINO", birth: "2013-08-20", enroll: "2026-02-11" }
];

async function syncData() {
  console.log("Starting full data sync for 6th Grade A...");

  for (const s of studentsData) {
    // 1. Find the student by name first (since registration numbers might be slightly off in DB)
    const { data: foundStudents, error: findError } = await supabase
      .from('students')
      .select('id, name, registration_number')
      .ilike('name', s.name);

    if (findError) {
      console.error(`Error finding ${s.name}:`, findError.message);
      continue;
    }

    if (!foundStudents || foundStudents.length === 0) {
      console.warn(`Student not found by name: ${s.name}. Trying by registration...`);
      // Try finding by registration if name match fails
      const { data: foundByReg } = await supabase
        .from('students')
        .select('id, name, registration_number')
        .eq('registration_number', s.reg);
      
      if (foundByReg && foundByReg.length > 0) {
        processStudent(foundByReg[0], s);
      } else {
        console.error(`Student completely missing: ${s.name} (${s.reg})`);
      }
    } else {
      processStudent(foundStudents[0], s);
    }
  }

  async function processStudent(student, target) {
    console.log(`Syncing: ${target.name}...`);
    
    // Update basic student data
    const { error: studentError } = await supabase
      .from('students')
      .update({
        gender: target.gender,
        birth_date: target.birth,
        registration_number: target.reg,
        name: target.name // Ensure name is exact as per report
      })
      .eq('id', student.id);

    if (studentError) {
      console.error(`  Error updating student table for ${target.name}:`, studentError.message);
    } else {
      console.log(`  ✓ Updated students table (Sex, Birth, Reg)`);
    }

    // Update enrollment data (Data de Matrícula)
    const { error: enrollError } = await supabase
      .from('enrollments')
      .update({ enrollment_date: target.enroll })
      .eq('student_id', student.id)
      .eq('classroom_id', classroomId);

    if (enrollError) {
      console.error(`  Error updating enrollment for ${target.name}:`, enrollError.message);
    } else {
      console.log(`  ✓ Updated enrollment date: ${target.enroll}`);
    }
  }

  console.log("Full data sync finished.");
}

syncData();
