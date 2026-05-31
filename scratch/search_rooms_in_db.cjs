const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').filter(l => l.includes('=')).forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

const keywords = ['podcast', 'gremio', 'grêmio', 'sala 12', 'sala 09', 'sala 9'];

const tables = [
  "bookings", "classrooms", "users", "students", "enrollments", "suppliers", "contracts",
  "contract_items", "orders", "order_items", "funds", "transactions",
  "lesson_plans", "assessments", "grades", "occurrences", "referrals",
  "mediation_cases", "active_search_actions", "class_attendance_records",
  "class_attendance_students", "teacher_subjects", "teacher_classes",
  "subjects", "staff", "bncc_skills", "assets", "preventive_maintenance_items",
  "cleaning_tasks", "cleaning_employees", "maintenance_tasks", "school_environments"
];

async function run() {
  console.log('Searching database for room-related keywords:', keywords);

  for (const table of tables) {
    try {
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sampleError) {
        if (sampleError.code !== '42P01' && sampleError.code !== '42501') {
          console.log(`Table ${table} error: ${sampleError.message}`);
        }
        continue;
      }

      const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
      if (columns.length === 0) continue;

      for (const col of columns) {
        // Skip binary or boolean or numeric columns where ilike might fail
        const val = sample[0][col];
        if (typeof val === 'number' || typeof val === 'boolean' || val === null) {
          // We can still try to query but let's be careful. Let's just do ilike and catch errors
        }

        for (const kw of keywords) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .ilike(col, `%${kw}%`)
              .limit(5);

            if (error) continue;

            if (data && data.length > 0) {
              console.log(`\n[MATCH FOUND] Table: "${table}", Column: "${col}", Keyword: "${kw}"`);
              console.log(JSON.stringify(data, null, 2));
            }
          } catch (e) {
            // Ignore search errors for this column
          }
        }
      }
    } catch (err) {
      console.log(`Unexpected error with table ${table}:`, err.message);
    }
  }
  console.log('\nSearch completed.');
}

run();
