const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== BEBIDA LÁCTEA ORDERS & GUIDES FOR CONTRATO 010/2026/SEDUC/MT ===");

  // 1. Payment Guides
  const { data: pGuides } = await supabase
    .from('payment_guides')
    .select('*, items:payment_guide_items(*, item:contract_items(*)), contract:contracts(*)')
    .order('issue_date', { ascending: true });

  const guideResults = [];
  pGuides?.forEach(g => {
    if (g.contract?.number?.includes('010/2026')) {
      g.items?.forEach(gi => {
        const desc = gi.item?.description || gi.description || '';
        if (desc.toUpperCase().includes('BEBIDA')) {
          guideResults.push({
            type: 'Guia de Pagamento',
            guideNumber: g.guide_number,
            date: g.issue_date,
            item: desc,
            quantity: gi.quantity,
            unit: gi.item?.unit || 'KG',
            unitPrice: gi.unit_price || gi.item?.unit_price || 10.11,
            total: (gi.quantity * (gi.unit_price || gi.item?.unit_price || 10.11)).toFixed(2),
            status: g.status
          });
        }
      });
    }
  });

  console.log("\n--- GUIAS DE PAGAMENTO / ENTREGAS (BEBIDA LÁCTEA) ---");
  console.table(guideResults);

  // 2. Orders table
  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(*), contract:contracts(*)')
    .order('created_at', { ascending: true });

  const orderResults = [];
  orders?.forEach(o => {
    if (o.contract?.number?.includes('010/2026')) {
      o.items?.forEach(oi => {
        if (oi.description?.toUpperCase().includes('BEBIDA')) {
          orderResults.push({
            type: 'Pedido / AF',
            orderNumber: o.order_number,
            date: o.date || o.created_at?.split('T')[0],
            item: oi.description,
            quantity: oi.quantity,
            unit: oi.unit || 'KG',
            unitPrice: oi.unit_price || 10.11,
            total: (oi.quantity * (oi.unit_price || 10.11)).toFixed(2),
            status: o.status
          });
        }
      });
    }
  });

  console.log("\n--- PEDIDOS / ORDENS DE COMPRA (BEBIDA LÁCTEA) ---");
  console.table(orderResults);

  // 3. Contract totals for Bebida Láctea
  const { data: contract010 } = await supabase
    .from('contracts')
    .select('*, items:contract_items(*)')
    .ilike('number', '%010/2026%');

  const itemBebida = contract010?.[0]?.items?.find(i => i.description.toUpperCase().includes('BEBIDA'));
  console.log("\n--- SALDO CONTRATUAL DA BEBIDA LÁCTEA ---");
  console.log({
    produto: itemBebida?.description,
    quantidadeContratada: `${itemBebida?.contracted_quantity} ${itemBebida?.unit}`,
    quantidadeExecutada: `${itemBebida?.acquired_quantity} ${itemBebida?.unit}`,
    saldoRestante: `${itemBebida?.contracted_quantity - itemBebida?.acquired_quantity} ${itemBebida?.unit}`,
    precoUnitario: `R$ ${itemBebida?.unit_price}`
  });
}

run();
