
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("--- SEARCHING FOR SUPPLIERS FROM STATEMENTS ---");
  const suppliersFromBank = [
    "NOVO ACOUGUE", "MERCADO BOM JESUS", "RAROS SABOR", "J ASSIS", "ALIMEX", "DINABRAS", "N. C. DOS SANTOS"
  ];

  for (const name of suppliersFromBank) {
      const { data, error } = await supabase.from('suppliers').select('*').ilike('name', `%${name}%`);
      if (data && data.length > 0) {
          console.log(`Found Supplier: ${name} -> ${data[0].name} (ID: ${data[0].id})`);
      } else {
          console.log(`Supplier NOT FOUND: ${name}`);
      }
  }

  console.log("\n--- SEARCHING FOR RECENT ORDERS ---");
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*, contracts(suppliers(name))')
    .order('issue_date', { ascending: false })
    .limit(20);

  if (orders) {
      orders.forEach(o => {
          console.log(`[Order ${o.order_number}] ${o.issue_date} | Val: ${o.total_value} | Supplier: ${o.contracts?.suppliers?.name} | Status: ${o.status}`);
      });
  }
}

run();
