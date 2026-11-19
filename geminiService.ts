import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './supabaseClient';
import { PedagogicalSkill } from './types';

const DEFAULT_GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];

interface AIClientLike {
  isProxy?: boolean;
  models: {
    generateContent: (params: { model?: string; models?: string[]; contents: any; config?: any }) => Promise<{ text?: string }>;
  };
}

export const getAIKey = (): string => {
  // No navegador, apenas chave manual opcional no localStorage (nunca embutida no bundle público!)
  if (typeof window !== 'undefined') {
    try {
      const localKey = localStorage.getItem('portal_gemini_api_key');
      if (localKey && localKey.trim()) return localKey.trim();
    } catch {
      // ignore storage errors
    }
    return '';
  }

  // Em ambiente Node.js / servidor
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  return String(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || '').trim();
};

const createServerProxyClient = (): AIClientLike => ({
  isProxy: true,
  models: {
    generateContent: async ({ model, models, contents, config }) => {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, models, contents, config })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const err: any = new Error('Rota /api/gemini indisponível neste ambiente.');
        err.status = response.status || 503;
        throw err;
      }

      const data = await response.json();
      if (!response.ok || data?.error) {
        const err: any = new Error(data?.error?.message || `Erro HTTP ${response.status} na API do Gemini.`);
        err.status = data?.error?.code || response.status;
        err.code = err.status;
        throw err;
      }

      return { text: data?.text || '' };
    }
  }
});

const getAIClient = (): AIClientLike | null => {
  const localOrServerKey = getAIKey();
  if (localOrServerKey) {
    return new GoogleGenAI({ apiKey: localOrServerKey, apiVersion: 'v1beta' }) as unknown as AIClientLike;
  }

  // No navegador, utiliza o proxy serverless seguro /api/gemini na Vercel (chave 100% oculta no servidor)
  if (typeof window !== 'undefined') {
    return createServerProxyClient();
  }

  console.warn("Gemini API Key not found! Features utilizing AI will fail.");
  return null;
};

const getFriendlyAIErrorReason = (error: any): string => {
  const msg = String(error?.message || error || '');
  const status = error?.status || error?.code;

  if (msg.includes('NOT_CONFIGURED') || msg.includes('não configurada no servidor')) {
    return 'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel.';
  }
  if (
    status === 402 ||
    msg.includes('402') ||
    msg.toLowerCase().includes('prepayment credits are depleted') ||
    msg.toLowerCase().includes('billing')
  ) {
    return 'Créditos pré-pagos da API do Gemini esgotados no Google AI Studio (Erro 402). Recarregue os créditos ou atualize a variável GEMINI_API_KEY na Vercel.';
  }
  if (
    status === 403 ||
    msg.includes('403') ||
    msg.toLowerCase().includes('leaked') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('API_KEY_INVALID') ||
    msg.toLowerCase().includes('api key not valid')
  ) {
    return 'Chave da API do Gemini inválida ou bloqueada pelo Google (Erro 403). Gere uma nova chave no Google AI Studio e atualize a variável GEMINI_API_KEY na Vercel.';
  }
  if (
    status === 429 ||
    msg.includes('429') ||
    msg.toLowerCase().includes('resource_exhausted') ||
    msg.toLowerCase().includes('quota')
  ) {
    return 'Limite temporário de requisições da API do Gemini atingido (Erro 429). Aguarde alguns segundos e tente novamente.';
  }
  if (status === 404 || msg.includes('404') || msg.toLowerCase().includes('not found')) {
    return 'Modelo de IA indisponível na API do Gemini (Erro 404).';
  }
  return 'Serviço do Google Gemini temporariamente indisponível.';
};

