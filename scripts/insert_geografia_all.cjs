const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
EF06GE01 | O sujeito e seu lugar no mundo. Identidade sociocultural | Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.
EF06GE02 | O sujeito e seu lugar no mundo. Identidade sociocultural | Analisar modificações de paisagens por diferentes tipos de sociedade, com destaque para os povos originários.
EF06GE03 | Conexões e escalas. Relações entre os componentes físico-naturais | Descrever os movimentos do planeta e sua relação com a circulação geral da atmosfera, o tempo atmosférico e os padrões climáticos.
EF06GE04 | Conexões e escalas. Relações entre os componentes físico-naturais | Descrever o ciclo da água, comparando o escoamento superficial no ambiente urbano e rural, reconhecendo os principais componentes da morfologia das bacias e das redes hidrográficas e a sua localização no modelado da superfície terrestre e da cobertura vegetal.
EF06GE05 | Conexões e escalas. Relações entre os componentes físico-naturais | Relacionar padrões climáticos, tipos de solo, relevo e formações vegetais.
EF06GE06 | Mundo do trabalho. Transformação das paisagens naturais e antrópicas | Identificar as características das paisagens transformadas pelo trabalho humano a partir do desenvolvimento da agropecuária e do processo de industrialização.
EF06GE07 | Mundo do trabalho. Transformação das paisagens naturais e antrópicas | Explicar as mudanças na interação humana com a natureza a partir do surgimento das cidades.
EF06GE08 | Formas de representação e pensamento espacial. Fenômenos naturais e sociais representados de diferentes maneiras | Medir distâncias na superfície pelas escalas gráficas e numéricas dos mapas.
EF06GE09 | Formas de representação e pensamento espacial. Fenômenos naturais e sociais representados de diferentes maneiras | Elaborar modelos tridimensionais, blocos-diagramas e perfis topográficos e de vegetação, visando à representação de elementos e estruturas da superfície terrestre.
EF06GE10 | Natureza, ambientes e qualidade de vida. Biodiversidade e ciclo hidrológico | Explicar as diferentes formas de uso do solo (rotação de terras, terraceamento, aterros etc.) e de apropriação dos recursos hídricos (sistema de irrigação, tratamento e redes de distribuição), bem como suas vantagens e desvantagens em diferentes épocas e lugares.
EF06GE11 | Natureza, ambientes e qualidade de vida. Biodiversidade e ciclo hidrológico | Analisar distintas interações das sociedades com a natureza, com base na distribuição dos componentes físico-naturais, incluindo as transformações da biodiversidade local e do mundo.
EF06GE12 | Natureza, ambientes e qualidade de vida. Biodiversidade e ciclo hidrológico | Identificar o consumo dos recursos hídricos e o uso das principais bacias hidrográficas no Brasil e no mundo, enfatizando as transformações nos ambientes urbanos.
EF06GE13 | Natureza, ambientes e qualidade de vida. Atividades humanas e dinâmica climática | Analisar consequências, vantagens e desvantagens das práticas humanas na dinâmica climática (ilha de calor etc.).
EF07GE01 | O sujeito e seu lugar no mundo. Ideias e concepções sobre a formação territorial do Brasil | Avaliar, por meio de exemplos extraídos dos meios de comunicação, ideias e estereótipos acerca das paisagens e da formação territorial do Brasil.
EF07GE02 | Conexões e escalas. Formação territorial do Brasil | Analisar a influência dos fluxos econômicos e populacionais na formação socioeconômica e territorial do Brasil, compreendendo os conflitos e as tensões históricas e contemporâneas.
EF07GE03 | Conexões e escalas. Formação territorial do Brasil | Selecionar argumentos que reconheçam as territorialidades dos povos indígenas originários, das comunidades remanescentes de quilombos, de povos das florestas e do cerrado, de ribeirinhos e caiçaras, entre outros grupos sociais do campo e da cidade, como direitos legais dessas comunidades.
EF07GE04 | Conexões e escalas. Características da população brasileira | Analisar a distribuição territorial da população brasileira, considerando a diversidade étnico-cultural (indígena, africana, europeia e asiática), assim como aspectos de renda, sexo e idade nas regiões brasileiras.
EF07GE05 | Mundo do trabalho. Produção, circulação e consumo de mercadorias | Analisar fatos e situações representativas das alterações ocorridas entre o período mercantilista e o advento do capitalismo.
EF07GE06 | Mundo do trabalho. Produção, circulação e consumo de mercadorias | Discutir em que medida a produção, a circulação e o consumo de mercadorias provocam impactos ambientais, assim como influem na distribuição de riquezas, em diferentes lugares.
EF07GE07 | Mundo do trabalho. Desigualdade social e o trabalho | Analisar a influência e o papel das redes de transporte e comunicação na configuração do território brasileiro.
EF07GE08 | Mundo do trabalho. Desigualdade social e o trabalho | Estabelecer relações entre os processos de industrialização e inovação tecnológica com as transformações socioeconômicas do território brasileiro.
EF07GE09 | Formas de representação e pensamento espacial. Mapas temáticos do Brasil | Interpretar e elaborar mapas temáticos e históricos, inclusive utilizando tecnologias digitais, com informações demográficas e econômicas do Brasil (cartogramas), identificando padrões espaciais, regionalizações e analogias espaciais.
EF07GE10 | Formas de representação e pensamento espacial. Mapas temáticos do Brasil | Elaborar e interpretar gráficos de barras, gráficos de setores e histogramas, com base em dados socioeconômicos das regiões brasileiras.
EF07GE11 | Natureza, ambientes e qualidade de vida. Biodiversidade brasileira | Caracterizar dinâmicas dos componentes físico-naturais no território nacional, bem como sua distribuição e biodiversidade (Florestas Tropicais, Cerrados, Caatingas, Campos Sulinos e Matas de Araucária).
EF07GE12 | Natureza, ambientes e qualidade de vida. Biodiversidade brasileira | Comparar unidades de conservação existentes no Município de residência e em outras localidades brasileiras, com base na organização do Sistema Nacional de Unidades de Conservação (SNUC).
EF08GE01 | O sujeito e seu lugar no mundo. Distribuição da população mundial e deslocamentos populacionais | Descrever as rotas de dispersão da população humana pelo planeta e os principais fluxos migratórios em diferentes períodos da história, discutindo os fatores históricos e condicionantes físico-naturais associados à distribuição da população humana pelos continentes.
EF08GE02 | O sujeito e seu lugar no mundo. Diversidade e dinâmica da população mundial e local | Relacionar fatos e situações representativas da história das famílias do Município em que se localiza a escola, considerando a diversidade e os fluxos migratórios da população mundial.
EF08GE03 | O sujeito e seu lugar no mundo. Diversidade e dinâmica da população mundial e local | Analisar aspectos representativos da dinâmica demográfica, considerando características da população (perfil etário, crescimento vegetativo e mobilidade espacial).
EF08GE04 | O sujeito e seu lugar no mundo. Diversidade e dinâmica da população mundial e local | Compreender os fluxos de migração na América Latina (movimentos voluntários e forçados, assim como fatores e áreas de expulsão e atração) e as principais políticas migratórias da região.
EF08GE05 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Aplicar os conceitos de Estado, nação, território, governo e país para o entendimento de conflitos e tensões na contemporaneidade, com destaque para as situações geopolíticas na América e na África e suas múltiplas regionalizações a partir do pós-guerra.
EF08GE06 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Analisar a atuação das organizações mundiais nos processos de integração cultural e econômica nos contextos americano e africano, reconhecendo, em seus lugares de vivência, marcas desses processos.
EF08GE07 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Analisar os impactos geoeconômicos, geoestratégicos e geopolíticos da ascensão dos Estados Unidos da América no cenário internacional em sua posição de liderança global e na relação com a China e o Brasil.
EF08GE08 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Analisar a situação do Brasil e de outros países da América Latina e da África, assim como da potência estadunidense na ordem mundial do pós-guerra.
EF08GE09 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Analisar os padrões econômicos mundiais de produção, distribuição e intercâmbio dos produtos agrícolas e industrializados, tendo como referência os Estados Unidos da América e os países denominados de Brics (Brasil, Rússia, Índia, China e África do Sul).
EF08GE10 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Distinguir e analisar conflitos e ações dos movimentos sociais brasileiros, no campo e na cidade, comparando com outros movimentos sociais existentes nos países latino-americanos.
EF08GE11 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Analisar áreas de conflito e tensões nas regiões de fronteira do continente latino-americano e o papel de organismos internacionais e regionais de cooperação nesses cenários.
EF08GE12 | Conexões e escalas. Corporações e organismos internacionais e do Brasil na ordem econômica mundial | Compreender os objetivos e analisar a importância dos organismos de integração do território americano (Mercosul, OEA, OEI, Nafta, Unasul, Alba, Comunidade Andina, Aladi, entre outros).
EF08GE13 | Mundo do trabalho. Os diferentes contextos e os meios técnico e tecnológico na produção | Analisar a influência do desenvolvimento científico e tecnológico na caracterização dos tipos de trabalho e na economia dos espaços urbanos e rurais da América e da África.
EF08GE14 | Mundo do trabalho. Os diferentes contextos e os meios técnico e tecnológico na produção | Analisar os processos de desconcentração, descentralização e recentralização das atividades econômicas a partir do capital estadunidense e chinês em diferentes regiões no mundo, com destaque para o Brasil.
EF08GE15 | Mundo do trabalho. Transformações do espaço na sociedade urbano-industrial na América Latina | Analisar a importância dos principais recursos hídricos da América Latina (Aquífero Guarani, Bacias do rio da Prata, do Amazonas e do Orinoco, sistemas de nuvens na Amazônia e nos Andes, entre outros) e discutir os desafios relacionados à gestão e comercialização da água.
EF08GE16 | Mundo do trabalho. Transformações do espaço na sociedade urbano-industrial na América Latina | Analisar as principais problemáticas comuns às grandes cidades latino-americanas, particularmente aquelas relacionadas à distribuição, estrutura e dinâmica da população e às condições de vida e trabalho.
EF08GE17 | Mundo do trabalho. Transformações do espaço na sociedade urbano-industrial na América Latina | Analisar a segregação socioespacial em ambientes urbanos da América Latina, com atenção especial ao estudo de favelas, alagados e zona de riscos.
EF08GE18 | Formas de representação e pensamento espacial. Cartografia: anamorfose, croquis e mapas temáticos da América e África | Elaborar mapas ou outras formas de representação cartográfica para analisar as redes e as dinâmicas urbanas e rurais, ordenamento territorial, contextos culturais, modo de vida e usos e ocupação de solos da África e América.
EF08GE19 | Formas de representação e pensamento espacial. Cartografia: anamorfose, croquis e mapas temáticos da América e África | Interpretar cartogramas, mapas esquemáticos (croquis) e anamorfoses geográficas com informações geográficas acerca da África e América.
EF08GE20 | Natureza, ambientes e qualidade de vida. Identidades e interculturalidades regionais: Estados Unidos da América, América espanhola e portuguesa e África | Analisar características de países e grupos de países da América e da África no que se refere aos aspectos populacionais, urbanos, políticos e econômicos, e discutir as desigualdades sociais e econômicas e as pressões sobre a natureza e suas riquezas (sua apropriação e valoração na produção e circulação), o que resulta na espoliação desses povos.
EF08GE21 | Natureza, ambientes e qualidade de vida. Identidades e interculturalidades regionais: Estados Unidos da América, América espanhola e portuguesa e África | Analisar o papel ambiental e territorial da Antártica no contexto geopolítico, sua relevância para os países da América do Sul e seu valor como área destinada à pesquisa e à compreensão do ambiente global.
EF08GE22 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na América Latina | Identificar os principais recursos naturais dos países da América Latina, analisando seu uso para a produção de matéria-prima e energia e sua relevância para a cooperação entre os países do Mercosul.
EF08GE23 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na América Latina | Identificar paisagens da América Latina e associá-las, por meio da cartografia, aos diferentes povos da região, com base em aspectos da geomorfologia, da biogeografia e da climatologia.
EF08GE24 | Natureza, ambientes e qualidade de vida. Diversidade ambiental e as transformações nas paisagens na América Latina | Analisar as principais características produtivas dos países latino-americanos (como exploração mineral na Venezuela; agricultura de alta especialização e exploração mineira no Chile; circuito da carne nos pampas argentinos e no Brasil; circuito da cana-de-açúcar em Cuba; polígono industrial do sudeste brasileiro e plantações de soja no centro-oeste; maquiladoras mexicanas, entre outros).
EF09GE01 | O sujeito e seu lugar no mundo. A hegemonia europeia na economia, na política e na cultura | Analisar criticamente de que forma a hegemonia europeia foi exercida em várias regiões do planeta, notadamente em situações de conflito, intervenções militares e/ou influência cultural em diferentes tempos e lugares.
EF09GE02 | O sujeito e seu lugar no mundo. Corporações e organismos internacionais | Analisar a atuação das corporações internacionais e das organizações econômicas mundiais na vida da população em relação ao consumo, à cultura e à mobilidade.
EF09GE03 | O sujeito e seu lugar no mundo. As manifestações culturais na formação populacional | Identificar diferentes manifestações culturais de minorias étnicas como forma de compreender a multiplicidade cultural na escala mundial, defendendo o princípio do respeito às diferenças.
EF09GE04 | O sujeito e seu lugar no mundo. As manifestações culturais na formação populacional | Relacionar diferenças de paisagens aos modos de viver de diferentes povos na Europa, Ásia e Oceania, valorizando identidades e interculturalidades regionais.
EF09GE05 | Conexões e escalas. Integração mundial e suas interpretações: globalização e mundialização | Analisar fatos e situações para compreender a integração mundial (econômica, política e cultural), comparando as diferentes interpretações: globalização e mundialização.
EF09GE06 | Conexões e escalas. A divisão do mundo em Ocidente e Oriente | Associar o critério de divisão do mundo em Ocidente e Oriente com o Sistema Colonial implantado pelas potências europeias.
EF09GE07 | Conexões e escalas. Intercâmbios históricos e culturais entre Europa, Ásia e Oceania | Analisar os componentes físico-naturais da Eurásia e os determinantes histórico-geográficos de sua divisão em Europa e Ásia.
EF09GE08 | Conexões e escalas. Intercâmbios históricos e culturais entre Europa, Ásia e Oceania | Analisar transformações territoriais, considerando o movimento de fronteiras, tensões, conflitos e múltiplas regionalidades na Europa, na Ásia e na Oceania.
EF09GE09 | Conexões e escalas. Intercâmbios históricos e culturais entre Europa, Ásia e Oceania | Analisar características de países e grupos de países europeus, asiáticos e da Oceania em seus aspectos populacionais, urbanos, políticos e econômicos, e discutir suas desigualdades sociais e econômicas e pressões sobre seus ambientes físico-naturais.
EF09GE10 | Mundo do trabalho. Transformações do espaço na sociedade urbano-industrial | Analisar os impactos do processo de industrialização na produção e circulação de produtos e culturas na Europa, na Ásia e na Oceania.
EF09GE11 | Mundo do trabalho. Transformações do espaço na sociedade urbano-industrial | Relacionar as mudanças técnicas e científicas decorrentes do processo de industrialização com as transformações no trabalho em diferentes regiões do mundo e suas consequências no Brasil.
EF09GE12 | Mundo do trabalho. Cadeias industriais e inovação no uso dos recursos naturais e matérias-primas | Relacionar o processo de urbanização às transformações da produção agropecuária, à expansão do desemprego estrutural e ao papel crescente do capital financeiro em diferentes países, com destaque para o Brasil.
EF09GE13 | Mundo do trabalho. Cadeias industriais e inovação no uso dos recursos naturais e matérias-primas | Analisar a importância da produção agropecuária na sociedade urbano-industrial ante o problema da desigualdade mundial de acesso aos recursos alimentares e à matéria-prima.
`;

async function importSkills() {
    const lines = rawData.trim().split('\n');
    const skillsToInsert = [];
    for (let line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            const code = parts[0];
            const knowledgeObject = parts[1];
            const description = parts.slice(2).join(' | ');
            const yearMatch = code.match(/EF(\d{2})/);
            const year_range = yearMatch ? "EF" + yearMatch[1] : "EF00";
            const fullDescription = "[Objeto de Conhecimento: " + knowledgeObject + "] " + description;

            skillsToInsert.push({ code, description: fullDescription, subject: "GEOGRAFIA", year_range });
        }
    }
    if (skillsToInsert.length === 0) { console.log("Nenhuma habilidade encontrada."); return; }
    console.log("Preparando para inserir " + skillsToInsert.length + " habilidades...");
    const { data: result, error } = await supabase.from('bncc_skills').upsert(skillsToInsert, { onConflict: 'code' }).select();
    if (error) { console.error("Erro na inserção:", error); }
    else { console.log("Sucesso! Foram inseridas/atualizadas " + (result ? result.length : 0) + " habilidades!"); }
}
importSkills();
