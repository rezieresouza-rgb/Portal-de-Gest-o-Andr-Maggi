
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwrjskjhemaapnwtumlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmpza2poZW1hYXBud3R1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDU4MTAsImV4cCI6MjA4NjQyMTgxMH0.-xwDvTg9U35AMlnI9HCbGOJlj6lsq4UnOA2-4dzkVYI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetBalances() {
    console.log('Iniciando limpeza de baixas e reset de saldos (v2)...');

    try {
        // 1. Limpar itens de pedidos
        console.log('Limpando order_items...');
        const { error: err1 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err1) console.error('Erro ao limpar order_items:', err1);

        // 2. Limpar pedidos
        console.log('Limpando orders...');
        const { error: err2 } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err2) console.error('Erro ao limpar orders:', err2);

        // 3. Limpar eventos de contrato (aditivos, entregas, etc)
        console.log('Limpando contract_events...');
        const { error: err3 } = await supabase.from('contract_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err3) console.error('Erro ao limpar contract_events:', err3);

        // 4. Resetar saldos adquiridos nos itens de contrato
        console.log('Resetando acquired_quantity em contract_items...');
        const { error: err4 } = await supabase
            .from('contract_items')
            .update({ acquired_quantity: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');
        if (err4) console.error('Erro ao resetar contract_items:', err4);

        console.log('Limpeza concluída com sucesso!');
    } catch (err) {
        console.error('Erro catastrófico:', err);
    }
}

resetBalances();
