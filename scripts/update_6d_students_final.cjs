const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CLASSROOM_ID = 'b514754e-5c4c-4e8c-8f4d-f9e0f6b4e8c8'; // ID do 6º Ano D (fragmento capturado)
// Nota: Validar o ID real antes de rodar ou buscar pelo nome

const studentsData = [
  { registration: "2668110", name: "DAVY HENRIQUE RACHIEGA COSTA", birth: "2014-06-15", gender: "M", guardian: "ROZANA APARECIDA DA FONSECA RACHIEGA DA COSTA", contact: "66996326080", status: "ATIVO" },
  { registration: "2666169", name: "JOÃO MIGUEL JESUS ARAUJO THOME", birth: "2014-04-04", gender: "M", guardian: "ROSILDA JESUS ARAUJO THOME", contact: "66996542144", status: "ATIVO" },
  { registration: "2663214", name: "ADRIEL COSTA GONÇALO", birth: "2014-07-03", gender: "M", guardian: "NADJA COSMO COSTA", contact: "66998088884", status: "ATIVO" },
  { registration: "2663238", name: "MARIANA BENICIO COSTA", birth: "2014-03-03", gender: "F", guardian: "JOSIANE TREVIZAN", contact: "66996485916", status: "ATIVO" },
  { registration: "2663235", name: "JOÃO VITOR DOS SANTOS MATEUS", birth: "2014-11-19", gender: "M", guardian: "ANGELICA DOS SANTOS CORREA", contact: "66997118387", status: "ATIVO" },
  { registration: "2666354", name: "GABRIEL PLACEDINO TREVIZAN", birth: "2014-03-29", gender: "M", guardian: "JOSIANE TREVIZAN", contact: "66996485916", status: "ATIVO" },
  { registration: "2666421", name: "JEFERSON TARIFA DOS SANTOS", birth: "2014-08-26", gender: "M", guardian: "LEIA CARNICA TARIFA DOS SANTOS", contact: "66999731995", status: "ATIVO" },
  { registration: "2666437", name: "SAMUEL LEANDRO DO VALE", birth: "2014-04-19", gender: "M", guardian: "ROSILDA JESUS ARAUJO THOME", contact: "66996542144", status: "ATIVO" },
  { registration: "2667251", name: "ARTHUR DE LIMA SANCHES", birth: "2015-01-05", gender: "M", guardian: "LARISSA RAYANE BARBOSA DE LIVA", contact: "66997145585", status: "ATIVO" },
  { registration: "2667226", name: "AKEMILLY MARIA BALDAIA PAIM", birth: "2014-04-11", gender: "F", guardian: "ELI CRISTINA SANTOS BALDAIA", contact: "66999328294", status: "ATIVO" },
  { registration: "2287110", name: "LORANE DA SILVA BEZERRA", birth: "2014-04-19", gender: "F", guardian: "", contact: "", status: "ATIVO" },
  { registration: "2286935", name: "ALLISON VICTOR DOS SANTOS PORTO", birth: "2014-11-05", gender: "M", guardian: "ADENILZA DOS SANTOS SILVA", contact: "66996182188", status: "TRANSFERIDO" },
  { registration: "2286904", name: "GABRIELI MARTINS LIMA", birth: "2015-01-23", gender: "F", guardian: "KARINA SANTOS LIMA", contact: "66996348554", status: "ATIVO" },
  { registration: "2339491", name: "TAKAKPYNEITI KABRAL METUKTIRE", birth: "2014-06-04", gender: "M", guardian: "NAIGRA TARAYUNA", contact: "66996007543", status: "ATIVO" },
  { registration: "2289783", name: "ELOIZA DE SOUZA DIAS", birth: "2014-05-30", gender: "F", guardian: "MARIA LUCIANA DE SOUZA", contact: "66996182715", status: "ATIVO" },
  { registration: "2286447", name: "YAN SILVA NUNES", birth: "2015-01-23", gender: "M", guardian: "", contact: "", status: "ATIVO" },
  { registration: "2459053", name: "GUSTTAVO HENRIQUE DA COSTA SOUZA", birth: "2014-07-03", gender: "M", guardian: "EDICLEIA DA COSTA", contact: "66999752581", status: "ATIVO" },
  { registration: "2289500", name: "PAOLLA LIMA DA SILVA", birth: "2014-01-10", gender: "F", guardian: "", contact: "", status: "ATIVO" },
  { registration: "2323714", name: "GABRIELLY CORREIA DOS SANTOS", birth: "2014-05-26", gender: "F", guardian: "CAROLAINE DOS SANTOS", contact: "66999585428", status: "ATIVO" },
  { registration: "2320081", name: "MATHEUS DE SOUZA FRANÇA", birth: "2015-02-11", gender: "M", guardian: "IVONE SANTANA RODRIGUES SANTOS", contact: "66997211840", status: "ATIVO" },
  { registration: "2305802", name: "JEAN PAULO SOARES DE OLIVEIRA", birth: "2014-05-02", gender: "M", guardian: "ROSALINA SOARES", contact: "66996864832", status: "ATIVO" },
  { registration: "2671289", name: "HIAGGLAY VICTOR PAULINO BISPO", birth: "2014-12-02", gender: "M", guardian: "ROSILDA PAULINO", contact: "66997001100", status: "ATIVO" },
  { registration: "2671365", name: "JORGE HENRIQUE PEREIRA DE AZEVEDO", birth: "2015-02-03", gender: "M", guardian: "MARIA ELIZA RODRIGUES", contact: "66996778029", status: "ATIVO" },
  { registration: "2671389", name: "JOYCE DE JESUS DOS SANTOS", birth: "2014-10-03", gender: "F", guardian: "ROSILDA SOARES THOME", contact: "66996542144", status: "ATIVO" },
  { registration: "2699492", name: "FELIPE GERMANO BENTO DA SILVA", birth: "2014-08-19", gender: "M", guardian: "KELLY CRISTINA BENTO", contact: "66998641380", status: "ATIVO" },
  { registration: "2709916", name: "HIAGO BRUNO ARAUJO DE ALMEIDA", birth: "2014-01-15", gender: "M", guardian: "EDILAINE DE ARAUJO DA SILVA", contact: "66996043536", status: "ATIVO" },
  { registration: "2288519", name: "ESTER SANTANA RODRIGUES SANTOS", birth: "2013-01-24", gender: "F", guardian: "IVONE SANTANA RODRIGUES SANTOS", contact: "66997211840", status: "ATIVO" },
  { registration: "2716002", name: "HENRRY GABRIEL CARDOSO DORIA", birth: "2014-08-22", gender: "M", guardian: "ADRIELI DIAS CARDOSO DA SILVA", contact: "66996825437", status: "ATIVO" },
  { registration: "2683158", name: "ENZO VINICIUS ALMONDES DE LIMA", birth: "2014-07-03", gender: "M", guardian: "DAIANE DE ALMONDES DA SILVA", contact: "66999255014", status: "ATIVO" },
  { registration: "2328692", name: "BEPI METUKTIRE", birth: "2013-05-05", gender: "M", guardian: "IREPAET METUKTIRE", contact: "66996007543", status: "TRANSFERIDO" }
];