// Retry helper for transient 429 errors (skipping billing 402 errors)
const runWithRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1500): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = String(error?.message || '');
    const isBilling =
      error?.code === 402 ||
      error?.status === 402 ||
      msg.includes('402') ||
      msg.toLowerCase().includes('prepayment credits') ||
      msg.toLowerCase().includes('billing');

    const isRateLimit =
      !isBilling &&
      (error?.code === 429 ||
        error?.status === 429 ||
        msg.includes('429') ||
        msg.toLowerCase().includes('too many requests'));

    if (retries > 0 && isRateLimit) {
      console.warn(`[AI] Quota exceeded (429). Retrying in ${delay / 1000}s... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

const generateContentWithFallback = async (
  ai: AIClientLike,
  request: { contents: any; config?: any },
  models: string[] = DEFAULT_GEMINI_MODELS
) => {
  if (ai.isProxy) {
    return await runWithRetry(() =>
      ai.models.generateContent({
        models,
        ...request
      })
    );
  }
  let lastError: any = null;
  for (const model of models) {
    try {
      return await runWithRetry(() =>
        ai.models.generateContent({
          model,
          ...request
        })
      );
    } catch (error: any) {
      lastError = error;
      const msg = String(error?.message || '');
      const status = error?.status || error?.code;
      const isModelIssue =
        status === 404 ||
        msg.includes('404') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('not supported') ||
        status === 503 ||
        msg.includes('503');

      if (isModelIssue) {
        console.warn(`[AI] Modelo ${model} indisponível, tentando próximo fallback...`, msg);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('Nenhum modelo Gemini disponível respondeu.');
};

/**
 * Extrai lista detalhada de alunos de um PDF da Secretaria.
 */
export const extractDetailedStudentList = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return { Alunos: [] };

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      // FIX: Updated contents to use { parts: [...] } structure for standard multi-part inputs
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Você é um secretário escolar especialista em extração de dados. 
          Analise o documento anexado (Relação de Alunos por Situação ou com Idade) e extraia TODOS os alunos encontrados.
          
          INSTRUÇÕES DE PRECISÃO DE DATA:
          1. Identifique a coluna "Data Nasc." ou "Nascimento".
          2. Extraia o dia, mês e ano EXATOS conforme escritos no papel. Não faça cálculos e não aplique fusos horários.
          3. Exemplo: Se estiver escrito 03/03/2015, você DEVE retornar "2015-03-03".
          
          OUTRAS INSTRUÇÕES:
          1. Identifique a "Turma" e o "Turno" no cabeçalho (ex: "6º ANO" e "Turma: B" torna-se "6º ANO B").
          2. Converta a "Dta. Matrícula" e "Data Nasc." para o formato ISO AAAA-MM-DD.
          3. Identifique PAED e Transporte Escolar ("Sim" ou "Não").
          
          Retorne estritamente um JSON seguindo o esquema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            Modulo: { type: Type.STRING },
            Aba: { type: Type.STRING },
            Alunos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Nome: { type: Type.STRING },
                  Turma: { type: Type.STRING },
                  Turno: { type: Type.STRING },
                  Sequencia: { type: Type.STRING },
                  CodigoAluno: { type: Type.STRING },
                  DataMatricula: { type: Type.STRING, description: "Data no formato AAAA-MM-DD" },
                  DataNascimento: { type: Type.STRING, description: "Data no formato AAAA-MM-DD" },
                  PAED: { type: Type.STRING, description: "Sim ou Não" },
                  TransporteEscolar: { type: Type.STRING, description: "Sim ou Não" }
                },
                required: ["Nome", "Turma", "Turno", "Sequencia", "CodigoAluno", "DataMatricula", "DataNascimento", "PAED", "TransporteEscolar"]
              }
            }
          },
          required: ["Modulo", "Aba", "Alunos"]
        },
        temperature: 0.1
      }
    }));

    return JSON.parse(response.text || '{"Alunos": []}');
  } catch (e) {
    console.error("Erro ao parsear lista de alunos via IA", e);
    return { Alunos: [] };
  }
};

/**
 * Consolida dados de múltiplos arquivos (planilhas/PDFs) em uma única lista de alunos.
 */
export const consolidateStudentData = async (files: { base64: string; mimeType: string; name: string }[]) => {
  const ai = getAIClient();
  if (!ai) return { consolidatedStudents: [], summary: "Chave de IA não configurada." };

  // Construir o prompt com as partes de cada arquivo
  const promptParts: any[] = [];

  files.forEach((file, index) => {
    promptParts.push({
      text: `Arquivo ${index + 1} (${file.name}):`
    });
    promptParts.push({
      inlineData: {
        data: file.base64,
        mimeType: file.mimeType
      }
    });
  });

  promptParts.push({
    text: `Você é um secretário escolar especialista em organização de dados.
    
    TAREFA:
    Analise os ${files.length} arquivos fornecidos. Eles contêm dados de alunos, mas as informações podem estar fragmentadas (ex: um arquivo tem nomes e turmas, outro tem datas de nascimento, outro tem dados de transporte).
    
    OBJETIVO:
    Cruze as informações de TODOS os arquivos para criar um CADASTRO UNIFICADO E COMPLETO para cada aluno.
    
    REGRAS DE CONSOLIDAÇÃO:
    1. Use o NOME DO ALUNO como chave principal para unir os dados.
    2. Se houver conflito de dados (ex: datas de nascimento diferentes), prefira a data mais completa ou formatada.
    3. Normalizar Turmas (ex: "6A", "6º A", "TURMA A" -> "6º ANO A").
    4. Normalizar Turnos ("M", "Matutino" -> "MATUTINO").
    5. Se uma informação não estiver em NENHUM arquivo, deixe como string vazia ou "Não Informado".

    EXTRAÇÃO DE CAMPOS:
    - Nome Completo
    - Turma (Padronizado)
    - Turno (MATUTINO, VESPERTINO, NOTURNO, INTEGRAL)
    - Data de Nascimento (Formato ISO: AAAA-MM-DD) - EXTREMAMENTE IMPORTANTE
    - Código do Aluno (Se houver)
    - Código do Aluno (Se houver)
    - Situação (PAED, Transporte, etc - Se houver indicação)
    - Nome do Responsável (Mãe, Pai ou Responsável Legal)
    - Telefone de Contato/Celular (Essencial - Extraia se encontrar 9 dígitos ou DDD)

    Retorne um JSON com a lista consolidada.`
  });

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: promptParts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            consolidatedStudents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Nome: { type: Type.STRING },
                  Turma: { type: Type.STRING },
                  Turno: { type: Type.STRING },
                  CodigoAluno: { type: Type.STRING },
                  DataNascimento: { type: Type.STRING, description: "AAAA-MM-DD" },
                  PAED: { type: Type.STRING },
                  TransporteEscolar: { type: Type.STRING },
                  NomeResponsavel: { type: Type.STRING },
                  TelefoneContato: { type: Type.STRING }
                },
                required: ["Nome", "Turma", "Turno", "DataNascimento"]
              }
            },
            summary: { type: Type.STRING, description: "Resumo do que foi feito (quais arquivos foram usados, quantos alunos encontrados)" }
          },
          required: ["consolidatedStudents", "summary"]
        },
        temperature: 0.1
      }
    }));

    return JSON.parse(response.text || '{"consolidatedStudents": [], "summary": "Erro na análise"}');
  } catch (e) {
    console.error("Erro ao consolidar dados", e);
    return { consolidatedStudents: [], summary: "Erro no processamento" };
  }
};

/**
 * Transforma um relato informal de ocorrência em uma Ata Formal Administrativa.
 */
export const generateOccurrenceAta = async (occurrenceData: any) => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Você é um assistente jurídico e pedagógico de uma secretaria escolar. 
      Com base nos dados da ocorrência abaixo, gere uma Ata de Ocorrência Escolar formal, imparcial e padronizada.
      
      Dados da Ocorrência:
      - Data/Hora: ${occurrenceData.date} às ${occurrenceData.time}
      - Local: ${occurrenceData.location}
      - Envolvidos: ${occurrenceData.involvedStudents}
      - Categoria: ${occurrenceData.category}
      - Relato do Servidor: ${occurrenceData.report}
      - Responsável pelo Registro: ${occurrenceData.responsible}
  
      A Ata deve conter:
      1. Texto formal da narrativa dos fatos em linguagem administrativa.
      2. Resumo executivo.
      3. Lista consolidada de envolvidos.
      4. Sugestão de 3 encaminhamentos pedagógicos/disciplinares baseados no regimento escolar padrão (ex: advertência, mediação, contato com responsáveis, suspensão se grave, etc).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formalText: { type: Type.STRING, description: "O corpo da ata em linguagem formal" },
            summary: { type: Type.STRING, description: "Resumo da ocorrência" },
            involvedParties: { type: Type.STRING, description: "Lista de nomes formatada" },
            suggestedReferrals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Encaminhamentos sugeridos"
            }
          },
          required: ["formalText", "summary", "involvedParties", "suggestedReferrals"]
        },
        temperature: 0.2
      }
    }));

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Erro ao processar Ata via IA", e);
    return null;
  }
};

/**
 * Sugere livros com base no interesse do aluno.
 */
export const suggestBooks = async (readerInterests: string) => {
  const ai = getAIClient();
  if (!ai) return "Erro: Chave API do Gemini não configurada.";
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [{ text: `Você é um bibliotecário especialista. Com base nos interesses: "${readerInterests}", sugira 3 livros clássicos ou contemporâneos adequados para idade escolar. Forneça o título, autor e um pequeno motivo da recomendação. Responda em Português do Brasil.` }]
      },
    }));
    return response.text || "Nenhuma sugestão gerada.";
  } catch (e) {
    console.error("Error suggesting books", e);
    return `Erro ao gerar sugestões: ${getFriendlyAIErrorReason(e)}`;
  }
};

/**
 * Analisa a saúde de um contrato usando IA.
 */
export const analyzeContractHealth = async (contractData: any) => {
  const ai = getAIClient();
  if (!ai) return "Chave de IA não configurada (GEMINI_API_KEY).";
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Analise o seguinte contrato de merenda escolar e forneça um resumo de saúde (riscos, prazos, custo-benefício): ${JSON.stringify(contractData)}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    }));
    return response.text;
  } catch (e) {
    console.error("Error analyzing contract", e);
    return `Erro na análise: ${getFriendlyAIErrorReason(e)}`;
  }
};

/**
 * Sugere um cardápio com base no estoque atual.
 */
export const suggestMenu = async (inventory: any) => {
  const ai = getAIClient();
  if (!ai) return "Chave de IA não configurada (GEMINI_API_KEY).";
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Com base no estoque atual de merenda escolar: ${JSON.stringify(inventory)}, sugira um cardápio semanal nutricionalmente equilibrado focando em reduzir desperdício de itens próximos do vencimento ou em excesso. Responda em Português do Brasil.`,
    }));
    return response.text;
  } catch (e) {
    console.error("Error suggesting menu", e);
    return `Erro ao gerar cardápio: ${getFriendlyAIErrorReason(e)}`;
  }
};

/**
 * Busca a LISTA COMPLETA de Habilidades BNCC/DRC-MT para o Roteiro
 */
export const fetchPedagogicalSkills = async (subject: string, className: string) => {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Você é um consultor pedagógico da SEDUC-MT especialista em BNCC e DRC-MT.
      Forneça a LISTA COMPLETA e EXAUSTIVA das habilidades essenciais para o componente "${subject}" na turma "${className}".
      Inclua tanto as habilidades da base nacional (BNCC) quanto os acréscimos regionais do Mato Grosso (DRC-MT).
      Retorne também sugestões de habilidades para recomposição de aprendizagem (pré-requisitos de anos anteriores) e unidades temáticas.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "Código oficial da habilidade" },
                  description: { type: Type.STRING, description: "Descrição completa da habilidade" }
                },
                required: ["code", "description"]
              }
            },
            recomposition: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["code", "description"]
              }
            },
            themes: { type: Type.STRING, description: "Lista de unidades temáticas do período" }
          },
          required: ["skills", "recomposition", "themes"]
        },
        temperature: 0.1,
      }
    }));

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Erro ao parsear JSON da IA", e);
    return null;
  }
};

/**
 * Extrai dados estruturados de uma Nota Fiscal (PDF ou Imagem)
 */
export const extractInvoiceInfo = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return {};
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Extraia os dados desta Nota Fiscal. Retorne apenas o JSON conforme o esquema definido. Se não encontrar um campo, deixe vazio."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: "Número da nota fiscal" },
            invoiceSeries: { type: Type.STRING, description: "Série da nota" },
            invoiceIssuerCnpj: { type: Type.STRING, description: "CNPJ do emitente/fornecedor" },
            invoiceDate: { type: Type.STRING, description: "Data de emissão no formato YYYY-MM-DD" },
            totalValue: { type: Type.NUMBER, description: "Valor total da nota" },
            description: { type: Type.STRING, description: "Um resumo do que foi comprado (ex: Gêneros alimentícios, Material de limpeza)" }
          }
        }
      }
    }));
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Error extracting invoice", e);
    return {};
  }
};

/**
 * Extrai dados de resultados de avaliações (CAED/Estruturado) de um documento
 */
