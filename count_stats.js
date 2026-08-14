const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    // Count transfers
    const { count: transferCount, error: err1 } = await supabase
      .from('student_movements')
      .select('id', { count: 'exact', head: true })
      .eq('movement_type', 'TRANSFERENCIA');
    if (err1) throw err1;

    // Count enrollments with status ATIVO or RECLASSIFICADO (considered matriculated)
    const { count: enrolCount, error: err2 } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.ATIVO,status.eq.RECLASSIFICADO');
    if (err2) throw err2;

    console.log('TRANSFER_COUNT:', transferCount);
    console.log('ENROLLMENT_COUNT:', enrolCount);
  } catch (e) {
    console.error('Error fetching counts:', e);
    process.exit(1);
  }
})();
