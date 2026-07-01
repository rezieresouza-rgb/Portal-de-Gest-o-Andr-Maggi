
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
   { id: 'pedagogical', label: 'Coordenação Pedagógica' },
   { id: 'teacher', label: 'Área do Professor' },
   { id: 'scheduling', label: 'Agendas' },
   { id: 'library', label: 'Biblioteca' },
   { id: 'almoxarifado', label: 'Almoxarifado' },
   { id: 'limpeza', label: 'Manutenção' },
   { id: 'patrimonio', label: 'Patrimônio' },
   { id: 'special_education', label: 'Sala de Recursos e APA' },
];

const FUNCTIONS_LIST = [
   { id: "DIRETOR", label: "Diretor" },
   { id: "OFICIAL DE GESTÃO CIVICO-MILITAR", label: "Oficial de Gestão Civico-Militar" },
   { id: "OFICIAL DE GESTÃO EDUCACIONAL", label: "Oficial de Gestão Educacional" },
   { id: "COORDENADOR PEDAGÓGICO", label: "Coordenador Pedagógico" },
   { id: "SECRETÁRIO", label: "Secretário" },
   { id: "REGÊNCIA", label: "Regência" },
   { id: "MONITOR", label: "Monitor" },
   { id: "BUSCA ATIVA", label: "Busca Ativa" },
   { id: "MEDIADOR", label: "Mediador" },
   { id: "PSICOSSOCIAL", label: "Psicossocial" },
   { id: "BIBLIOTECA", label: "Biblioteca" },
   { id: "LIMPEZA", label: "Limpeza" },
   { id: "NUTRIÇÃO", label: "Nutrição" },
   { id: "AUXILIAR DE PÁTIO", label: "Auxiliar de Pátio" },
   { id: "AUXILIAR DE COORDENAÇÃO PEDAGÓGICA", label: "Aux. de Coord. Pedagógica" },
   { id: "ASSISTENTE DE EDUCAÇÃO ESPECIAL", label: "Assis. Educação Especial" },
   { id: "APA", label: "APA" },
   { id: "SALA DE RECURSOS", label: "Sala de Recursos" },
];

const Settings: React.FC = () => {

   const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
      const defaultPerms = {
         'DIRETOR': MODULES_LIST.map(m => m.id),
         'OFICIAL DE GESTÃO CIVICO-MILITAR': ['civico_militar', 'scheduling', 'training'],
         'OFICIAL DE GESTÃO EDUCACIONAL': ['civico_militar', 'scheduling', 'training'],
         'COORDENADOR PEDAGÓGICO': MODULES_LIST.map(m => m.id),
         'SECRETÁRIO': ['secretariat', 'merenda', 'finance', 'busca_ativa', 'pedagogical', 'scheduling', 'library', 'patrimonio', 'limpeza', 'special_education', 'civico_militar', 'training'],
         'REGÊNCIA': ['teacher', 'scheduling', 'library', 'almoxarifado', 'civico_militar', 'training'],
         'MONITOR': ['civico_militar', 'scheduling', 'training'],
         'BUSCA ATIVA': ['busca_ativa', 'secretariat'],
         'MEDIADOR': ['psychosocial', 'busca_ativa', 'scheduling', 'special_education', 'teacher', 'training'],
         'PSICOSSOCIAL': ['psychosocial', 'busca_ativa', 'scheduling', 'special_education', 'teacher', 'training'],
         'BIBLIOTECA': ['library', 'scheduling'],
         'LIMPEZA': ['limpeza', 'training'],
         'NUTRIÇÃO': ['merenda', 'training'],
         'AUXILIAR DE PÁTIO': ['training'],
         'AUXILIAR DE COORDENAÇÃO PEDAGÓGICA': ['pedagogical', 'scheduling', 'training'],
         'ASSISTENTE DE EDUCAÇÃO ESPECIAL': ['special_education', 'training'],
         'APA': ['special_education', 'training'],
         'SALA DE RECURSOS': ['special_education', 'training']
      };

      try {
         const saved = localStorage.getItem('portal_module_permissions_v5');
         const parsed = saved ? JSON.parse(saved) : null;
         if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Garante que cargos novos ou não salvos recebam os defaults
            return { ...defaultPerms, ...parsed };
         }
      } catch (e) {
         console.error("Error parsing permissions:", e);
      }
      return defaultPerms;
   });

   useEffect(() => {
      localStorage.setItem('portal_module_permissions_v5', JSON.stringify(permissions));
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

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
                              <th className="px-10 py-6 sticky left-0 bg-gray-50 z-10">Função / Módulo</th>
                              {MODULES_LIST.map(mod => (
                                 <th key={mod.id} className="px-6 py-6 text-center whitespace-nowrap">{mod.label}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {FUNCTIONS_LIST.map(fn => (
                              <tr key={fn.id} className="hover:bg-gray-50/50 transition-colors group">
                                 <td className="px-10 py-6 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-50">
                                    <p className="text-sm font-black text-gray-900 uppercase">{fn.label}</p>
                                    <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Cargo: {fn.id}</p>
                                 </td>
                                 {MODULES_LIST.map(mod => {
                                    const isAllowed = (permissions[fn.id] || []).includes(mod.id);
                                    return (
                                       <td key={mod.id} className="px-6 py-6 text-center">
                                          <button
                                             onClick={() => togglePermission(fn.id, mod.id)}
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
      </div>
   );
};

export default Settings;
