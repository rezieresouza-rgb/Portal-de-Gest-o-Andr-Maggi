require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: plans, error: pError } = await supabase
    .from('lesson_plans')
    .select('id, content_json')
    .or('content_json->>teacher.ilike.%CRISTIANO%,subject.ilike.%CRISTIANO%');

  console.log("Plans with Cristiano:", plans?.length || 0);
  if (plans) plans.forEach(p => console.log(`Plan ID: ${p.id}, Teacher: ${p.content_json.teacher}`));

  const { data: staff, error: sError } = await supabase
    .from('staff')
    .select('id, name')
    .ilike('name', '%CRISTIANO%');

  console.log("Staff with Cristiano:", staff?.length || 0);
  if (staff) staff.forEach(s => console.log(`Staff ID: ${s.id}, Name: ${s.name}`));
}

main();
