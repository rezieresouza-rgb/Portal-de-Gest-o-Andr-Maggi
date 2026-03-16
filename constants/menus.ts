
export interface MenuItem {
  day: string;
  dish: string;
  entradaDish?: string;
  entradaIngredients?: string[];
  ingredients: string[];
}

export interface WeeklyMenu {
  week: number;
  label: string;
  days: MenuItem[];
}

export const OFFICIAL_MENUS: WeeklyMenu[] = [
  {
    week: 1,
    label: "1ª SEMANA",
    days: [
      { 
        day: "Segunda", 
        dish: "SALADA DE ALFACE COM TOMATE, MACARRÃO COM MOLHO DE CARNE MOÍDA", 
        entradaDish: "ABACAXI",
        entradaIngredients: ["ABACAXI"],
        ingredients: ["ALFACE", "ALHO", "CARNE BOVINA MOÍDA", "CEBOLA", "CEBOLINHA", "EXTRATO DE TOMATE", "LIMÃO", "MACARRÃO", "ÓLEO DE SOJA", "PIMENTÃO", "SAL", "SALSA", "TOMATE"] 
      },
      { 
        day: "Terça", 
        dish: "FRICASSÊ DE FRANGO COM ABÓBORA E ARROZ", 
        entradaDish: "PÃO COM QUEIJO MUÇARELA E SUCO DE POLPA DE FRUTA",
        entradaIngredients: ["AÇÚCAR CRISTAL", "PÃO FRANCÊS", "POLPA DE FRUTA", "QUEIJO MUÇARELA"],
        ingredients: ["ABÓBORA", "ALHO", "AMIDO DE MILHO", "ARROZ BRANCO", "CEBOLA", "CEBOLINHA", "COLORAU", "FILÉ DE PEITO DE FRANGO", "LEITE", "ÓLEO DE SOJA", "PIMENTÃO", "QUEIJO MUÇARELA", "SAL"] 
      },
      { 
        day: "Quarta", 
        dish: "SALADA DE REPOLHO COM COUVE, ARROZ COM CARNE SUÍNA E FEIJÃO", 
        entradaDish: "MAÇÃ",
        entradaIngredients: ["MAÇÃ"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CARNE SUÍNA", "CEBOLA", "CEBOLINHA", "COUVE", "FEIJÃO CARIOCA", "LIMÃO", "ÓLEO DE SOJA", "REPOLHO", "SAL", "SALSA"] 
      },
      { 
        day: "Quinta", 
        dish: "ESTROGONOFE DE CARNE E ARROZ", 
        entradaDish: "BOLO DE CHOCOLATE E CHÁ",
        entradaIngredients: ["AÇÚCAR CRISTAL", "CACAU EM PÓ", "CHÁ MATE", "FARINHA DE TRIGO", "FERMENTO QUÍMICO", "ÓLEO DE SOJA", "OVO DE GALINHA"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CARNE BOVINA ISCAS", "CEBOLA", "CEBOLINHA", "EXTRATO DE TOMATE", "FARINHA DE TRIGO", "LEITE", "MANTEIGA", "ÓLEO DE SOJA", "SAL", "SALSA"] 
      },
      { 
        day: "Sexta", 
        dish: "FRANGO AO MOLHO COM BATATA E CENOURA, ARROZ, FEIJÃO", 
        entradaDish: "MELÃO",
        entradaIngredients: ["MELÃO"],
        ingredients: ["ALHO", "ARROZ BRANCO", "BATATA INGLESA", "CEBOLA", "CEBOLINHA", "CENOURA", "COLORAU", "FEIJÃO CARIOCA", "FILÉ DE PEITO DE FRANGO", "ÓLEO DE SOJA", "PIMENTÃO", "SAL", "SALSA"] 
      }
    ]
  },
  {
    week: 2,
    label: "2ª SEMANA",
    days: [
      { 
        day: "Segunda", 
        dish: "SALADA DE COUVE COM TOMATE, ESTROGONOFE DE FRANGO E ARROZ", 
        entradaDish: "MAMÃO",
        entradaIngredients: ["MAMÃO"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CEBOLA", "CEBOLINHA", "COUVE", "EXTRATO DE TOMATE", "FARINHA DE TRIGO", "FILÉ DE PEITO DE FRANGO", "LEITE", "MANTEIGA", "ÓLEO DE SOJA", "SAL", "TOMATE", "VINAGRE"] 
      },
      { 
        day: "Terça", 
        dish: "SALADA DE ALFACE COM ALMEIRÃO, CARNE COM MANDIOCA, ARROZ E FEIJÃO", 
        entradaDish: "PÃO COM MANTEIGA E LEITE COM CAFÉ",
        entradaIngredients: ["AÇÚCAR CRISTAL", "CAFÉ", "LEITE", "MANTEIGA", "PÃO"],
        ingredients: ["ALFACE", "ALHO", "ALMEIRÃO", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "CEBOLA", "CEBOLINHA", "COLORAU", "FEIJÃO CARIOCA", "MANDIOCA", "ÓLEO DE SOJA", "PIMENTA DE CHEIRO", "SAL", "SALSA", "VINAGRE"] 
      },
      { 
        day: "Quarta", 
        dish: "PEIXE A PARMEGIANA E ARROZ", 
        entradaDish: "MAÇÃ",
        entradaIngredients: ["MAÇÃ"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CEBOLA", "CEBOLINHA", "EXTRATO DE TOMATE", "FARINHA DE ROSCA", "LIMÃO", "ÓLEO DE SOJA", "PEIXE", "PIMENTA DE CHEIRO", "QUEIJO MUÇARELA", "SAL"] 
      },
      { 
        day: "Quinta", 
        dish: "SALADA DE REPOLHO COM RÚCULA, GALINHADA, FAROFA DE BANANA E FEIJÃO", 
        entradaDish: "PÃO COM REQUEIJÃO E SUCO DE POLPA DE FRUTA",
        entradaIngredients: ["AÇÚCAR CRISTAL", "PÃO", "POLPA DE FRUTA", "REQUEIJÃO CREMOSO"],
        ingredients: ["AÇAFRÃO", "ALHO", "ARROZ BRANCO", "BANANA DA TERRA", "CEBOLA", "CEBOLINHA", "FARINHA DE MANDIOCA", "FEIJÃO CARIOCA", "FILÉ DE PEITO DE FRANGO", "LOURO", "ÓLEO DE SOJA", "REPOLHO", "RÚCULA", "SAL", "SALSA", "VINAGRE"] 
      },
      { 
        day: "Sexta", 
        dish: "PICADINHO DE CARNE SUÍNA E ARROZ", 
        entradaDish: "BANANA",
        entradaIngredients: ["BANANA"],
        ingredients: ["ALHO", "ARROZ BRANCO", "BATATA INGLESA", "CARNE SUÍNA", "CEBOLA", "CEBOLINHA", "CENOURA", "COLORAU", "ÓLEO DE SOJA", "SAL", "SALSA"] 
      }
    ]
  },
  {
    week: 3,
    label: "3ª SEMANA",
    days: [
      { 
        day: "Segunda", 
        dish: "RISOTO DE CARNE COM ABÓBORA E FEIJÃO", 
        entradaDish: "MELANCIA",
        entradaIngredients: ["MELANCIA"],
        ingredients: ["ABÓBORA", "ALHO", "ARROZ BRANCO", "CARNE BOVINA MOÍDA", "CEBOLA", "CEBOLINHA", "COLORAU", "FEIJÃO CARIOCA", "ÓLEO DE SOJA", "PIMENTÃO", "SAL", "SALSA"] 
      },
      { 
        day: "Terça", 
        dish: "YAKISSOBA DE FRANGO", 
        entradaDish: "PÃO COM OVOS MEXIDOS E CHÁ",
        entradaIngredients: ["AÇÚCAR CRISTAL", "CHÁ MATE", "ÓLEO DE SOJA", "OVO DE GALINHA", "PÃO", "SAL"],
        ingredients: ["AÇÚCAR CRISTAL", "ALHO", "AMIDO DE MILHO", "BRÓCOLIS", "CEBOLA", "CEBOLINHA", "CENOURA", "COLORAU", "FILÉ DE PEITO DE FRANGO", "MACARRÃO", "ÓLEO DE SOJA", "PIMENTÃO", "SAL", "SALSA"] 
      },
      { 
        day: "Quarta", 
        dish: "SALADA DE RÚCULA COM TOMATE E ARROZ CAIPIRA", 
        entradaDish: "LARANJA",
        entradaIngredients: ["LARANJA"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "CEBOLA", "CEBOLINHA", "CENOURA", "LIMÃO", "MILHO VERDE", "ÓLEO DE SOJA", "RÚCULA", "SAL", "SALSA", "TOMATE"] 
      },
      { 
        day: "Quinta", 
        dish: "SALADA DE REPOLHO COM AGRIÃO, CARNE COM BATATA, ARROZ E FEIJÃO", 
        entradaDish: "BOLO SIMPLES E LEITE COM CACAU",
        entradaIngredients: ["AÇÚCAR CRISTAL", "CACAU EM PÓ", "FARINHA DE TRIGO", "FERMENTO QUÍMICO", "LEITE", "ÓLEO DE SOJA", "OVO DE GALINHA"],
        ingredients: ["AGRIÃO", "ALHO", "ARROZ BRANCO", "BATATA INGLESA", "CARNE BOVINA CUBOS", "CEBOLA", "CEBOLINHA", "COLORAU", "FEIJÃO CARIOCA", "ÓLEO DE SOJA", "PIMENTÃO", "REPOLHO", "SAL", "SALSA", "VINAGRE"] 
      },
      { 
        day: "Sexta", 
        dish: "ESCONDIDINHO DE FRANGO COM BATATA DOCE, ARROZ E FEIJÃO", 
        entradaDish: "ABACAXI",
        entradaIngredients: ["ABACAXI"],
        ingredients: ["ALHO", "ARROZ BRANCO", "BATATA DOCE", "CEBOLA", "CEBOLINHA", "COLORAU", "FEIJÃO CARIOCA", "FILÉ DE PEITO DE FRANGO", "LEITE", "MANTEIGA", "ÓLEO DE SOJA", "PIMENTA DE CHEIRO", "SAL", "SALSA"] 
      }
    ]
  },
  {
    week: 4,
    label: "4ª SEMANA",
    days: [
      { 
        day: "Segunda", 
        dish: "CARNE COM MANDIOCA E ARROZ", 
        entradaDish: "MELÃO",
        entradaIngredients: ["MELÃO"],
        ingredients: ["ALHO", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "CEBOLA", "CEBOLINHA", "COLORAU", "MANDIOCA", "ÓLEO DE SOJA", "PIMENTA DE CHEIRO", "SAL", "SALSA"] 
      },
      { day: "Terça", dish: "FEIJOADA, FAROFA DE COUVE E ARROZ + PÃO COM MANTEIGA E LEITE COM CAFÉ", ingredients: ["FEIJÃO PRETO", "CARNE SUÍNA", "COUVE", "FARINHA DE MANDIOCA", "PÃO", "LEITE", "CAFÉ"] },
      { day: "Quarta", dish: "SALADA DE REPOLHO, PEPINO E RÚCULA, BOBÓ DE FRANGO E ARROZ + BANANA", ingredients: ["REPOLHO", "PEPINO", "RÚCULA", "FILÉ DE PEITO DE FRANGO", "MANDIOCA", "ARROZ BRANCO", "BANANA"] },
      { day: "Quinta", dish: "ESCONDIDINHO DE PEIXE E ARROZ + BOLO DE COCO E SUCO DE POLPA DE FRUTA", ingredients: ["PEIXE", "BATATA INGLESA", "ARROZ BRANCO", "BOLO DE COCO", "POLPA DE FRUTA"] },
      { day: "Sexta", dish: "SALADA DE ALFACE, AGRIÃO E CENOURA, MACARRÃO COM MOLHO DE CARNE MOÍDA E FEIJÃO + MAMÃO", ingredients: ["ALFACE", "AGRIÃO", "CENOURA", "MACARRÃO", "CARNE BOVINA MOÍDA", "FEIJÃO CARIOCA", "MAMÃO"] }
    ]
  },
  {
    week: 5,
    label: "5ª SEMANA",
    days: [
      { day: "Segunda", dish: "CARNE COM BATATA E CENOURA E ARROZ + MELANCIA", ingredients: ["CARNE BOVINA CUBOS", "BATATA INGLESA", "CENOURA", "ARROZ BRANCO", "MELANCIA"] },
      { day: "Terça", dish: "LASANHA DE FRANGO E ARROZ + PÃO DOCE E BEBIDA LÁCTEA", ingredients: ["FILÉ DE PEITO DE FRANGO", "MASSA PARA LASANHA", "QUEIJO MUSSARELA", "LEITE", "PÃO DOCE", "BEBIDA LÁCTEA"] },
      { day: "Quarta", dish: "SALADA DE REPOLHO E RÚCULA, ARROZ COM CARNE E FEIJÃO + MAÇÃ", ingredients: ["REPOLHO", "RÚCULA", "ARROZ BRANCO", "CARNE BOVINA CUBOS", "FEIJÃO CARIOCA", "MAÇÃ"] },
      { day: "Quinta", dish: "SALADA DE ALFACE COM CENOURA, ESTROGONOFE DE CARNE SUÍNA E ARROZ + PÃO COM REQUEIJÃO E LEITE COM CACAU", ingredients: ["ALFACE", "CENOURA", "CARNE SUÍNA", "ARROZ BRANCO", "REQUEIJÃO CREMOSO", "LEITE", "CACAU EM PÓ"] },
      { day: "Sexta", dish: "ARROZ CUIABANO E FEIJÃO + PONCÃ", ingredients: ["CARNE BOVINA CUBOS", "BANANA DA TERRA", "ARROZ BRANCO", "FEIJÃO CARIOCA", "PONCÃ"] }
    ]
  }
];
