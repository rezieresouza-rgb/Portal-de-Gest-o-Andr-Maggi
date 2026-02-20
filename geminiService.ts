
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  // Safe access to environment variables in Vite/Next.js/Node
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  const metaEnv = (import.meta as any).env || {};

  const apiKey = metaEnv.VITE_GEMINI_API_KEY || processEnv.NEXT_PUBLIC_GEMINI_API_KEY || processEnv.API_KEY || '';

  if (!apiKey) console.warn("Gemini API Key not found! Features utilizing AI will fail.");
  return new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
};

// Retry helper for 429 errors
const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit =
      error.code === 429 ||
      error.status === 429 ||
      (error.message && error.message.includes('429')) ||
      (error.message && error.message.includes('Resource exhausted'));

    if (retries > 0 && isRateLimit) {
      console.warn(`[AI] Quota exceeded (429). Retrying in ${delay / 1000}s... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

/**
 * Extrai lista detalhada de alunos de um PDF da Secretaria.
 */
export const extractDetailedStudentList = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
      model: 'gemini-2.0-flash',
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

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Você é um bibliotecário especialista. Com base nos interesses: "${readerInterests}", sugira 3 livros clássicos ou contemporâneos adequados para idade escolar. Forneça o título, autor e um pequeno motivo da recomendação. Responda em Português do Brasil.`,
    }));
    return response.text;
  } catch (e) {
    console.error("Error suggesting books", e);
    return "Erro ao gerar sugestões.";
  }
};

/**
 * Analisa a saúde de um contrato usando IA.
 */
export const analyzeContractHealth = async (contractData: any) => {
  const ai = getAIClient();
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analise o seguinte contrato de merenda escolar e forneça um resumo de saúde (riscos, prazos, custo-benefício): ${JSON.stringify(contractData)}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    }));
    return response.text;
  } catch (e) {
    console.error("Error analyzing contract", e);
    return "Erro na análise.";
  }
};

/**
 * Sugere um cardápio com base no estoque atual.
 */
export const suggestMenu = async (inventory: any) => {
  const ai = getAIClient();
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Com base no estoque atual de merenda escolar: ${JSON.stringify(inventory)}, sugira um cardápio semanal nutricionalmente equilibrado focando em reduzir desperdício de itens próximos do vencimento ou em excesso. Responda em Português do Brasil.`,
    }));
    return response.text;
  } catch (e) {
    console.error("Error suggesting menu", e);
    return "Erro ao gerar cardápio.";
  }
};

/**
 * Busca a LISTA COMPLETA de Habilidades BNCC/DRC-MT para o Roteiro
 */
export const fetchPedagogicalSkills = async (subject: string, className: string) => {
  const ai = getAIClient();
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Você é um consultor pedagógico sênior especialista em gestão educacional da rede SEDUC-MT.
      Analise os seguintes dados pedagógicos da unidade escolar e forneça um relatório estratégico de insights e plano de intervenção.
      Dados: ${JSON.stringify(data)}
      O relatório deve focar em:
      1. Disparidades entre avaliações internas e externas (CAED/Estruturado).
      2. Alertas de turmas com alta taxa de notas abaixo da média.
      3. Recomendações baseadas nas observações de aula.
      4. Sugestões de melhoria para os roteiros pedagógicos.
      Responda em Português do Brasil de forma executiva e profissional.`,
    }));
    return response.text;
  } catch (e) {
    console.error("Error analyzing performance", e);
    return "Erro na análise.";
  }
};
/**
 * Gera uma sugestão de horário escolar usando IA.
 */
export const generateClassSchedule = async (classInfo: any, teachers: any[], validSlots?: string[]) => {
  console.log("AI Prompt Teachers:", JSON.stringify(teachers));
  const ai = getAIClient();

  // Use provided slots or default, but EXTRACT START TIMES for AI prompt validation to ensure consistency
  const slotsToUse = validSlots?.filter(s => !s.includes('Recreio')) || ['07:00', '07:50', '08:40', '09:50', '10:40'];
  // We provide the FULL string to the prompt so it knows the context, but we will accept fuzzy matches
  const formattedSlots = slotsToUse.join(', ');

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Você é um coordenador pedagógico especialista em montagem de grades horárias (Cronos).
      
      Tarefa: Criar uma grade horária semanal para a turma ${classInfo.name} (${classInfo.shift}).
      
      Restrições:
      1. A grade deve ter 5 aulas por dia (Segunda a Sexta).
      2. Horários das Aulas: ${formattedSlots}.
      3. Distribua as disciplinas de forma equilibrada (Português e Matemática todos os dias se possível).
      4. Use APENAS os professores fornecidos na lista abaixo, respeitando suas disciplinas.
      
      Lista de Professores Disponíveis:
      ${JSON.stringify(teachers)}
      
      Disciplinas Obrigatórias (USE A GRAFIA EXATA): PORTUGUÊS, MATEMÁTICA, HISTÓRIA, GEOGRAFIA, CIÊNCIAS, ARTE, ED. FÍSICA, INGLÊS, ENSINO RELIGIOSO, PROJETO DE VIDA.
      
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Você é um especialista em educação e análise de dados pedagógicos (CAED/Sistema Estruturado).
      
      Analise os resultados desta avaliação externa:
      - Disciplina: ${assessmentData.subject}
      - Turma: ${assessmentData.className}
      - Bimestre: ${assessmentData.bimestre}
      - Média da Turma: ${assessmentData.averageScore}%
      - Alunos com Baixo Desempenho (<60%): ${JSON.stringify(assessmentData.lowPerformers)}
      
      Gere um PARECER TÉCNICO PEDAGÓGICO curto e direto contendo:
      1. **Diagnóstico**: Identifique prováveis lacunas de aprendizagem.
      2. **Ação Imediata**: Sugira 2 metodologias ativas para aplicar em sala de aula visando corrigir essas lacunas.
      3. **Descritores/Habilidades**: Cite quais habilidades da BNCC provavelmente precisam ser retomadas.
      
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
  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
