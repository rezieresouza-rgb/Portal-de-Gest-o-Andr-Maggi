import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import xlsx from 'xlsx';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importExcel() {
    console.log("Reading Excel file...");
    const wb = xlsx.readFile('C:/Users/rezie/OneDrive/Área de Trabalho/arquivos sistema/6º ANO.xlsx');
    const sheet = wb.Sheets['DADOS'];
    const rows = xlsx.utils.sheet_to_json(sheet);

    // Group by Turma
    const turmaToRows = {};
    for (const row of rows) {
        if (!turmaToRows[row.Turma]) {
            turmaToRows[row.Turma] = [];
        }
        turmaToRows[row.Turma].push(row);
    }

    const subjects = ['Arte', 'Ciências', 'Geografia', 'História', 'Língua Portuguesa', 'Matemática'];

    console.log("Fetching Classrooms...");
    const { data: classrooms, error: classErr } = await supabase.from('classrooms').select('id, name');
    if (classErr) throw classErr;

    console.log("Fetching Students...");
    const { data: students, error: studErr } = await supabase.from('students').select('id, name, enrollments(status, classroom_id, classrooms(name, id))');
    if (studErr) throw studErr;

    const classMap = {};
    for (const c of classrooms) {
        classMap[c.name.trim().toUpperCase()] = c.id;
    }

    // Map students to their active classroom ID
    const studentClassMap = new Map();
    for (const s of students) {
        const activeEnrollment = s.enrollments?.find((e) => e.status === 'ATIVO' || e.status === 'RECLASSIFICADO');
        if (activeEnrollment) {
            // some enrollments have classroom_id directly, some have classrooms object
            const cid = activeEnrollment.classroom_id || (Array.isArray(activeEnrollment.classrooms) ? activeEnrollment.classrooms[0]?.id : activeEnrollment.classrooms?.id);
            if (cid) studentClassMap.set(s.id, cid);
        }
    }

    // Process each class
    for (const [turmaName, studentsData] of Object.entries(turmaToRows)) {
        console.log(`Processing Turma: ${turmaName}`);
        
        let dbTurmaName = turmaName;
        // Example: 'EF2-6º ANO-Vesp-D' -> '6º ANO D'
        const match = turmaName.match(/(\d+º\s*ANO)-.*?-([A-Z])/i);
        if (match) {
            dbTurmaName = `${match[1]} ${match[2]}`.toUpperCase();
        }

        const classId = classMap[dbTurmaName.trim().toUpperCase()];
        if (!classId) {
            console.error(`Classroom not found: ${dbTurmaName} (Original: ${turmaName})`);
            continue;
        }

        const classStudents = students.filter(s => studentClassMap.get(s.id) === classId);

        for (const subject of subjects) {
            console.log(`  Processing Subject: ${subject}`);
            
            // 1. Create Assessment
            const { data: assessData, error: assessError } = await supabase
                .from('assessments')
                .insert([{
                    classroom_id: classId,
                    date: new Date().toLocaleDateString('sv-SE'),
                    bimestre: '1º BIMESTRE',
                    subject: subject.toUpperCase(),
                    type: 'CAED',
                    max_score: 100,
                    teacher_id: null
                }])
                .select()
                .single();

            if (assessError) {
                console.error(`Failed to insert assessment for ${subject}:`, assessError);
                continue;
            }

            const assessmentId = assessData.id;
            const gradesToInsert = [];

            for (const row of studentsData) {
                const rawScore = row[subject];
                if (!rawScore || rawScore === 'Ausente' || rawScore === '-') continue;

                // Match student
                const studentName = row.Nome.trim().toUpperCase();
                const student = classStudents.find(s => s.name.toUpperCase() === studentName);
                
                if (!student) {
                    console.warn(`    Student not found: ${studentName}`);
                    continue;
                }

                // parse score: '83%' -> 83
                const scoreStr = String(rawScore).replace('%', '').trim();
                const score = parseInt(scoreStr) || 0;

                let level = 'MUITO_BAIXO';
                if (score >= 80) level = 'ALTO';
                else if (score >= 60) level = 'MÉDIO';
                else if (score >= 40) level = 'BAIXO';

                gradesToInsert.push({
                    assessment_id: assessmentId,
                    student_id: student.id,
                    score: score,
                    proficiency_level: level
                });
            }

            if (gradesToInsert.length > 0) {
                const { error: gradesError } = await supabase.from('grades').insert(gradesToInsert);
                if (gradesError) {
                    console.error(`Failed to insert grades for ${subject}:`, gradesError);
                } else {
                    console.log(`    Inserted ${gradesToInsert.length} grades.`);
                }
            } else {
                console.log(`    No grades to insert.`);
            }
        }
    }
    console.log("Import Complete!");
}

importExcel().catch(console.error);
