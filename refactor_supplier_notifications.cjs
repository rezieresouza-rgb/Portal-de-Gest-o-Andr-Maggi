const fs = require('fs');

let content = fs.readFileSync('components/SupplierNotifications.tsx', 'utf8');

// 1. Add import
if (!content.includes("import { supabase }")) {
  content = content.replace("import { INITIAL_CONTRACTS } from '../constants/initialData';", "import { INITIAL_CONTRACTS } from '../constants/initialData';\nimport { supabase } from '../supabaseClient';");
}

// 2. Change state and useEffect
const oldState = `  const [occurrences, setOccurrences] = useState<SupplierOccurrence[]>(() => {
    const saved = localStorage.getItem('merenda_supplier_occurrences_v1');
    return saved ? JSON.parse(saved) : [];
  });`;

const newState = `  const [occurrences, setOccurrences] = useState<any[]>([]);
  
  const fetchOccurrences = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_occurrences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setOccurrences(data.map(d => ({
          ...d,
          supplierId: d.supplier_id,
          supplierName: d.supplier_name,
          orderNumber: d.order_number,
          itemsAffected: d.items_affected || [],
          issueDate: d.issue_date,
          orderDate: d.order_date,
          deadlineDate: d.deadline_date,
          notificationSent: d.notification_sent,
          resolutionDate: d.resolution_date
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOccurrences();
    const channel = supabase.channel('supplier_occurrences_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_occurrences' }, fetchOccurrences)
      .subscribe();
      
    return () => { channel.unsubscribe(); };
  }, []);`;

content = content.replace(oldState, newState);

// Remove the localStorage useEffect
const oldEffect = `  useEffect(() => {
    localStorage.setItem('merenda_supplier_occurrences_v1', JSON.stringify(occurrences));
  }, [occurrences]);`;

content = content.replace(oldEffect, "");

// Update handleSave
const oldSave = `  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.description) return alert("Preencha os campos obrigatórios.");

    const supplier = suppliersFromContracts.find(s => s.id === form.supplierId);

    const newOcc: SupplierOccurrence = {
      id: \`occ-\${Date.now()}\`,
      ...form,
      supplierName: supplier?.name || "Desconhecido",
      notificationSent: false
    };

    setOccurrences([newOcc, ...occurrences]);
    setIsModalOpen(false);
    resetForm();
  };`;

const newSave = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.description) return alert("Preencha os campos obrigatórios.");

    const supplier = suppliersFromContracts.find(s => s.id === form.supplierId);

    try {
      const { error } = await supabase.from('supplier_occurrences').insert([{
        supplier_id: form.supplierId,
        supplier_name: supplier?.name || "Desconhecido",
        order_number: form.orderNumber,
        type: form.type,
        status: form.status,
        description: form.description,
        items_affected: form.itemsAffected || [],
        issue_date: form.issueDate,
        order_date: form.orderDate,
        deadline_date: form.deadlineDate,
        photo: form.photo,
        responsible: form.responsible,
        notification_sent: false
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar no Supabase");
    }
  };`;

content = content.replace(oldSave, newSave);

// Update updateStatus
const oldUpdate = `  const updateStatus = (id: string, status: OccurrenceStatus) => {
    setOccurrences(prev => prev.map(o => o.id === id ? {
      ...o,
      status,
      resolutionDate: status === 'RESOLVIDO' ? new Date().toLocaleDateString('sv-SE') : o.resolutionDate
    } : o));
  };`;

const newUpdate = `  const updateStatus = async (id: string, status: OccurrenceStatus) => {
    const resDate = status === 'RESOLVIDO' ? new Date().toLocaleDateString('sv-SE') : null;
    try {
      const updateData: any = { status };
      if (resDate) updateData.resolution_date = resDate;
      const { error } = await supabase.from('supplier_occurrences').update(updateData).eq('id', id);
      if (error) throw error;
      setOccurrences(prev => prev.map(o => o.id === id ? {
        ...o,
        status,
        resolutionDate: resDate || o.resolutionDate
      } : o));
    } catch (e) {
      console.error(e);
    }
  };`;
content = content.replace(oldUpdate, newUpdate);

// Update deleteOccurrence
const oldDelete = `  const deleteOccurrence = (id: string) => {
    if (window.confirm("Deseja excluir este registro de ocorrência?")) {
      setOccurrences(prev => prev.filter(o => o.id !== id));
    }
  };`;

const newDelete = `  const deleteOccurrence = async (id: string) => {
    if (window.confirm("Deseja excluir este registro de ocorrência?")) {
      try {
        const { error } = await supabase.from('supplier_occurrences').delete().eq('id', id);
        if (error) throw error;
        setOccurrences(prev => prev.filter(o => o.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };`;
content = content.replace(oldDelete, newDelete);

// generateOccurrencePDF update
const oldGen = `        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();

        setOccurrences(prev => prev.map(o => o.id === occ.id ? { ...o, notificationSent: true } : o));`;

const newGen = `        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();

        await supabase.from('supplier_occurrences').update({ notification_sent: true }).eq('id', occ.id);
        setOccurrences(prev => prev.map(o => o.id === occ.id ? { ...o, notificationSent: true } : o));`;
content = content.replace(oldGen, newGen);

fs.writeFileSync('components/SupplierNotifications.tsx', content);