export const extractAssessmentResults = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return { students: [] };
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Você é um assistente pedagógico. Extraia a lista de alunos e suas respectivas porcentagens de acerto ou notas (0 a 100) deste relatório de avaliação. Retorne un JSON com a lista de estudantes encontrados."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            students: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome completo do aluno" },
                  score: { type: Type.NUMBER, description: "Porcentagem de proficiência ou nota de 0 a 100" }
                },
                required: ["name", "score"]
              }
            }
          },
          required: ["students"]
        }
      }
    }));
    return JSON.parse(response.text || '{"students": []}');
  } catch (e) {
    console.error("Error extracting assessment", e);
    return { students: [] };
  }
};

/**
 * Extrai dados cadastrais de um aluno de documentos (Certidão, RG, Ficha de Matrícula)
 */
export const extractStudentInfo = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return {};
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Você é um secretário escolar. Extraia os dados cadastrais do aluno a partir deste documento. Retorne um JSON seguindo o esquema."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome completo do aluno" },
            birthDate: { type: Type.STRING, description: "Data de nascimento no formato YYYY-MM-DD" },
            address: { type: Type.STRING, description: "Endereço completo se disponível" },
            guardianName: { type: Type.STRING, description: "Nome do responsável (mãe ou pai)" },
            contactPhone: { type: Type.STRING, description: "Telefone de contato se disponível" }
          }
        }
      }
    }));
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Error extracting student info", e);
    return {};
  }
};

/**
 * Analisa o desempenho pedagógico global com base em observações, estatísticas e avaliações.
 */
export const analyzePedagogicalPerformance = async (data: any) => {
  const ai = getAIClient();
  if (!ai) return "Chave de IA não configurada (GEMINI_API_KEY).";
  try {
    const response = await generateContentWithFallback(ai, {
      contents: `Você é um consultor pedagógico sênior especialista em gestão educacional da rede SEDUC-MT.
      Analise os seguintes dados pedagógicos da unidade escolar e forneça um relatório estratégico de insights e plano de intervenção.
      Dados: ${JSON.stringify(data)}
      O relatório deve focar em:
      1. Disparidades entre avaliações internas e externas (CAED/Estruturado).
      2. Alertas de turmas com alta taxa de notas abaixo da média.
      3. Recomendações baseadas nas observações de aula.
      4. Sugestões de melhoria para os roteiros pedagógicos.
      Responda em Português do Brasil de forma executiva e profissional.`,
    }, DEFAULT_GEMINI_MODELS);
    return response.text;
  } catch (e) {
    console.error("Error analyzing performance", e);
    return `Erro na análise pedagógica: ${getFriendlyAIErrorReason(e)}`;
  }
};

/**
 * Analisa o desempenho 360° de uma turma específica (Notas, Frequência, Ocorrências e Alunos em Risco).
 */
const generateFallbackClassroomReport = (
  classData: {
    className: string;
    bimestre: string;
    subject: string;
    averageGrade: number;
    approvalRate: number;
    presenceRate: number;
    totalOccurrences: number;
    atRiskStudentsCount: number;
    topStudents: string[];
    strugglingStudents: { name: string; grade: number; presenceRate: number }[];
  },
  aiReason: string
): string => {
  const avg = Number(classData.averageGrade ?? 0).toFixed(1);
  const approval = Number(classData.approvalRate ?? 0).toFixed(1);
  const presence = Number(classData.presenceRate ?? 0).toFixed(1);
  const strugglingList = (classData.strugglingStudents || [])
    .map(s => `• ${s.name} (média ${Number(s.grade ?? 0).toFixed(1)}, frequência ${Number(s.presenceRate ?? 0).toFixed(0)}%)`)
    .join('\n');
  const topList = (classData.topStudents || []).slice(0, 5).join(', ') || 'Estudantes com desempenho adequado.';

  return [
    `⚠️ Aviso da IA Gemini: ${aiReason}`,
    `Relatório técnico estruturado gerado automaticamente com base nos dados oficiais da turma:`,
    '',
    `1. 📋 DIAGNÓSTICO GERAL — ${classData.className} (${classData.subject} | ${classData.bimestre})`,
    `A turma registra média geral de ${avg}/10,0, com taxa de aprovação de ${approval}% e frequência média de ${presence}% (meta SEDUC-MT: ≥ 85%). Foram computadas ${classData.totalOccurrences || 0} ocorrência(s) e ${classData.atRiskStudentsCount || 0} estudante(s) em faixa de atenção pedagógica.`,
    '',
    `2. 🔍 FATORES DE DEFASAGEM E ESTUDANTES PRIORITÁRIOS`,
    strugglingList || 'Nenhum estudante listado em faixa crítica no período avaliado.',
    '',
    `3. 💡 PLANO DE AÇÃO PARA O PROFESSOR`,
    `• Organizar agrupamentos produtivos em sala utilizando estudantes destaque (${topList}) como tutores entre pares.`,
    `• Aplicar atividades de recomposição contínua focadas nos descritores essenciais da BNCC/DRC-MT antes do fechamento bimestral.`,
    `• Realizar devolutivas individualizadas das avaliações com metas semanais de recuperação paralela.`,
    '',
    `4. 🤝 ENCAMINHAMENTOS PARA COORDENAÇÃO E BUSCA ATIVA`,
    Number(classData.presenceRate ?? 100) < 85
      ? `• Acionar Busca Ativa Escolar e convocar os responsáveis dos estudantes com frequência inferior a 85% para pactuação de assiduidade.`
      : `• Manter o monitoramento bimestral de notas pela Coordenação Pedagógica e comunicar formalmente os responsáveis dos estudantes abaixo da média 6,0.`
  ].join('\n');
};

export const analyzeClassroomPerformanceWithAI = async (classData: {
  className: string;
  bimestre: string;
  subject: string;
  averageGrade: number;
  approvalRate: number;
  presenceRate: number;
  totalOccurrences: number;
  atRiskStudentsCount: number;
  topStudents: string[];
  strugglingStudents: { name: string; grade: number; presenceRate: number }[];
  occurrenceTypes: Record<string, number>;
}) => {
  const ai = getAIClient();
  if (!ai) {
    return generateFallbackClassroomReport(classData, 'Chave de IA não configurada (GEMINI_API_KEY).');
  }

  try {
    const prompt = `Você é um coordenador pedagógico e especialista em psicopedagogia da rede estadual SEDUC-MT.
    Analise os dados reais de desempenho 360° da turma abaixo e gere um Diagnóstico Pedagógico Executivo e Plano de Ação:

    DADOS DA TURMA:
    - Turma: ${classData.className}
    - Bimestre: ${classData.bimestre}
    - Componente Curricular: ${classData.subject}
    - Média Geral da Turma: ${Number(classData.averageGrade ?? 0).toFixed(1)} / 10.0
    - Taxa de Aprovação (>= 6,0): ${Number(classData.approvalRate ?? 0).toFixed(1)}%
    - Taxa Média de Frequência: ${Number(classData.presenceRate ?? 0).toFixed(1)}% (Meta SEDUC: >= 85%)
    - Total de Ocorrências Registradas: ${classData.totalOccurrences}
    - Tipos de Ocorrências: ${JSON.stringify(classData.occurrenceTypes)}
    - Alunos com Dificuldade / Risco: ${JSON.stringify(classData.strugglingStudents)}
    - Alunos Destaque: ${classData.topStudents.join(', ') || 'Vários alunos com bom desempenho'}

    ESTRUTURE SUA RESPOSTA EM FORMATO MARKDOWN COM OS SEGUINTES TÓPICOS:
    ### 1. 📋 Diagnóstico Geral da Turma
    (Resumo do clima de sala, engajamento e correlação entre as faltas e as notas)

    ### 2. 🔍 Principais Fatores de Defasagem
    (Identificação das causas para as notas baixas e infrequência)

    ### 3. 💡 Plano de Ação e Intervenções para o Professor
    (3 estratégias práticas de recuperação paralela, metodologias ativas e estímulo ao protagonismo discente)

    ### 4. 🤝 Encaminhamentos para Coordenação & Psicossocial
    (Orientações para busca ativa ou acolhimento dos estudantes mais vulneráveis)

    Seja direto, empático, profissional e fundamentado nas diretrizes pedagógicas de Mato Grosso.`;

    const response = await generateContentWithFallback(ai, { contents: prompt });
    return response.text || generateFallbackClassroomReport(classData, 'Resposta vazia da API do Gemini.');
  } catch (e: any) {
    console.error("Error analyzing classroom performance with AI:", e);
    return generateFallbackClassroomReport(classData, getFriendlyAIErrorReason(e));
  }
};

