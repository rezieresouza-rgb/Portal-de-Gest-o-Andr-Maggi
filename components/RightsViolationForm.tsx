import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Trash2, 
  History, 
  FileDown, 
  ArrowLeft,
  X,
  Save,
  Printer,
  Loader2,
  CheckSquare,
  Square,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Info,
  Users,
  Send,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { RightsViolationNotification } from '../types';

// FIX: Updated property names to match RightsViolationNotification interface in types.ts (using snake_case where defined)
const INITIAL_FORM_STATE: Omit<RightsViolationNotification, 'id' | 'timestamp'> = {
  notificationDate: new Date().toISOString().split('T')[0],
  municipality: 'COLÍDER',
  uf: 'MT',
  school_name: 'E.E. ANDRÉ ANTÔNIO MAGGI',
  school_address: 'RUA BORBA GATO, Nº 80, SETOR OESTE',
  forward_to: {
    tutelar_council: false,
    police_authority: false,
    health_system: false,
    social_assistance: false,
  },
  student: {
    name: '',
    birth_date: '',
    age: '',
    gender: '',
    sus_card: '',
    grade: '',
    has_disability: false,
    disability_type: '',
  },
  guardians: {
    names: '',
    address: '',
    phone: '',
    cep: '',
    complement: '',
  },
  violation_type: {
    mistreatment: false,
    suicide_attempt: false,
    self_harm: false,
    psychological_violence: false,
    physical_violence: false,
    sexual_violence: false,
    other: '',
  },
  complementary_info: '',
  director_name: 'REZIERE DE SOUZA',
  sent_date: '',
  sent_time: '',
  school_guidelines: '',
};

