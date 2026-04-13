const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateName() {
  console.log('Searching for student JOHNNY SOUZA ALMEIDA...');
  const { data: students, error: searchError } = await supabase
    .from('students')
    .select('id, name')
    .ilike('name', '%JOHNNY%SOUZA%ALMEIDA%');

  if (searchError) {
    console.error('Search error:', searchError);
    return;
  }

  console.log('Found students:', students);

  if (students && students.length > 0) {
    for (const student of students) {
        const newName = 'JOHONNY SOUZA ALMEIDA';
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
      console.log('Student not found exactly like that, trying without exact name...');
      
      const { data: students2, error: searchError2 } = await supabase
        .from('students')
        .select('id, name')
        .ilike('name', '%JOHONNY SOUZA ALMEIDA%');
        
      console.log('Found already corrected students:', students2);
  }
}

updateName();