const generateFallbackIndividualOpinion = (
  studentData: {
    studentName: string;
    className: string;
    bimestre: string;
    averageGrade: number | null;
    presenceRate: number;
    absencesCount: number;
    isPaed: boolean;
    gradesHistory: { subject: string; score: number | null; recoveryScore?: number | null; details?: string }[];
    occurrences: ({ date?: string; category?: string; description?: string } | string)[];
  },
  aiReason: string
): string => {
  const validGrades = (studentData.gradesHistory || []).filter(g => g.score != null && !isNaN(Number(g.score)));
  const strengths = validGrades
    .filter(g => Number(g.score) >= 7.0)
    .sort((a, b) => Number(b.score) - Number(a.score));
  const adequate = validGrades.filter(g => Number(g.score) >= 6.0 && Number(g.score) < 7.0);
  const failing = validGrades
    .filter(g => Number(g.score) < 6.0)
    .sort((a, b) => Number(a.score) - Number(b.score));

  const avgText = studentData.averageGrade != null && !isNaN(Number(studentData.averageGrade))
    ? `${Number(studentData.averageGrade).toFixed(1)} / 10,0`
    : 'Pendente de lançamento';
  const presRate = Number(studentData.presenceRate ?? 0);
  const absences = Number(studentData.absencesCount ?? 0);

  const occSummary = (studentData.occurrences || [])
    .map(o => (typeof o === 'string' ? o : `${o.category || 'Registro'}: ${o.description || ''}`))
    .filter(Boolean);

  const strengthsText = strengths.length > 0
    ? strengths.map(g => `${g.subject} (média ${Number(g.score).toFixed(1)})`).join(', ')
    : adequate.length > 0
      ? `Desempenho dentro da média mínima em ${adequate.map(g => `${g.subject} (${Number(g.score).toFixed(1)})`).join(', ')}.`
      : 'Ainda não há componentes com média igual ou superior a 6,0 consolidados no período.';

  const failingText = failing.length > 0
    ? failing.map(g => `${g.subject} (média ${Number(g.score).toFixed(1)}${g.details ? ` — ${g.details}` : ''})`).join('; ')
    : 'Nenhuma disciplina com média anual abaixo de 6,0 até o momento.';

  const attendanceStatus =
    presRate < 75
      ? `Frequência crítica (${presRate.toFixed(1)}% | ${absences} falta(s)), abaixo do limite legal mínimo de 75% (LDB), exigindo acionamento imediato da Busca Ativa Escolar.`
      : presRate < 85
        ? `Frequência em estado de alerta (${presRate.toFixed(1)}% | ${absences} falta(s)), abaixo da meta estadual SEDUC-MT (85%), com impacto direto na continuidade das aprendizagens.`
        : `Assiduidade satisfatória (${presRate.toFixed(1)}% | ${absences} falta(s)), compatível com a meta estadual SEDUC-MT.`;

  const paedNote = studentData.isPaed
    ? 'Estudante Público-Alvo da Educação Especial (PAEDE/AEE): assegurar flexibilização curricular, avaliações adaptadas e articulação contínua com a Sala de Recursos Multifuncionais.'
    : 'Estudante de acompanhamento regular, sem indicação de laudo PAEDE/AEE.';

  return [
    `⚠️ Aviso da IA Gemini: ${aiReason}`,
    `Parecer pedagógico estruturado gerado automaticamente com base nos dados oficiais do estudante:`,
    '',
    `### 1. 👤 Parecer Pedagógico do Estudante`,
    `O(a) estudante ${studentData.studentName} (${studentData.className} — ${studentData.bimestre}) apresenta média geral de ${avgText}. ${attendanceStatus} ${paedNote}`,
    occSummary.length > 0 ? `Observações registradas: ${occSummary.join(' | ')}.` : '',
    '',
    `### 2. 🎯 Pontos Fortes e Habilidades em Destaque`,
    strengthsText,
    '',
    `### 3. 🔍 Dificuldades e Fatores de Atenção`,
    failing.length > 0
      ? `Atenção prioritária para recomposição de aprendizagem nos componentes: ${failingText}.`
      : `O estudante mantém desempenho satisfatório nos componentes avaliados; recomenda-se consolidar a rotina de estudos para evitar quedas no fechamento do ano letivo.`,
    '',
    `### 4. 💡 Orientações de Apoio (Professor e Família)`,
    failing.length > 0
      ? `• Professores: ofertar plano de recomposição paralela e atividades diagnósticas direcionadas em ${failing.map(f => f.subject).join(', ')}, com acompanhamento semanal de tarefas.`
      : `• Professores: estimular o protagonismo discente e atividades de aprofundamento para elevação da proficiência.`,
    `• Família / Responsáveis: acompanhar diariamente a realização das atividades escolares, reforçar a pontualidade e comparecer à unidade escolar para alinhamento do Plano de Intervenção Pedagógica (PIP).`
  ].filter(line => line !== null && line !== undefined).join('\n');
};

/**
 * Analisa o perfil e desempenho 360° de um estudante individual (Notas, Frequência, Ocorrências e Laudos).
 */
export const analyzeIndividualStudentWithAI = async (studentData: {
  studentName: string;
  className: string;
  bimestre: string;
  averageGrade: number | null;
  presenceRate: number;
  absencesCount: number;
  isPaed: boolean;
  gradesHistory: { subject: string; score: number | null; recoveryScore?: number | null; details?: string }[];
  occurrences: ({ date?: string; category?: string; description?: string } | string)[];
}) => {
  const ai = getAIClient();
  if (!ai) {
    return generateFallbackIndividualOpinion(studentData, 'Chave de IA não configurada (GEMINI_API_KEY).');
  }

  try {
    const prompt = `Você é um psicopedagogo e orientador educacional especialista em desenvolvimento infanto-juvenil da rede SEDUC-MT.
    Analise a ficha individual do estudante abaixo e gere um Parecer Descritivo e Plano de Acompanhamento Individualizado:

    DADOS DO ESTUDANTE:
    - Nome: ${studentData.studentName}
    - Turma: ${studentData.className}
    - Bimestre: ${studentData.bimestre}
    - Média Geral: ${studentData.averageGrade != null ? Number(studentData.averageGrade).toFixed(1) : 'Pendente de Lançamento'} / 10.0
    - Assiduidade: ${Number(studentData.presenceRate ?? 0).toFixed(1)}% (${studentData.absencesCount ?? 0} faltas no período)
    - Aluno PAEDE / Educação Especial: ${studentData.isPaed ? 'SIM (Possui laudo / AEE)' : 'NÃO'}
    - Histórico de Avaliações: ${JSON.stringify(studentData.gradesHistory)}
    - Ocorrências / Registros de Convivência: ${JSON.stringify(studentData.occurrences)}

    ESTRUTURE SUA RESPOSTA EM MARKDOWN COM OS SEGUINTES TÓPICOS:
    ### 1. 👤 Parecer Pedagógico do Estudante
    (Análise da evolução acadêmica, assiduidade e comportamento)

    ### 2. 🎯 Pontos Fortes e Habilidades em Destaque
    (Onde o estudante demonstra maior interesse e rendimento)

    ### 3. 🔍 Dificuldades e Fatores de Atenção
    (Impacto das faltas ou defasagens em conteúdos específicos)

    ### 4. 💡 Orientações de Apoio (Para o Professor e Família)
    (Recomendações para intervenção em sala e engajamento dos responsáveis)`;

    const response = await generateContentWithFallback(ai, { contents: prompt });
    return response.text || generateFallbackIndividualOpinion(studentData, 'Resposta vazia da API do Gemini.');
  } catch (e: any) {
    console.error("Error analyzing individual student with AI:", e);
    return generateFallbackIndividualOpinion(studentData, getFriendlyAIErrorReason(e));
  }
};

