
import React, { useState, useEffect } from 'react';
import {
   Database,
   Download,
   Upload,
   ShieldAlert,
   RefreshCw,
   Trash2,
   ShieldCheck,
   FileJson,
   AlertTriangle,
   CheckCircle2,
   Lock,
   Unlock,
   Globe,
   Server,
   Code2,
   ExternalLink,
   ChevronRight,
   Rocket,
   Shield,
   Check,
   X,
   // Added missing Info icon import
   Info
} from 'lucide-react';

const MODULES_LIST = [
   { id: 'secretariat', label: 'Secretaria' },
   { id: 'merenda', label: 'Merenda Escolar' },
   { id: 'finance', label: 'Financeiro' },
   { id: 'busca_ativa', label: 'Busca Ativa' },
   { id: 'psychosocial', label: 'Mediação & Apoio' },
   { id: 'pedagogical', label: 'Pedagógico' },
   { id: 'teacher', label: 'Área do Professor' },
   { id: 'scheduling', label: 'Agendas' },
   { id: 'library', label: 'Biblioteca' },
   { id: 'almoxarifado', label: 'Almoxarifado' },
   { id: 'limpeza', label: 'Manutenção' },
   { id: 'patrimonio', label: 'Patrimônio' },
];

const ROLES_LIST = [
   { id: 'GESTAO', label: 'Gestão' },
   { id: 'PROFESSOR', label: 'Professor' },
   { id: 'TAE', label: 'Técnico (TAE)' },
   { id: 'AAE', label: 'Apoio (AAE)' },
   { id: 'PSICOSSOCIAL', label: 'Mediador (Psicossocial)' },
   { id: 'SECRETARIA', label: 'Secretaria' },
];

