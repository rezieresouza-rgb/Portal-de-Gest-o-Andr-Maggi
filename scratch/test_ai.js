import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getAIClient, runWithRetry } from './geminiService.js';
import { Type } from '@google/genai';

async function test() {
    const ai = getAIClient();
    const payload = {
         subject: 'MATEMÁTICA',
         className: '6º ANO A',
         bimestre: '1º BIMESTRE',
         averageScore: '48.2',
         lowPerformers: ['João (40%)', 'Maria (35%)'],
         skillsData: []
    };

    try {
        const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Você é um especialista em educação e análise de dados pedagógicos (CAED/Sistema Estruturado).
        
        Analise os resultados desta avaliação externa:
        - Disciplina: ${payload.subject}
        - Turma: ${payload.className}
        - Bimestre: ${payload.bimestre}
        - Média da Turma: ${payload.averageScore}%
        - Alunos com Baixo Desempenho (<60%): ${JSON.stringify(payload.lowPerformers)}
        ${payload.skillsData ? `- Desempenho nas Habilidades (Geral): ${JSON.stringify(payload.skillsData)}` : ''}
        
        Gere um PARECER TÉCNICO PEDAGÓGICO curto e direto contendo:
        1. **Diagnóstico**: Identifique prováveis lacunas de aprendizagem.
        2. **Ação Imediata**: Sugira 2 metodologias ativas para aplicar em sala de aula visando corrigir essas lacunas.
        3. **Descritores/Habilidades**: Cite quais habilidades da BNCC (utilize os dados de Desempenho nas Habilidades se fornecidos) que precisam ser retomadas.
        
        Responda em formato JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                diagnosis: { type: Type.STRING, description: "Identificação das lacunas" },
                actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Ações metodológicas sugeridas"
                },
                skillsToReinforce: { type: Type.STRING, description: "Habilidades/Descritores BNCC foco" }
            },
            required: ["diagnosis", "actions", "skillsToReinforce"]
            },
            temperature: 0.2
        }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.error("Failed:", e);
    }
}
test();