async function updateAll() {
  console.log("Iniciando Sincronização da Turma 6º Ano D...");
  
  // Buscar o ID real da turma pelo nome para garantir
  const { data: classData } = await supabase.from('classrooms').select('id').eq('name', '6º ANO D').single();
  if (!classData) {
    console.error("Turma 6º ANO D não encontrada!");
    return;
  }
  const realClassId = classData.id;

  for (const student of studentsData) {
    try {
      // 1. Upsert do Aluno (usando o código de registro como chave de conflito)
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .upsert({
          registration_number: student.registration,
          name: student.name,
          birth_date: student.birth,
          gender: student.gender,
          guardian_name: student.guardian || null,
          contact_phone: student.contact || null
        }, { onConflict: 'registration_number' })
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Enturmação (Enrollment)
      // Primeiro verificar se já está matriculado nessa mesma turma
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentRecord.id)
        .eq('classroom_id', realClassId)
        .single();

      if (!existingEnrollment) {
        // Se estiver em outra turma, removemos a matrícula antiga (duplicidade de enturmação)
        await supabase.from('enrollments').delete().eq('student_id', studentRecord.id);
        
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            student_id: studentRecord.id,
            classroom_id: realClassId,
            status: student.status === 'TRANSFERIDO' ? 'TRANSFERIDO' : 'ATIVO'
          });
        
        if (enrollError) console.error(`Erro ao matricular ${student.name}:`, enrollError);
      } else if (existingEnrollment.status !== (student.status === 'TRANSFERIDO' ? 'TRANSFERIDO' : 'ATIVO')) {
        // Atualiza apenas o status se necessário
        await supabase.from('enrollments')
          .update({ status: student.status === 'TRANSFERIDO' ? 'TRANSFERIDO' : 'ATIVO' })
          .eq('id', existingEnrollment.id);
      }

      // 3. Registrar Movimentação se for transferido
      if (student.status === 'TRANSFERIDO') {
        const { data: movementExists } = await supabase
          .from('student_movements')
          .select('id')
          .eq('student_id', studentRecord.id)
          .eq('movement_type', 'TRANSFERENCIA')
          .limit(1);
        
        if (!movementExists || movementExists.length === 0) {
          await supabase.from('student_movements').insert({
            student_id: studentRecord.id,
            movement_type: 'TRANSFERENCIA',
            description: `Transferido da Escola (Relatório Sige) - ${student.registration}`,
            movement_date: student.registration === '2286935' ? '2026-03-23' : '2026-03-10'
          });
        }
      }

      console.log(`✓ Processado: ${student.name}`);
    } catch (err) {
      console.error(`X Erro ao processar ${student.name}:`, err.message);
    }
  }
  
  console.log("Sincronização Concluída!");
}

updateAll();