const generateFallbackCouncilReport = (
  councilData: {
    className: string;
    bimestre: string;
    averageGrade: number;
    presenceRate: number;
    totalStudents: number;
    riskCount: number;
    paedCount: number;
    disciplinesSummary: { subject: string; average?: number; failingCount?: number }[];
    criticalStudents: { name: string; avg: number | null; pres: number; occurrences: number; isPaed: boolean }[];
  },
  aiReason: string
): string => {
  const avg = Number(councilData.averageGrade ?? 0).toFixed(1);
  const pres = Number(councilData.presenceRate ?? 0).toFixed(1);
  const bottlenecks = (councilData.disciplinesSummary || [])
    .slice(0, 6)
    .map(d => `• ${d.subject}${d.failingCount != null ? `: ${d.failingCount} aluno(s) abaixo da média 6,0` : ''}`)
    .join('\n');
  const criticals = (councilData.criticalStudents || [])
    .slice(0, 10)
    .map(s => `• ${s.name} — Média: ${s.avg != null ? Number(s.avg).toFixed(1) : 'S/N'} | Frequência: ${Number(s.pres ?? 0).toFixed(0)}%${s.isPaed ? ' [PAEDE/AEE]' : ''}`)
    .join('\n');

  return [
    `⚠️ Aviso da IA Gemini: ${aiReason}`,
    `Síntese estruturada para o Conselho de Classe gerada automaticamente a partir dos dados oficiais:`,
    '',
    `### 1. 📊 Panorama Geral — ${councilData.className} (${councilData.bimestre})`,
    `Total de estudantes analisados: ${councilData.totalStudents} (sendo ${councilData.paedCount} PAEDE/AEE). A média global está em ${avg}/10,0, com assiduidade média de ${pres}% e ${councilData.riskCount} estudante(s) em risco pedagógico prioritário.`,
    '',
    `### 2. ⚠️ Disciplinas com Maior Índice de Defasagem (Gargalos)`,
    bottlenecks || 'Nenhuma disciplina gargalo registrada no filtro atual.',
    '',
    `### 3. 🎯 Estudantes Prioritários para Intervenção & Recomposição`,
    criticals || 'Nenhum estudante em faixa crítica no filtro atual.',
    '',
    `### 4. 🚀 Plano de Ação Conjunto (Coordenação + Professores + Família)`,
    `• Instituir roteiros de recomposição paralela prioritariamente nas disciplinas gargalo listadas acima.`,
    `• Convocar os responsáveis dos estudantes em risco crítico para assinatura de Termo de Compromisso e Plano de Intervenção Pedagógica (PIP).`,
    `• Articular atendimento contínuo com a Sala de Recursos Multifuncionais (AEE) para os ${councilData.paedCount} estudante(s) PAEDE e com a Busca Ativa para casos de infrequência.`
  ].join('\n');
};

/**
 * Gera síntese estratégica para o Conselho de Classe da Coordenação Pedagógica.
 */
export const generateCoordinationClassCouncilWithAI = async (councilData: {
  className: string;
  bimestre: string;
  averageGrade: number;
  presenceRate: number;
  totalStudents: number;
  riskCount: number;
  paedCount: number;
  disciplinesSummary: { subject: string; average?: number; failingCount?: number }[];
  criticalStudents: { name: string; avg: number | null; pres: number; occurrences: number; isPaed: boolean }[];
}): Promise<string> => {
  const ai = getAIClient();
  if (!ai) {
    return generateFallbackCouncilReport(councilData, 'Chave de IA não configurada (GEMINI_API_KEY).');
  }

  try {
    const prompt = `Você é o Assistente Pedagógico da Coordenação da Escola Estadual André Antônio Maggi (SEDUC-MT).
    Elabore uma Síntese Executiva Estruturada para o CONSELHO DE CLASSE BIMESTRAL da turma: ${councilData.className} (${councilData.bimestre}).

    DADOS DA TURMA:
    - Total de Estudantes: ${councilData.totalStudents}
    - Estudantes com Laudo PAEDE / Inclusão: ${councilData.paedCount}
    - Média Geral da Turma: ${Number(councilData.averageGrade ?? 0).toFixed(1)} / 10.0
    - Taxa Média de Assiduidade: ${Number(councilData.presenceRate ?? 0).toFixed(1)}% (Meta SEDUC: 85%)
    - Total de Estudantes em Risco Pedagógico: ${councilData.riskCount}
    - Médias por Componente Curricular: ${JSON.stringify(councilData.disciplinesSummary)}
    - Lista de Alunos em Risco Crítico (Notas/Frequência/Ocorrências): ${JSON.stringify(councilData.criticalStudents)}

    ESTRUTURE SEU RELATÓRIO EM MARKDOWN OFICIAL:
    ### 1. 📊 Panorama Geral da Turma no Bimestre
    (Síntese do rendimento global, assiduidade e clima escolar da turma)

    ### 2. ⚠️ Disciplinas com Maior Índice de Defasagem
    (Componentes curriculares que necessitam de intervenção ou reforço)

    ### 3. 🎯 Estudantes Prioritários para Intervenção Pedagógica & Recomposição
    (Recomendações específicas para os alunos com notas baixas ou faltas excessivas, incluindo atenção aos estudantes PAEDE)

    ### 4. 🚀 Plano de Ação Conjunto (Coordenação + Professores + Família)
    (Ações práticas para o próximo período letivo, recuperação paralela e convocação de responsáveis)`;

    const response = await generateContentWithFallback(ai, { contents: prompt });
    return response.text || generateFallbackCouncilReport(councilData, 'Resposta vazia da API do Gemini.');
  } catch (e: any) {
    console.error("Error generating coordination council report with AI:", e);
    return generateFallbackCouncilReport(councilData, getFriendlyAIErrorReason(e));
  }
};

/**
 * Gera uma sugestão de horário escolar usando IA.
 */
export const generateClassSchedule = async (classInfo: any, teachers: any[], validSlots?: string[]) => {
  console.log("AI Prompt Teachers:", JSON.stringify(teachers));
  const ai = getAIClient();
  if (!ai) return { schedule: [] };

  // Use provided slots or default, but EXTRACT START TIMES for AI prompt validation to ensure consistency
  const slotsToUse = validSlots?.filter(s => !s.includes('Recreio')) || ['07:00', '07:50', '08:40', '09:50', '10:40'];
  // We provide the FULL string to the prompt so it knows the context, but we will accept fuzzy matches
  const formattedSlots = slotsToUse.join(', ');

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Você é um coordenador pedagógico especialista em montagem de grades horárias (Cronos).
      
      Tarefa: Criar uma grade horária semanal para a turma ${classInfo.name} (${classInfo.shift}).
      
      Restrições:
      1. A grade deve ter 5 aulas por dia (Segunda a Sexta).
      2. Horários das Aulas: ${formattedSlots}.
      3. Distribua as disciplinas de forma equilibrada (Português e Matemática todos os dias se possível).
      4. Use APENAS os professores fornecidos na lista abaixo, respeitando suas disciplinas.
      
      Lista de Professores Disponíveis:
      ${JSON.stringify(teachers)}
      
      Disciplinas Obrigatórias (USE A GRAFIA EXATA): PORTUGUÊS, MATEMÁTICA, HISTÓRIA, GEOGRAFIA, CIÊNCIAS, ARTE, ED. FÍSICA, INGLÊS.
      
      Retorne um JSON com a lista de aulas sugeridas.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER, description: "1=Segunda, 5=Sexta" },
                  time: { type: Type.STRING, description: `Horário de início (Exemplo: ${slotsToUse[0]})` },
                  subject: { type: Type.STRING },
                  teacherName: { type: Type.STRING }
                },
                required: ["day", "time", "subject"]
              }
            }
          },
          required: ["schedule"]
        }
      }
    }));

    console.log("AI Raw Response:", response.text);

    return JSON.parse(response.text || '{"schedule": []}');
  } catch (e) {
    console.error("Erro ao gerar horário via IA", e);
    return { schedule: [] };
  }
};

/**
 * Gera um plano de intervenção pedagógica com base em resultados de avaliações.
 */
export const generatePedagogicalIntervention = async (assessmentData: any) => {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Você é um especialista em educação e análise de dados pedagógicos (CAED/Sistema Estruturado).
      
      Analise os resultados desta avaliação externa:
      - Disciplina: ${assessmentData.subject}
      - Turma: ${assessmentData.className}
      - Bimestre: ${assessmentData.bimestre}
      - Média da Turma: ${assessmentData.averageScore}%
      - Alunos com Baixo Desempenho (<60%): ${JSON.stringify(assessmentData.lowPerformers)}
      ${assessmentData.skillsData && assessmentData.skillsData.length > 0 ? `- Desempenho nas Habilidades (Geral): ${JSON.stringify(assessmentData.skillsData)}` : ''}
      
      Gere um PARECER TÉCNICO PEDAGÓGICO curto e direto contendo:
      1. **Diagnóstico**: Identifique prováveis lacunas de aprendizagem.
      2. **Ação Imediata**: Sugira 2 metodologias ativas para aplicar em sala de aula visando corrigir essas lacunas.
      3. **Descritores/Habilidades**: Cite quais habilidades da BNCC ${assessmentData.skillsData && assessmentData.skillsData.length > 0 ? '(utilize os dados de Desempenho nas Habilidades fornecidos)' : 'provavelmente'} que precisam ser retomadas.
      
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
    }));

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Erro ao gerar intervenção via IA", e);
    return null;
  }
};

/**
 * Extrai dados de servidores de um PDF (Holerite, Ficha, Currículo)
 */