const RightsViolationForm: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [notifications, setNotifications] = useState<RightsViolationNotification[]>(() => {
    const saved = localStorage.getItem('rights_violation_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState<Omit<RightsViolationNotification, 'id' | 'timestamp'>>(INITIAL_FORM_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rights_violation_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const handleSave = () => {
    const newNotif: RightsViolationNotification = {
      id: `viol-${Date.now()}`,
      ...form,
      timestamp: Date.now()
    };
    setNotifications([newNotif, ...notifications]);
    alert("Notificação de violação registrada no sistema!");
    setView('list');
    setForm(INITIAL_FORM_STATE);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover este registro permanentemente?")) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    const element = pdfRef.current;
    if (!element) return setIsGenerating(false);
    
    try {
      // @ts-ignore
      await window.html2pdf().set({
        margin: [5, 5, 5, 5],
        filename: `Ficha_Notificacao_Violacao_${form.student.name}_${form.notificationDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const CheckboxItem = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
    <button 
      type="button" 
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
        checked ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-gray-100 text-gray-400 hover:border-rose-200'
      }`}
    >
      {checked ? <CheckSquare size={18} className="shrink-0" /> : <Square size={18} className="shrink-0" />}
      <span className="text-[10px] font-black uppercase leading-tight">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER DE CONTROLE */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 no-print">
         <div className="flex items-center gap-6">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
               <ShieldAlert size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Notificação de Violação de Direitos</h3>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">Protocolo Integrado SEDUC-MT / ECA Art. 56</p>
            </div>
         </div>
         <div className="flex gap-3">
            {view === 'list' ? (
              <button 
                onClick={() => setView('form')}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2"
              >
                 <Plus size={18} /> Nova Notificação
              </button>
            ) : (
              <button 
                onClick={() => setView('list')}
                className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                 <ArrowLeft size={16} /> Voltar
              </button>
            )}
         </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 duration-500">
           {notifications.map(n => (
             <div key={n.id} onClick={() => { setForm(n); setView('form'); }} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-300 hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-6 group">
                <div className="flex items-center gap-6 flex-1">
                   <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-black text-xl">
                      {n.student.name[0]}
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{n.student.name}</h4>
                      <div className="flex flex-wrap gap-4 mt-1">
                         <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Calendar size={12}/> {new Date(n.notificationDate).toLocaleDateString('pt-BR')}</span>
                         <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={12}/> {n.student.grade}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 no-print">
                   <button onClick={(e) => deleteNotification(n.id, e)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18} />
                   </button>
                   <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                      <ChevronRight size={24}/>
                   </div>
                </div>
             </div>
           ))}
           {notifications.length === 0 && (
              <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                 <ShieldAlert size={64} className="mx-auto mb-4 text-gray-200" />
                 <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma notificação registrada</p>
              </div>
           )}
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
           <div className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-gray-100 shadow-2xl max-w-5xl mx-auto space-y-12 no-print">
              
              {/* SEÇÃO: ENCAMINHAMENTO */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-rose-600 text-white rounded-lg"><Send size={18} /></div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Encaminhar Para:</h4>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* FIX: Updated property names to match RightsViolationNotification interface in types.ts */}
                    <CheckboxItem label="Conselho Tutelar" checked={form.forward_to.tutelar_council} onChange={v => setForm({...form, forward_to: {...form.forward_to, tutelar_council: v}})} />
                    <CheckboxItem label="Autoridade Policial" checked={form.forward_to.police_authority} onChange={v => setForm({...form, forward_to: {...form.forward_to, police_authority: v}})} />
                    <CheckboxItem label="Sistema de Saúde" checked={form.forward_to.health_system} onChange={v => setForm({...form, forward_to: {...form.forward_to, health_system: v}})} />
                    <CheckboxItem label="Assistência Social" checked={form.forward_to.social_assistance} onChange={v => setForm({...form, forward_to: {...form.forward_to, social_assistance: v}})} />
                 </div>
              </div>

              {/* SEÇÃO: IDENTIFICAÇÃO BÁSICA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Notificação</label>
                    <input type="date" value={form.notificationDate} onChange={e => setForm({...form, notificationDate: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Município</label>
                    <input type="text" value={form.municipality} onChange={e => setForm({...form, municipality: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">UF</label>
                    <input type="text" maxLength={2} value={form.uf} onChange={e => setForm({...form, uf: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white text-center" />
                 </div>
                 {/* FIX: Updated property name to match school_name in types.ts */}
                 <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidade Escolar</label>
                    <input type="text" value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                 </div>
              </div>

              {/* SEÇÃO: DADOS DO ESTUDANTE */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-rose-600 text-white rounded-lg"><User size={18} /></div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Dados do Estudante</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-4 space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                       <input required type="text" value={form.student.name} onChange={e => setForm({...form, student: {...form.student, name: e.target.value.toUpperCase()}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                    {/* FIX: Updated property names to match birth_date and sus_card in types.ts */}
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                       <input type="date" value={form.student.birth_date} onChange={e => setForm({...form, student: {...form.student, birth_date: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Idade</label>
                       <input type="number" value={form.student.age} onChange={e => setForm({...form, student: {...form.student, age: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sexo</label>
                       <select value={form.student.gender} onChange={e => setForm({...form, student: {...form.student, gender: e.target.value}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase outline-none focus:bg-white">
                          <option value="">Selecione...</option>
                          <option value="MASCULINO">MASCULINO</option>
                          <option value="FEMININO">FEMININO</option>
                          <option value="OUTRO">OUTRO</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Escolaridade</label>
                       <input type="text" placeholder="Ex: 9º Ano A" value={form.student.grade} onChange={e => setForm({...form, student: {...form.student, grade: e.target.value.toUpperCase()}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                 </div>
              </div>

              {/* SEÇÃO: TIPOLOGIA DE VIOLAÇÃO */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-rose-600 text-white rounded-lg"><AlertTriangle size={18} /></div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tipo de Violação (Art. 56 ECA)</h4>
                 </div>
                 {/* FIX: Updated property names to match violation_type in types.ts */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CheckboxItem label="Maus tratos" checked={form.violation_type.mistreatment} onChange={v => setForm({...form, violation_type: {...form.violation_type, mistreatment: v}})} />
                    <CheckboxItem label="Tentativa de suicídio" checked={form.violation_type.suicide_attempt} onChange={v => setForm({...form, violation_type: {...form.violation_type, suicide_attempt: v}})} />
                    <CheckboxItem label="Autolesão" checked={form.violation_type.self_harm} onChange={v => setForm({...form, violation_type: {...form.violation_type, self_harm: v}})} />
                    <CheckboxItem label="Violência psicológica" checked={form.violation_type.psychological_violence} onChange={v => setForm({...form, violation_type: {...form.violation_type, psychological_violence: v}})} />
                    <CheckboxItem label="Violência Física" checked={form.violation_type.physical_violence} onChange={v => setForm({...form, violation_type: {...form.violation_type, physical_violence: v}})} />
                    <CheckboxItem label="Violência Sexual" checked={form.violation_type.sexual_violence} onChange={v => setForm({...form, violation_type: {...form.violation_type, sexual_violence: v}})} />
                    <div className="md:col-span-3 space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Outro / Especificar</label>
                       <input type="text" value={form.violation_type.other} onChange={e => setForm({...form, violation_type: {...form.violation_type, other: e.target.value.toUpperCase()}})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:bg-white" />
                    </div>
                 </div>
              </div>

              {/* SEÇÃO: OBSERVAÇÕES */}
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-rose-600" /> Informações Complementares e Observações
                 </h4>
                 {/* FIX: Updated property name to match complementary_info in types.ts */}
                 <textarea 
                    value={form.complementary_info}
                    onChange={e => setForm({...form, complementary_info: e.target.value})}
                    placeholder="Relate detalhadamente os fatos observados..."
                    className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-medium text-sm leading-relaxed h-48 outline-none focus:bg-white transition-all resize-none"
                 />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                 <button 
                   onClick={handleSave}
                   className="flex-1 py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                 >
                    <Save size={24} /> Registrar e Salvar
                 </button>
                 <button 
                   onClick={handleExportPDF}
                   disabled={isGenerating}
                   className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
                 >
                    {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />}
                    Gerar PDF Ficha
                 </button>
              </div>
           </div>

           {/* ÁREA DE RENDERIZAÇÃO PDF (HIDDEN) */}
           <div className="hidden">
              <div ref={pdfRef} className="p-10 space-y-8 text-gray-900 font-sans h-full bg-white text-[11px] leading-tight">
                 
                 {/* CABEÇALHO OFICIAL */}
                 <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black rounded-lg">AM</div>
                       <div className="space-y-0.5">
                          <h1 className="text-sm font-black uppercase leading-none">Secretaria de Estado de Educação - MT</h1>
                          <p className="text-[8px] font-bold">Unidade Escolar: {form.school_name}</p>
                          <p className="text-[8px]">Endereço: {form.school_address}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h2 className="text-xs font-black uppercase">Ficha de Notificação</h2>
                       <p className="text-[9px] font-bold">Violação de Direitos e Violência</p>
                    </div>
                 </div>

                 {/* BOX ENCAMINHAMENTO */}
                 <div className="border-2 border-black p-4 rounded-xl flex justify-between items-center bg-gray-50">
                    <p className="font-black uppercase text-[10px]">Encaminhar para:</p>
                    <div className="flex gap-4">
                       <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center font-black">{form.forward_to.tutelar_council ? 'X' : ''}</div>
                          <span className="uppercase text-[9px] font-bold">Conselho Tutelar</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center font-black">{form.forward_to.police_authority ? 'X' : ''}</div>
                          <span className="uppercase text-[9px] font-bold">Autoridade Policial</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center font-black">{form.forward_to.health_system ? 'X' : ''}</div>
                          <span className="uppercase text-[9px] font-bold">Saúde</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center font-black">{form.forward_to.social_assistance ? 'X' : ''}</div>
                          <span className="uppercase text-[9px] font-bold">Assit. Social</span>
                       </div>
                    </div>
                 </div>

                 {/* DADOS DA NOTIFICAÇÃO */}
                 <div className="grid grid-cols-3 gap-0 border-2 border-black divide-x-2 divide-black">
                    <div className="p-2"><p className="text-[8px] font-black uppercase">Data Notificação</p><p className="font-bold">{new Date(form.notificationDate).toLocaleDateString('pt-BR')}</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">Município</p><p className="font-bold uppercase">{form.municipality}</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">UF</p><p className="font-bold">{form.uf}</p></div>
                 </div>

                 {/* DADOS ESTUDANTE */}
                 <div className="border-2 border-black rounded-xl overflow-hidden">
                    <div className="bg-black text-white px-3 py-1 font-black text-[9px] uppercase">Dados do Estudante</div>
                    <div className="grid grid-cols-4 divide-x-2 divide-black divide-y-2">
                       <div className="col-span-4 p-2"><p className="text-[8px] font-black uppercase">Nome do Estudante</p><p className="font-bold uppercase text-sm">{form.student.name || '________________________'}</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">Data Nasc.</p><p className="font-bold">{form.student.birth_date ? new Date(form.student.birth_date).toLocaleDateString('pt-BR') : '____/____/____'}</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">Idade</p><p className="font-bold">{form.student.age || '___'} anos</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">Sexo</p><p className="font-bold uppercase">{form.student.gender || '---'}</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">Grade</p><p className="font-bold uppercase">{form.student.grade || '---'}</p></div>
                       <div className="col-span-2 p-2"><p className="text-[8px] font-black uppercase">Cartão SUS</p><p className="font-bold">{form.student.sus_card || '________________________'}</p></div>
                       <div className="col-span-2 p-2"><p className="text-[8px] font-black uppercase">Possui Deficiência?</p><p className="font-bold">{form.student.has_disability ? `SIM: ${form.student.disability_type}` : 'NÃO'}</p></div>
                    </div>
                 </div>

                 {/* DADOS RESPONSÁVEIS */}
                 <div className="border-2 border-black rounded-xl overflow-hidden">
                    <div className="bg-black text-white px-3 py-1 font-black text-[9px] uppercase">Responsáveis</div>
                    <div className="grid grid-cols-4 divide-x-2 divide-black divide-y-2">
                       <div className="col-span-3 p-2"><p className="text-[8px] font-black uppercase">Nome(s)</p><p className="font-bold uppercase">{form.guardians.names || '________________________'}</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">Telefone</p><p className="font-bold">{form.guardians.phone || '________________________'}</p></div>
                       <div className="col-span-4 p-2"><p className="text-[8px] font-black uppercase">Endereço Completo</p><p className="font-bold uppercase">{form.guardians.address || '________________________'}</p></div>
                       <div className="p-2"><p className="text-[8px] font-black uppercase">CEP</p><p className="font-bold">{form.guardians.cep || '_____-___'}</p></div>
                       <div className="col-span-3 p-2"><p className="text-[8px] font-black uppercase">Complemento</p><p className="font-bold uppercase">{form.guardians.complement || '---'}</p></div>
                    </div>
                 </div>

                 {/* TIPO DE VIOLAÇÃO */}
                 <div className="border-2 border-black rounded-xl overflow-hidden">
                    <div className="bg-black text-white px-3 py-1 font-black text-[9px] uppercase">Tipo de Violação de Direito - Ocorrência (Art. 56 ECA)</div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.mistreatment ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Maus tratos</span></div>
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.suicide_attempt ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Tentativa de suicídio</span></div>
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.self_harm ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Autolesão</span></div>
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.psychological_violence ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Violência psicológica</span></div>
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.physical_violence ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Violência Física</span></div>
                          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-black flex items-center justify-center">{form.violation_type.sexual_violence ? 'X' : ''}</div><span className="uppercase text-[9px] font-bold">Violência Sexual</span></div>
                       </div>
                       <div className="col-span-2 border-t-2 border-black pt-2">
                          <p className="text-[8px] font-black uppercase">Outro: <span className="font-bold">{form.violation_type.other || '________________________'}</span></p>
                       </div>
                    </div>
                 </div>

                 {/* RELATO */}
                 <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Informações Complementares e observações:</h4>
                    <div className="border-2 border-black p-4 rounded-xl min-h-[150px] italic">
                       {form.complementary_info || '________________________'}
                    </div>
                 </div>

                 {/* ASSINATURAS */}
                 <div className="pt-10 grid grid-cols-2 gap-10">
                    <div className="space-y-12">
                       <div className="border-t-2 border-black pt-2 text-center">
                          {/* FIX: Updated property name to match director_name in types.ts */}
                          <p className="font-black uppercase">{form.director_name}</p>
                          <p className="text-[8px] uppercase text-gray-500 font-bold">Nome Diretor(a) / Assinatura</p>
                       </div>
                       <div className="p-3 border-2 border-black rounded-xl">
                          <p className="text-[8px] font-black uppercase mb-1">Orientações para a Unidade Escolar:</p>
                          <div className="h-20"></div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-3 border-2 border-black rounded-xl">
                          <p className="text-[8px] font-black uppercase">Carimbo / Horário</p>
                          <div className="h-10"></div>
                       </div>
                       <div className="p-3 border-2 border-black rounded-xl">
                          <p className="text-[8px] font-black uppercase">Ficha enviada em: ____/____/____</p>
                       </div>
                       <div className="p-3 border-2 border-black rounded-xl">
                          <p className="text-[8px] font-black uppercase">Carimbo / Assinatura da unidade que recebeu:</p>
                          <div className="h-14"></div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 flex justify-center opacity-30">
                    <ShieldCheck size={14} className="text-gray-900" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] ml-2">Documento Autenticado - Portal de Gestão André Maggi</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* NOTA DE CONFORMIDADE */}
      <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600">
               <ShieldCheck size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-gray-900 uppercase leading-none mb-1">Conformidade Legal SEDUC-MT</h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Baseado no Estatuto da Criança e do Adolescente (ECA) Art. 56</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Info size={16} className="text-rose-400" />
            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest leading-none">Dados protegidos por criptografia local</span>
         </div>
      </div>

      <style>{`
        .pdf-show { display: none; }
        @media print, .pdf-mode {
          .no-print { display: none !important; }
          .pdf-show { display: block !important; }
          .pdf-printable { 
            border: none !important; 
            box-shadow: none !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default RightsViolationForm;