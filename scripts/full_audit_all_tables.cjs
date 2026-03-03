const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FORBIDDEN = ['ENSINO RELIGIOSO', 'PROJETO DE VIDA', 'PRÁTICAS EXPERIMENTAIS', 'PRATICAS EXPERIMENTAIS'];

function containsForbidden(value) {
    if (value == null) return false;
    const str = String(value).toUpperCase();
    return FORBIDDEN.some(f => str.includes(f));
}

function deepCheck(obj, tableName, recordId) {
    const found = [];
    for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined) continue;
        if (typeof val === 'string' && containsForbidden(val)) {
            found.push({ table: tableName, id: recordId, field: key, value: val });
        } else if (Array.isArray(val)) {
            val.forEach((item, i) => {
                if (typeof item === 'string' && containsForbidden(item)) {
                    found.push({ table: tableName, id: recordId, field: `${key}[${i}]`, value: item });
                } else if (typeof item === 'object' && item !== null) {
                    const sub = deepCheck(item, tableName, recordId);
                    found.push(...sub);
                }
            });
        } else if (typeof val === 'object') {
            const sub = deepCheck(val, tableName, recordId);
            found.push(...sub);
        }
    }
    return found;
}

async function auditTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.log(`  [SKIP] ${tableName}: ${error.message}`);
        return [];
    }
    const hits = [];
    (data || []).forEach(row => {
        const id = row.id || JSON.stringify(row).substring(0, 30);
        const found = deepCheck(row, tableName, id);
        hits.push(...found);
    });
    if (hits.length > 0) {
        console.log(`  [!!!] ${tableName}: ${hits.length} hit(s)`);
    } else {
        console.log(`  [OK]  ${tableName}: ${data.length} records checked`);
    }
    return hits;
}

const TABLES = [
    'students', 'enrollments', 'classrooms', 'class_attendance_records',
    'class_attendance_students', 'lesson_plans', 'staff', 'bncc_skills',
    'student_movements', 'users', 'profiles',
    // Try additional tables that might exist
    'subjects', 'teacher_subjects', 'school_subjects', 'student_grades',
    'occurrences', 'pedagogical_requests', 'school_calendar', 'notifications',
    'psychosocial_referrals', 'special_education_records', 'school_projects',
    'library_schedules', 'announcements', 'student_documents'
];

async function main() {
    console.log('=== COMPREHENSIVE FORBIDDEN SUBJECT AUDIT ===\n');
    console.log('Searching for:', FORBIDDEN.join(', '), '\n');

    const allHits = [];
    for (const table of TABLES) {
        const hits = await auditTable(table);
        allHits.push(...hits);
    }

    console.log('\n=== AUDIT RESULTS ===');
    if (allHits.length === 0) {
        console.log('✅ NO FORBIDDEN SUBJECTS FOUND IN ANY TABLE');
    } else {
        console.log(`❌ FOUND ${allHits.length} HITS:`);
        allHits.forEach(h => {
            console.log(`  Table: ${h.table} | ID: ${h.id} | Field: ${h.field}`);
            console.log(`  Value: "${h.value}"`);
        });
    }
}

main().catch(console.error);