/**
 * Extrai dados de servidores de um PDF (Holerite, Ficha, Currículo, Lista)
 */
export const extractStaffInfo = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return { staffList: [] };
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Você é um assistente de RH. Extraia os dados de TODOS os servidores encontrados neste documento.
            
            CAMPOS ALVO:
            - Nome Completo
            - CPF
            - Matrícula
            - Data de Nascimento (Formato YYYY-MM-DD)
            - Cargo/Função (Ex: Professor, Apoio, Técnico)
            - Escolaridade/Habilitação (Ex: Licenciatura em Pedagogia)
            - Perfil (Efetivo ou Contratado)
            
            Retorne um JSON com uma lista de servidores.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            staffList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  cpf: { type: Type.STRING },
                  registration: { type: Type.STRING },
                  birthDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                  role: { type: Type.STRING },
                  qualification: { type: Type.STRING },
                  entryProfile: { type: Type.STRING, description: "EFETIVO ou CONTRATADO" }
                },
                required: ["name"]
              }
            }
          },
          required: ["staffList"]
        }
      }
    }));
    return JSON.parse(response.text || '{"staffList": []}');
  } catch (e) {
    console.error("Error extracting staff info", e);
    return { staffList: [] };
  }
};

/**
 * Extrai dados de um contrato de merenda escolar (PDF)
 */
export const extractContractInfo = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  if (!ai) return { items: [] };
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Você é um especialista em licitações e contratos públicos. Extraia os dados deste contrato ou ata de registro de preços. Retorne apenas o JSON. Se não encontrar o CNPJ, tente extrair o nome do fornecedor."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contractNumber: { type: Type.STRING, description: "Número do contrato ou processo" },
            supplierName: { type: Type.STRING, description: "Razão social ou nome fantasia do fornecedor" },
            supplierCnpj: { type: Type.STRING, description: "CNPJ do fornecedor" },
            startDate: { type: Type.STRING, description: "Data de início/assinatura no formato YYYY-MM-DD" },
            endDate: { type: Type.STRING, description: "Data de término no formato YYYY-MM-DD" },
            type: { type: Type.STRING, description: "Ex: Pregão Presencial, Chamada Pública, Dispensa" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Descrição detalhada do item" },
                  quantity: { type: Type.NUMBER, description: "Quantidade contratada" },
                  unit: { type: Type.STRING, description: "Unidade de medida (KG, UN, LT, etc)" },
                  unitPrice: { type: Type.NUMBER, description: "Preço unitário registrado" },
                  brand: { type: Type.STRING, description: "Marca se disponível" }
                },
                required: ["description", "quantity", "unit", "unitPrice"]
              }
            }
          },
          required: ["contractNumber", "supplierName", "items"]
        },
        temperature: 0.1
      }
    }));
    return JSON.parse(response.text || '{"items": []}');
  } catch (e) {
    console.error("Error extracting contract", e);
    return { items: [] };
  }
};

/**
 * Extrai habilidades da BNCC ou DRC-MT a partir de um PDF enviado pelo professor.
 */
export const extractSkillsFromPDF = async (base64Data: string, mimeType: string, subject?: string) => {
  const ai = getAIClient();
  if (!ai) return { skills: [] };
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Você é um coordenador pedagógico especialista em BNCC e DRC-MT.
            Analise este documento PDF e extraia TODOS os códigos e descrições de habilidades pedagógicas encontradas.
            
            ${subject ? `O foco principal é o componente curricular: ${subject}.` : ''}
            
            REGRAS DE EXTRAÇÃO:
            1. Identifique o código da habilidade (ex: EF01LP01, EM13MAT101, DRC-MT-EF01LP01).
            2. Extraia a descrição completa da habilidade.
            3. Ignore textos introdutórios ou comentários que não sejam a habilidade em si.
            
            Retorne estritamente um JSON seguindo o esquema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "Código da habilidade" },
                  description: { type: Type.STRING, description: "Descrição detalhada" }
                },
                required: ["code", "description"]
              }
            }
          },
          required: ["skills"]
        },
        temperature: 0.1
      }
    }));
    return JSON.parse(response.text || '{"skills": []}');
  } catch (e) {
    console.error("Error extracting skills from PDF", e);
    return { skills: [] };
  }
};

/**
 * Busca habilidades da BNCC diretamente do banco de dados para acelerar o processo.
 */
export const fetchBNCCSkillsFromDB = async (subject: string, className: string): Promise<PedagogicalSkill[] | null> => {
  // Map class name to BNCC year range components
  // EF II: 6th-9th grade
  const ranges: string[] = [];

  const isArte = subject.toUpperCase().includes('ARTE');

  if (className.includes('6º ANO')) {
    ranges.push(isArte ? 'EF69' : 'EF06', 'EF67', 'EF69');
  } else if (className.includes('7º ANO')) {
    ranges.push(isArte ? 'EF69' : 'EF07', 'EF67', 'EF69');
  } else if (className.includes('8º ANO')) {
    ranges.push(isArte ? 'EF69' : 'EF08', 'EF89', 'EF69');
  } else if (className.includes('9º ANO')) {
    ranges.push(isArte ? 'EF69' : 'EF09', 'EF89', 'EF69');
  }

  if (ranges.length === 0) return null;

  // Deduplicate ranges to avoid fetching same skills multiple times
  const uniqueRanges = [...new Set(ranges)];

  try {
    // Usamos .ilike para ignorar case e tratamos as variações de nomes de disciplinas adicionando curingas
    const { data, error } = await supabase
      .from('bncc_skills')
      .select('code, description')
      .ilike('subject', `%${subject}%`)
      .in('year_range', uniqueRanges)
      .order('code');

    if (error) throw error;

    // Log para debug
    console.log(`[v2-DB-INTEGRATED] Encontradas ${data?.length || 0} habilidades para ${subject} em ${className} (ranges: ${uniqueRanges.join(', ')})`);

    const formattedData = (data || []).map(skill => {
      const koMatch = skill.description.match(/^\[Objeto de Conhecimento:\s*([\s\S]*?)\]\s*([\s\S]*)$/i);
      if (koMatch) {
        return {
          code: skill.code,
          knowledgeObject: koMatch[1].trim(),
          description: koMatch[2].trim()
        };
      }
      return skill;
    });

    return formattedData as PedagogicalSkill[];
  } catch (e) {
    console.error("Erro ao buscar BNCC do banco:", e);
    return null;
  }
};
/**
 * Busca a sinopse de um livro via IA.
 */
export const fetchBookSynopsis = async (title: string, author: string) => {
  const ai = getAIClient();
  if (!ai) return "Erro: Chave API do Gemini não configurada no ambiente (Vercel). Verifique as variáveis de sistema.";
  
  // Lista de modelos para tentar (do mais recente para o mais estável)
  const models = DEFAULT_GEMINI_MODELS;

  let lastError = '';

  for (const modelName of models) {
    try {
      const response = await runWithRetry(() => ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: `Você é um bibliotecário especialista. Forneça uma sinopse concisa, atraente e profissional para o livro "${title}" do autor "${author}". Se não encontrar informações específicas sobre este livro exato, tente gerar uma descrição baseada no título e tema provável, ou retorne uma mensagem cordial dizendo que a sinopse não foi encontrada. Responda em Português do Brasil.` }]
        },
      }));
      return response.text || "Sinopse não disponível no momento.";
    } catch (e: any) {
      console.warn(`Falha ao usar modelo ${modelName}:`, e.message);
      lastError = e.message || 'Erro desconhecido';
      // Continua para o próximo modelo se for erro de modelo não encontrado (404)
      if (lastError.includes('404') || lastError.includes('not found') || lastError.includes('supported')) {
        continue;
      }
      break; // Se for outro erro (ex: 401, 429), para e retorna
    }
  }

  return `Erro na IA: Nenhum modelo disponível funcionou. Último erro: ${lastError}`;
};


/**
 * Busca a capa de um livro via Google Books API.
 */