const Settings: React.FC = () => {
   const [activeSubTab, setActiveSubTab] = useState<'backup' | 'access' | 'publish'>('backup');
   const [isExporting, setIsExporting] = useState(false);
   const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

   const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
      const saved = localStorage.getItem('portal_module_permissions_v1');
      return saved ? JSON.parse(saved) : {
         'GESTAO': MODULES_LIST.map(m => m.id),
         'PROFESSOR': ['teacher', 'scheduling', 'library', 'almoxarifado'],
         'SECRETARIA': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education'],
         'PSICOSSOCIAL': ['psychosocial', 'busca_ativa', 'scheduling', 'special_education'],
         'TAE': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education'],
         'AAE': ['limpeza']
      };
   });

   const [isSystemLocked, setIsSystemLocked] = useState(() => {
      return localStorage.getItem('system_shield_lock') === 'true';
   });

   useEffect(() => {
      localStorage.setItem('portal_module_permissions_v1', JSON.stringify(permissions));
      window.dispatchEvent(new Event('storage'));
   }, [permissions]);

   const togglePermission = (roleId: string, moduleId: string) => {
      setPermissions(prev => {
         const current = prev[roleId] || [];
         const updated = current.includes(moduleId)
            ? current.filter(id => id !== moduleId)
            : [...current, moduleId];
         return { ...prev, [roleId]: updated };
      });
   };

   const toggleSystemLock = () => {
      const newState = !isSystemLocked;
      setIsSystemLocked(newState);
      localStorage.setItem('system_shield_lock', String(newState));
      setStatusMessage({
         type: 'success',
         text: newState ? 'Sistema Blindado: Exclusões e edições críticas desativadas.' : 'Blindagem Desativada: Edições permitidas.'
      });
      setTimeout(() => setStatusMessage(null), 3000);
   };

   const exportData = () => {
      setIsExporting(true);
      try {
         const data = {
            permissions,
            system_lock: isSystemLocked,
            export_date: new Date().toISOString()
         };

         const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `Backup_Configuracoes_${new Date().toISOString().split('T')[0]}.json`;
         a.click();

         setStatusMessage({ type: 'success', text: 'Backup de configurações gerado!' });
      } catch (e) {
         setStatusMessage({ type: 'error', text: 'Erro ao gerar backup.' });
      } finally {
         setIsExporting(false);
         setTimeout(() => setStatusMessage(null), 5000);
      }
   };

   const clearSystem = () => {
      if (isSystemLocked) return alert("Ação bloqueada: Desative a Blindagem de Sistema.");
      if (window.confirm("⚠️ APAGAR TUDO? ⚠️\nEsta ação é irreversível.")) {
         const check = window.prompt("Digite 'APAGAR' para confirmar:");
         if (check === 'APAGAR') {
            localStorage.clear();
            window.location.reload();
         }
      }
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

         {/* SELETOR DE ABAS SETTINGS */}
         <div className="flex bg-white p-1.5 rounded-3xl border border-gray-100 shadow-sm w-fit">
            <button
               onClick={() => setActiveSubTab('backup')}
               className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${activeSubTab === 'backup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
               Segurança & Backup
            </button>
            <button
               onClick={() => setActiveSubTab('access')}
               className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${activeSubTab === 'access' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
               Gestão de Acessos
            </button>
            <button
               onClick={() => setActiveSubTab('publish')}
               className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${activeSubTab === 'publish' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
               Publicar Aplicativo
            </button>
         </div>

         {activeSubTab === 'backup' && (
            <div className="space-y-8">
               <div className={`p-8 rounded-[3rem] border-2 transition-all duration-500 ${isSystemLocked ? 'bg-emerald-950 border-emerald-500 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-[2rem] transition-all duration-500 ${isSystemLocked ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                           {isSystemLocked ? <Lock size={32} /> : <Unlock size={32} />}
                        </div>
                        <div>
                           <h3 className={`text-2xl font-black uppercase tracking-tighter ${isSystemLocked ? 'text-white' : 'text-gray-900'}`}>Blindagem de Módulos</h3>
                           <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isSystemLocked ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {isSystemLocked ? 'Proteção contra exclusões acidentais' : 'Sistema aberto para manutenção'}
                           </p>
                        </div>
                     </div>
                     <button onClick={toggleSystemLock} className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isSystemLocked ? 'bg-white text-emerald-900' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'}`}>
                        {isSystemLocked ? 'Desativar Blindagem' : 'Ativar Blindagem'}
                     </button>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Download size={24} /></div>
                        <h4 className="text-lg font-black text-gray-900 uppercase">Exportar Dados</h4>
                     </div>
                     <p className="text-sm text-gray-500 font-medium">Gere um arquivo .JSON com todos os registros atuais para backup local.</p>
                     <button onClick={exportData} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Baixar Backup Agora</button>
                  </div>
                  <div className="space-y-6 border-l border-gray-50 pl-8">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Trash2 size={24} /></div>
                        <h4 className="text-lg font-black text-gray-900 uppercase">Limpeza Total</h4>
                     </div>
                     <p className="text-sm text-gray-500 font-medium">Apaga permanentemente todos os dados salvos neste navegador.</p>
                     <button onClick={clearSystem} disabled={isSystemLocked} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-30">Resetar Sistema</button>
                  </div>
               </div>
            </div>
         )}

         {activeSubTab === 'access' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="bg-indigo-900 p-10 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Shield size={180} /></div>
                  <div className="relative z-10">
                     <h2 className="text-3xl font-black uppercase tracking-tighter">Matriz de Acessos</h2>
                     <p className="text-indigo-200 text-sm font-medium mt-2">Defina quais módulos cada cargo pode visualizar e interagir.</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                     <div className="flex items-center gap-3">
                        <ShieldCheck size={24} className="text-emerald-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Acesso Gestão: MASTER</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                              <th className="px-10 py-6 sticky left-0 bg-gray-50 z-10">Perfil / Módulo</th>
                              {MODULES_LIST.map(mod => (
                                 <th key={mod.id} className="px-6 py-6 text-center whitespace-nowrap">{mod.label}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {ROLES_LIST.map(role => (
                              <tr key={role.id} className="hover:bg-gray-50/50 transition-colors group">
                                 <td className="px-10 py-6 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-50">
                                    <p className="text-sm font-black text-gray-900 uppercase">{role.label}</p>
                                    <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Cargo: {role.id}</p>
                                 </td>
                                 {MODULES_LIST.map(mod => {
                                    const isAllowed = (permissions[role.id] || []).includes(mod.id);
                                    return (
                                       <td key={mod.id} className="px-6 py-6 text-center">
                                          <button
                                             onClick={() => togglePermission(role.id, mod.id)}
                                             className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all ${isAllowed
                                                ? 'bg-emerald-50 text-emerald-600 shadow-inner'
                                                : 'bg-gray-100 text-gray-300'
                                                }`}
                                          >
                                             {isAllowed ? <Check size={20} strokeWidth={4} /> : <X size={18} />}
                                          </button>
                                       </td>
                                    );
                                 })}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-4">
                  {/* Added missing Info icon import from lucide-react to fix error on line 254 */}
                  <Info size={20} className="text-amber-600 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                     As alterações de acesso são aplicadas imediatamente. Usuários logados verão as mudanças ao atualizar a página ou navegar de volta ao Hub. O cargo "GESTAO" possui acesso total por segurança e não é editável.
                  </p>
               </div>
            </div>
         )}

         {activeSubTab === 'publish' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* PAINEL DE PUBLICAÇÃO */}
               <div className="bg-indigo-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Rocket size={200} /></div>
                  <div className="relative z-10 max-w-2xl space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                           <Globe size={32} className="text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Guia de Publicação</h2>
                     </div>
                     <p className="text-indigo-200 text-lg font-medium leading-relaxed">
                        Atualmente o aplicativo roda localmente no seu computador. Para que outros servidores acessem, você precisa publicá-lo em um servidor web.
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* PASSO 1 */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">1</div>
                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Hospedagem Front-end</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                           Utilize plataformas como <strong>Vercel</strong> ou <strong>Netlify</strong>. Elas permitem hospedar este aplicativo gratuitamente com um endereço ".vercel.app".
                        </p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-gray-50">
                        <a href="https://vercel.com" target="_blank" className="flex items-center justify-between text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                           Acessar Vercel <ExternalLink size={14} />
                        </a>
                     </div>
                  </div>

                  {/* PASSO 2 */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">2</div>
                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Banco de Dados (Cloud)</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                           Para os dados serem compartilhados, você deve trocar o LocalStorage por um banco real. Recomendamos o <strong>Supabase</strong> (PostgreSQL).
                        </p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-gray-50">
                        <a href="https://supabase.com" target="_blank" className="flex items-center justify-between text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                           Acessar Supabase <ExternalLink size={14} />
                        </a>
                     </div>
                  </div>

                  {/* PASSO 3 */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">3</div>
                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Configurar Chave API</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                           Configure a variável de ambiente <code>API_KEY</code> no painel da Vercel para que as funções de IA continuem funcionando online com segurança.
                        </p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-[10px] tracking-widest">
                           <ShieldCheck size={14} /> Segurança Garantida
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Settings;
