
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\rezie\\Downloads\\portal-de-gestão-andré-maggi\\components\\MediationManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace the entire filteredCases.map block to ensure it's balanced.
// We'll find the section between the opening of the div and the closing of the map.

const startMarker = '<div className="grid grid-cols-1 gap-4">';
const endMarker = '{filteredCases.length === 0 && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex + startMarker.length);
    const tail = content.substring(endIndex);
    
    // Completely rebuilt and balanced block
    const fixedBlock = `
         {filteredCases.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-8"
            >
               <div className="flex items-center gap-6 flex-1">
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center border-2 " + getStatusStyle(c.status)}>
                    {c.status === 'CONCLUÍDO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                     <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-gray-900 uppercase leading-none">{c.studentName}</h4>
                        <span className={"px-2 py-0.5 rounded text-[8px] font-black uppercase border " + getStatusStyle(c.status)}>
                          {c.status}
                        </span>
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><User size={12}/> {c.className}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Target size={12}/> {c.type}</span>
                        <span className={"text-[10px] font-black uppercase flex items-center gap-1 " + getSeverityColor(c.severity)}>
                           <AlertTriangle size={12}/> Risco {c.severity}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                     <p className="text-[10px] font-black text-gray-400 uppercase">Progresso</p>
                     <div className="flex items-center gap-1 mt-1">
                        {c.steps?.map((step, i) => (
                          <div key={i} className={"h-1.5 w-6 rounded-full " + (step.completed ? 'bg-rose-500' : 'bg-gray-100')} />
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                     <div className="p-3 bg-gray-50 text-gray-300 group-hover:bg-rose-600 group-hover:text-white rounded-xl transition-all">
                        <ChevronRight size={24}/>
                     </div>
                     <button 
                       onClick={(e) => handleDeleteCase(e, c.id)}
                       className="p-3 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                       title="Excluir Caso"
                     >
                        <Trash2 size={16}/>
                     </button>
                  </div>
               </div>
            </div>
         ))}
         `;

    fs.writeFileSync(filePath, head + fixedBlock + tail);
    console.log('MediationManager.tsx map block REBUILT successfully.');
} else {
    console.log('Markers not found:', { startIndex, endIndex });
}