export const fetchBookCover = async (title: string, author: string, isbn?: string) => {
  try {
    // 1. TENTA GOOGLE BOOKS API (Vários níveis de busca)
    const googleQueries = [
      isbn ? `isbn:${isbn}` : null,
      `intitle:${title} inauthor:${author}`,
      `${title} ${author}`,
      title 
    ].filter(Boolean);

    for (const query of googleQueries) {
      try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query!)}&maxResults=5`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            const imageLinks = item.volumeInfo.imageLinks;
            if (imageLinks) {
              const url = imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail;
              if (url) return url.replace('http://', 'https://');
            }
          }
        }
      } catch (err) {
        console.warn("Erro parcial na busca Google Books:", err);
      }
    }

    // 2. TENTA OPEN LIBRARY API (Fallback se Google falhar)
    try {
      const olSearchQuery = isbn ? `isbn=${isbn}` : `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;
      const olResponse = await fetch(`https://openlibrary.org/search.json?${olSearchQuery}`);
      const olData = await olResponse.json();

      if (olData.docs && olData.docs.length > 0) {
        for (const doc of olData.docs.slice(0, 3)) {
          if (doc.cover_i) {
            return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
          }
          if (doc.isbn && doc.isbn.length > 0) {
            return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
          }
        }
      }
    } catch (err) {
      console.warn("Erro fallback OpenLibrary:", err);
    }
  } catch (error) {
    console.error("Erro geral ao buscar capa do livro:", error);
  }
  return null;
};

/**
 * Recebe um texto bruto de um documento (PDF, Word, Excel) e tenta estruturar 
 * em um JSON compatível com o Roteiro Pedagógico.
 */
export const parseLessonPlanWithAI = async (rawText: string) => {
  const ai = getAIClient();
  if (!ai) return null;

  const prompt = `
    Você é um assistente pedagógico especializado. Recebi o texto bruto de um planejamento/roteiro de aula extraído de um arquivo.
    Sua tarefa é extrair as informações e organizar em um JSON estruturado seguindo EXATAMENTE este formato:

    {
      "bimestre": "1º BIMESTRE", // ou 2º, 3º, 4º
      "subject": "DISCIPLINA", // Ex: MATEMÁTICA, HISTÓRIA
      "className": "TURMA", // Ex: 1º ANO A
      "weeklyClasses": "6", // Número de aulas semanais se houver
      "themes": "TEMAS GERAIS",
      "observations": "OBSERVAÇÕES",
      "rows": [
        {
          "weekOrDate": "Período ou Data",
          "theme": "Tema da Aula",
          "materialPage": "Página do Material",
          "skillsText": "Código ou descrição da Habilidade (Ex: EF01MA01)",
          "content": "Conteúdo",
          "activities": "Atividades",
          "methodology": "Metodologia",
          "duration": "Duração em aulas",
          "evaluation": "Avaliação"
        }
      ]
    }

    REGRAS CRÍTICAS:
    1. Responda APENAS o JSON puro, sem markdown, sem explicações.
    2. Se não encontrar uma informação, deixe a string vazia "".
    3. Tente identificar o máximo de linhas (rows) possível baseando-se na estrutura do texto.
    4. Idioma: Português do Brasil.

    TEXTO BRUTO PARA PROCESSAR:
    ---
    ${rawText.substring(0, 15000)}
    ---
  `;

  const models = DEFAULT_GEMINI_MODELS;
  let lastError = '';

  for (const modelName of models) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] }
      });

      const text = result.text;
      if (!text) continue;

      // Limpa possíveis marcações de markdown do JSON
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e: any) {
      console.warn(`parseLessonPlanWithAI - Falha no modelo ${modelName}:`, e.message);
      lastError = e.message;
      if (lastError.includes('404') || lastError.includes('not found') || lastError.includes('supported')) {
        continue;
      }
      break;
    }
  }

  throw new Error(`Falha ao processar roteiro com IA: ${lastError}`);
};






/**
 * Gera um plano de ação de melhoria para zeladoria/manutenção com base em ocorrências registradas.
 */
export const generateMaintenanceActionPlan = async (occurrences: any[]) => {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const formattedOccurrences = occurrences.map(o => ({
      location: o.location,
      description: o.description,
      category: o.category,
      status: o.status,
      reported_at: o.reported_at
    }));

    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Você é um gestor predial especialista em manutenção e conservação escolar de alto padrão.
      
      Analise a lista de ocorrências registradas na escola para formular um PLANO DE AÇÃO DE MELHORIAS PREVENTIVAS E CORRETIVAS:
      ${JSON.stringify(formattedOccurrences)}
      
      Gere um plano de ação estruturado contendo:
      1. **Diagnóstico Geral**: Uma síntese dos principais gargalos detectados (por exemplo, problemas recorrentes de elétrica, hidráulica, etc.).
      2. **Ações Corretivas e Preventivas Recomendadas**: Para cada principal categoria com problemas, defina uma ação clara, o responsável sugerido (Ex: Eletricista, Encanador, Equipe de Apoio, etc.) e o nível de prioridade (BAIXA, MÉDIA, ALTA).
      3. **Cronograma Sugerido**: Frequência ou período ideal de vistorias preventivas para evitar que tais problemas voltem a ocorrer (Ex: Semanal, Mensal, Bimestral).
      4. **Metas de Melhoria**: Indicadores de sucesso para o próximo período (Ex: Redução de 30% em vazamentos, 100% de lâmpadas LED instaladas, etc.).

      Responda estritamente em formato JSON seguindo este esquema:
      {
        \"diagnosis\": \"Diagnóstico resumido e insights...\",
        \"actions\": [
          { \"action\": \"Ação recomendada\", \"category\": \"Categoria da ocorrência relacionada\", \"responsible\": \"Responsável sugerido\", \"priority\": \"ALTA/MEDIA/BAIXA\" }
        ],
        \"preventiveSchedule\": [
          { \"task\": \"Atividade preventiva\", \"frequency\": \"Frequência recomendada (Semanal, Mensal...)\" }
        ],
        \"goals\": [
          { \"description\": \"Descrição da meta\", \"target\": \"Valor/Indicador de sucesso\" }
        ]
      }
      
      Responda em formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  category: { type: Type.STRING },
                  responsible: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["action", "category", "responsible", "priority"]
              }
            },
            preventiveSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  frequency: { type: Type.STRING }
                },
                required: ["task", "frequency"]
              }
            },
            goals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  target: { type: Type.STRING }
                },
                required: ["description", "target"]
              }
            }
          },
          required: ["diagnosis", "actions", "preventiveSchedule", "goals"]
        },
        temperature: 0.2
      }
    }));

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Erro ao gerar plano de ação via IA", e);
    return null;
  }
};

/**
 * Redação Inteligente por IA para Corpo de Ofícios Escolares (SEDUC-MT / Redação Oficial)
 */
export const generateOficioBodyWithAI = async ({
  promptText,
  subject,
  recipient,
  tone = 'SOLICITACAO'
}: {
  promptText: string;
  subject?: string;
  recipient?: string;
  tone?: 'SOLICITACAO' | 'CONVOCACAO' | 'NOTIFICACAO' | 'INFORMATIVO' | 'ENCAMINHAMENTO';
}): Promise<string> => {
  const ai = getAIClient();

  if (!ai) {
    return generateFallbackOficioText(promptText, subject, recipient, tone);
  }

  const systemInstruction = `Você é um especialista em Redação Oficial de Correspondência Pública e Atos Administrativos Escolares no Brasil, atuando na Escola Estadual Cívico-Militar André Antônio Maggi (SEDUC-MT).
Seu objetivo é redigir o CORPO DO TEXTO de um Ofício oficial com base nas informações fornecidas pelo usuário.

Diretrizes obrigatórias de redação:
1. Siga o Padrão Oficial de Redação da Presidência da República e da Secretaria de Estado de Educação de Mato Grosso (SEDUC-MT).
2. Utilize linguagem formal, culta, impessoal, clara, objetiva e respeitosa.
3. Organize o texto em 2 a 4 parágrafos bem definidos, separados por duas quebras de linha (\\n\\n).
4. O primeiro parágrafo deve introduzir o motivo/assunto do ofício com clareza.
5. O(s) parágrafo(s) intermediário(s) deve(m) detalhar as justificativas, fundamentação normativa ou contexto escolar.
6. O último parágrafo deve apresentar o pedido, encaminhamento ou expectativa de providências com cortesia oficial.
7. Retorne APENAS o corpo do texto do ofício (não inclua cabeçalho, número, data, vocativo inicial como "Prezado Senhor", nem assinaturas, pois esses elementos são renderizados separadamente no documento).`;

  const prompt = `Gere o corpo do texto para um ofício oficial com os seguintes dados:
- Ideia principal / Rascunho informado: "${promptText}"
- Assunto: "${subject || 'Não especificado'}"
- Destinatário: "${recipient || 'Órgão / Autoridade Competente'}"
- Tipo/Tom do Ofício: "${tone}"`;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    }));

    const resultText = response.text?.trim();
    if (resultText) return resultText;
    return generateFallbackOficioText(promptText, subject, recipient, tone);
  } catch (err) {
    console.warn("Erro ao gerar ofício por IA via Gemini, usando gerador estruturado:", err);
    return generateFallbackOficioText(promptText, subject, recipient, tone);
  }
};

