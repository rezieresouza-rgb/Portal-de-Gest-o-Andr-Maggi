
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const forbiddenSubjects = [
    "Ensino Religioso",
    "Práticas experimentais",
    "Projeto de Vida"
];

const tablesToSearch = [
    "users", "students", "classrooms", "enrollments", "suppliers", "contracts",
    "contract_items", "orders", "order_items", "funds", "transactions",
    "lesson_plans", "assessments", "grades", "occurrences", "referrals",
    "mediation_cases", "active_search_actions", "class_attendance_records",
    "class_attendance_students", "teacher_subjects", "teacher_classes",
    "subjects", "staff", "bncc_skills", "almoxarifado_items", "almoxarifado_movements",
    "almoxarifado_requests", "almoxarifado_uniforms", "contract_events",
    "access_logs", "staff_movements", "staff", "school_announcements",
    "school_events", "school_celebrations", "birthday_people",
    "occurrence_atas", "psychosocial_referrals", "psychosocial_meeting_atas",
    "rights_violation_notifications", "secretariat_notifications",
    "books", "readers", "loans", "chromebook_bookings", "science_lab_bookings",
    "pedagogical_kitchen_bookings", "library_room_bookings", "maker_lab_bookings",
    "auditorium_bookings", "classroom_occurrences", "classroom_observations",
    "pedagogical_projects", "pedagogical_materials", "pedagogical_material_requests",
    "equipment_bookings", "assets", "technical_sheets", "shopping_list_items",
    "school_environments", "cleaning_tasks", "printed_documents",
    "cleaning_employees", "ppe_items", "ppe_deliveries", "cleaning_materials",
    "material_deliveries", "material_entries", "maintenance_tasks",
    "psychosocial_appointments", "campaigns", "campaign_feedbacks",
    "supplier_occurrences", "class_schedules", "student_movements",
    "preventive_maintenance_items"
];

async function deepAudit() {
    console.log(`Starting refined deep audit of ${tablesToSearch.length} tables...`);

    for (const tableName of tablesToSearch) {
        process.stdout.write(`Searching table: ${tableName}... `);
        try {
            const { data: sample, error: sampleError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (sampleError) {
                if (sampleError.code === '42P01') {
                    console.log('SKIPPED (Table not found)');
                } else if (sampleError.code === '42501') {
                    console.log('SKIPPED (Permission denied - RLS)');
                } else {
                    console.log(`ERROR (${sampleError.code}): ${sampleError.message}`);
                }
                continue;
            }

            const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
            if (columns.length === 0) {
                // Try searching anyway on common columns
                const commonCols = ['subject', 'name', 'description', 'title', 'observations', 'notes', 'reason'];
                let foundAny = false;
                for (const col of commonCols) {
                    for (const subject of forbiddenSubjects) {
                        const { data, error } = await supabase
                            .from(tableName)
                            .select('*')
                            .ilike(col, `%${subject}%`)
                            .limit(5);

                        if (data && data.length > 0) {
                            console.log(`\n[FOUND] Table: ${tableName}, Column: ${col}, Value matches: "${subject}"`);
                            console.log('Matches:', JSON.stringify(data, null, 2));
                            foundAny = true;
                        }
                    }
                }
                if (!foundAny) console.log('EMPTY (No rows or matches)');
                continue;
            }

            let foundAnyInTable = false;
            for (const col of columns) {
                const val = sample[0][col];
                // Only search text-like columns or arrays (which Supabase filters can handle)

                for (const subject of forbiddenSubjects) {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .ilike(col, `%${subject}%`)
                        .limit(5);

                    if (data && data.length > 0) {
                        console.log(`\n[FOUND] Table: ${tableName}, Column: ${col}, Value matches: "${subject}"`);
                        console.log('Matches:', JSON.stringify(data, null, 2));
                        foundAnyInTable = true;
                    }
                }
            }
            if (!foundAnyInTable) console.log('CLEAN');

        } catch (err) {
            console.log(`UNEXPECTED ERROR: ${err.message}`);
        }
    }
    console.log('Audit complete.');
}

deepAudit();
