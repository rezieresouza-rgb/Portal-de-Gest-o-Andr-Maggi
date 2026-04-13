const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Searching for student...');
  const { data: students, error: searchError } = await supabase
    .from('students')
    .select('id, name')
    .ilike('name', '%ERYKSON KAIAM PEREIRA DA SILVA%');

  if (searchError) {
    console.error('Search error:', searchError);
    return;
  }

  console.log('Found students:', students);

  if (students && students.length > 0) {
    for (const student of students) {
        // Double check the old name explicitly if it's the target
        const newName = student.name.replace('ERYKSON KAIAM PEREIRA DA SILVA', 'ERYKSOM KAUAM PEREIRA DA SILVA');
        console.log(`Updating student ${student.id} from "${student.name}" to "${newName}"`);
        
        const { error: updateError } = await supabase
            .from('students')
            .update({ name: newName })
            .eq('id', student.id);
            
        if (updateError) {
            console.error('Update error:', updateError);
        } else {
            console.log('Update successful!');
        }
    }
  } else {
      console.log('Student not found.');
  }
}

run();