const generateFallbackOficioText = (
  promptText: string,
  subject?: string,
  recipient?: string,
  tone?: string
): string => {
  const cleanPrompt = promptText.trim() || 'tratar de assuntos de interesse desta Unidade Escolar';
  const cleanSubject = subject ? `referente a ${subject}` : '';

  if (tone === 'CONVOCACAO') {
    return `Cumprimentando-o(a) cordialmente, vimos por meio deste solicitar a presença de Vossa Senhoria junto a esta Unidade Escolar para ${cleanPrompt} ${cleanSubject}.\n\nRessaltamos a extrema importância do comparecimento para o devido acompanhamento das demandas institucionais e pedagógicas dos nossos estudantes.\n\nCertos de podermos contar com vossa habitual atenção e presteza, renovamos nossos protestos de elevada estima e consideração.`;
  }
  if (tone === 'NOTIFICACAO') {
    return `Servimo-nos do presente para notificar Vossa Senhoria acerca dos fatos pertinentes a ${cleanPrompt} ${cleanSubject}, ocorridos no âmbito da Escola Estadual Cívico-Militar André Antônio Maggi.\n\nDiante da gravidade da situação, solicitamos a imediata adoção das medidas cabíveis para a regularização do cenário apresentado, em conformidade com as normas vigentes.\n\nPermanecemos à disposição para eventuais esclarecimentos complementares.`;
  }
  if (tone === 'ENCAMINHAMENTO') {
    return `Encaminhamos a Vossa Excelência os relatórios e documentos anexos para análise e providências cabíveis no que tange a ${cleanPrompt} ${cleanSubject}.\n\nReiteramos a necessidade de urgência na apreciação da referida demanda, visando assegurar a continuidade dos serviços prestados à comunidade escolar.\n\nAproveitamos a oportunidade para renovar nossos votos de consideração e apreço.`;
  }

  return `Vimos por meio deste apresentar a Vossa Senhoria as solicitações e justificativas pertinentes a ${cleanPrompt} ${cleanSubject}, no âmbito desta Unidade Escolar.\n\nSalientamos que tais providências são indispensáveis para garantir a adequada infraestrutura, a segurança e a continuidade dos trabalhos administrativos e pedagógicos da instituição.\n\nContamos com a presteza de vossas providências e colocamo-nos à inteira disposição para prestar quaisquer esclarecimentos complementares.`;
};

/**
 * Redação Inteligente por IA para Atas Escolares Oficiais (SEDUC-MT / Redação de Atas Públicas)
 */
export const generateAtaWithAI = async ({
  promptText,
  pauta,
  category = 'GERAL',
  location = 'Escola Estadual Cívico-Militar André Antônio Maggi',
  date,
  participants = [],
  tone = 'PADRAO'
}: {
  promptText: string;
  pauta?: string;
  category?: string;
  location?: string;
  date?: string;
  participants?: string[];
  tone?: 'PADRAO' | 'DISCIPLINAR' | 'PEDAGOGICO' | 'CONCILIADOR' | 'DELIBERATIVO';
}): Promise<{
  objectives: string;
  deliberations: string;
  forwarding: string;
}> => {
  const ai = getAIClient();

  if (!ai) {
    return generateFallbackAtaText(promptText, pauta, category, location, date, participants, tone);
  }

  const systemInstruction = `Você é um secretário executivo e especialista em Redação Oficial de Atos Administrativos e Atas Escolares Públicas no Brasil, atuando na Escola Estadual Cívico-Militar André Antônio Maggi (SEDUC-MT).
Seu objetivo é redigir o TEXTO CORRIDO UNIFICADO do corpo de uma Ata de Reunião Oficial com base nos apontamentos fornecidos.

Diretrizes obrigatórias de redação de Atas:
1. Siga rigorosamente as normas de redação oficial da SEDUC-MT e da administração pública.
2. Utilize linguagem formal, culta, impessoal, no pretérito perfeito (ex: "reuniram-se", "foi exposto", "foi deliberado", "ficou acordado").
3. Unifique em um único texto corrido (dividido em parágrafos fluidos e bem estruturados):
   - A finalidade/objetivo da reunião;
   - O relato detalhado dos fatos, discussões e manifestações dos presentes;
   - As deliberações, encaminhamentos, prazos e compromissos firmados.
4. Não inclua cabeçalho de data/hora inicial nem fecho de encerramento ("Nada mais havendo a tratar..."), pois o sistema já insere a abertura e o encerramento oficiais automaticamente.
5. Retorne sua resposta OBRIGATORIAMENTE em formato JSON com a chave "deliberations" contendo o texto corrido completo (e deixe "objectives" e "forwarding" vazios "").`;

  const prompt = `Elabore o texto corrido unificado da Ata Oficial com as seguintes informações:
- Pauta / Assunto: "${pauta || 'Não especificado'}"
- Categoria da Reunião: "${category}"
- Local: "${location}"
- Data: "${date || 'Hoje'}"
- Participantes presentes: "${participants.join(', ') || 'Equipe escolar e interessados'}"
- Rascunho / Apontamentos dos fatos, objetivos e encaminhamentos: "${promptText}"
- Tom / Foco: "${tone}"

Retorne um objeto JSON válido no formato: { "objectives": "", "deliberations": "Texto corrido completo em parágrafos...", "forwarding": "" }.`;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    }));

    const resultText = response.text?.trim();
    if (resultText) {
      const parsed = JSON.parse(resultText);
      const unifiedText = [parsed.objectives, parsed.deliberations, parsed.forwarding]
        .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .join('\n\n');
      return {
        objectives: '',
        deliberations: unifiedText || '',
        forwarding: ''
      };
    }
    return generateFallbackAtaText(promptText, pauta, category, location, date, participants, tone);
  } catch (err) {
    console.warn("Erro ao gerar ata por IA via Gemini, usando gerador estruturado:", err);
    return generateFallbackAtaText(promptText, pauta, category, location, date, participants, tone);
  }
};

const generateFallbackAtaText = (
  promptText: string,
  pauta?: string,
  category?: string,
  location?: string,
  date?: string,
  participants: string[] = [],
  tone?: string
): { objectives: string; deliberations: string; forwarding: string; } => {
  const cleanPauta = pauta || 'Alinhamento Institucional e Acompanhamento Escolar';
  const cleanPrompt = promptText.trim() || 'tratar dos assuntos pertinentes ao bom andamento das atividades escolares e disciplinares.';

  const introParagraph = `A presente sessão teve por finalidade deliberar acerca da pauta "${cleanPauta}", promovendo o alinhamento institucional e os encaminhamentos cabíveis entre a equipe gestora da Unidade Escolar e os demais participantes presentes.`;

  let middleParagraph = `Durante a reunião, foram expostos e debatidos os seguintes fatos e apontamentos: ${cleanPrompt}\n\nApós ampla análise e manifestação dos presentes, reiterou-se a importância do cumprimento integral das diretrizes pedagógicas e regimentais da Escola Estadual Cívico-Militar André Antônio Maggi e da SEDUC-MT, zelando pelo respeito mútuo, assiduidade e compromisso com o processo educativo.`;

  if (category === 'DISCIPLINAR' || category === 'CIVICO_MILITAR') {
    middleParagraph = `Em sede de alinhamento disciplinar e comportamental, foram apresentados aos presentes os registros e relatórios relativos à conduta discente e às normas da Escola Cívico-Militar, registrando-se que: ${cleanPrompt}\n\nOs responsáveis legais e o(a) estudante foram formalmente orientados e cientificados quanto aos deveres regimentais, firmando-se compromisso conjunto entre família e escola para o acompanhamento contínuo e a imediata adequação de conduta.`;
  } else if (category === 'CONSELHO_CLASSE' || category === 'PEDAGOGICO') {
    middleParagraph = `No âmbito do acompanhamento pedagógico, procedeu-se à análise do desempenho escolar, frequência e participação discente, destacando-se que: ${cleanPrompt}\n\nDeliberou-se pela adoção de estratégias conjuntas de intervenção pedagógica, acompanhamento sistemático das atividades escolares e fortalecimento da parceria entre a equipe escolar e a família.`;
  }

  const closingForwarding = `Como encaminhamentos finais e compromissos firmados na presente sessão, ficaram estabelecidos o registro formal das deliberações para acompanhamento pelos setores competentes da Unidade Escolar e a reavaliação periódica dos resultados alcançados.`;

  return {
    objectives: '',
    deliberations: `${introParagraph}\n\n${middleParagraph}\n\n${closingForwarding}`,
    forwarding: ''
  };
};

