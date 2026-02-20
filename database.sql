
-- ==============================================================================
-- SCHEMA DE BANCO DE DADOS: PORTAL DE GESTÃO ANDRÉ MAGGI
-- DIALETO: POSTGRESQL / SUPABASE
-- VERSÃO: 1.0 (PRODUÇÃO)
-- ==============================================================================

-- 1. EXTENSÕES E ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('GESTAO', 'SECRETARIA', 'PROFESSOR', 'PSICOSSOCIAL', 'AAE_LIMPEZA', 'AEE_NUTRICAO');
CREATE TYPE shift_type AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL');
CREATE TYPE contract_status AS ENUM ('ATIVO', 'INATIVO', 'CONCLUIDO');
CREATE TYPE tx_type AS ENUM ('ENTRY', 'EXPENSE');
CREATE TYPE tx_group AS ENUM ('CUSTEIO', 'CAPITAL');
CREATE TYPE plan_status AS ENUM ('RASCUNHO', 'EM_ANALISE', 'VALIDADO', 'CORRECAO_SOLICITADA');

-- 2. MÓDULO CORE & USUÁRIOS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    status VARCHAR(20) DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. MÓDULO SECRETARIA (BASE DE ALUNOS E TURMAS)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    guardian_name VARCHAR(255),
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ATIVO', -- ATIVO, TRANSFERIDO, EVADIDO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- Ex: 9º ANO A
    year CHAR(4) NOT NULL,
    shift shift_type NOT NULL,
    teacher_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(student_id, classroom_id)
);

-- 4. MÓDULO MERENDA & CONTRATOS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    full_name TEXT,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    category VARCHAR(100), -- Agricultura Familiar, Gêneros Secos, etc
    score DECIMAL(3,2) DEFAULT 5.0
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    type VARCHAR(50) NOT NULL, -- Pregão, AF, Dispensa
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status contract_status DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contract_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    contracted_quantity DECIMAL(12,2) NOT NULL,
    acquired_quantity DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    brand VARCHAR(100)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    total_value DECIMAL(12,2) NOT NULL,
    observations TEXT,
    status VARCHAR(20) DEFAULT 'EM_PROCESSAMENTO' -- PENDENTE, ENTREGUE, CANCELADO
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    contract_item_id UUID REFERENCES contract_items(id),
    description TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL
);

-- 5. MÓDULO FINANCEIRO
CREATE TABLE funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- RU, PNAE, PDDE
    full_name TEXT,
    budget_year CHAR(4) NOT NULL
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(id),
    supplier_id UUID REFERENCES suppliers(id), -- Opcional, se for despesa com fornecedor
    date DATE NOT NULL,
    description TEXT NOT NULL,
    invoice_number VARCHAR(100),
    type tx_type NOT NULL,
    tx_group tx_group NOT NULL,
    gross_value DECIMAL(12,2) NOT NULL,
    tax_value DECIMAL(12,2) DEFAULT 0, -- Retenção Lei 15.226/25 (1.5%)
    net_value DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MÓDULO PEDAGÓGICO
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id),
    classroom_id UUID REFERENCES classrooms(id),
    subject VARCHAR(100) NOT NULL,
    bimestre VARCHAR(20) NOT NULL,
    themes TEXT,
    content_json JSONB, -- Armazena a grade de semanas/atividades
    status plan_status DEFAULT 'RASCUNHO',
    coordination_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id),
    teacher_id UUID REFERENCES users(id),
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50), -- CAED, Estruturado, Bimestral
    max_score DECIMAL(5,2) DEFAULT 10.0,
    bimestre VARCHAR(20)
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    proficiency_level VARCHAR(50) -- ALTO, MÉDIO, BAIXO
);

CREATE TABLE occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    teacher_id UUID REFERENCES users(id),
    classroom_id UUID REFERENCES classrooms(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(100),
    category VARCHAR(50),
    severity VARCHAR(20),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'REGISTRADO' -- REGISTRADO, ATA_GERADA, ARQUIVADO
);

-- 7. MÓDULO PSICOSSOCIAL & BUSCA ATIVA
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    teacher_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    type VARCHAR(50), -- PSICOLOGICO, SOCIAL, PEDAGOGICO
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDENTE'
);

CREATE TABLE mediation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    type VARCHAR(50), -- CONFLITO, BULLYING
    severity VARCHAR(20),
    status VARCHAR(20),
    description TEXT,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 8. INDEXAÇÃO PARA PERFORMANCE
CREATE INDEX idx_student_name ON students(name);
CREATE INDEX idx_order_contract ON orders(contract_id);
CREATE INDEX idx_tx_date ON transactions(date);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_occ_student ON occurrences(student_id);

-- TABELA DE AÇÕES DA BUSCA ATIVA (ART. 23)
CREATE TABLE active_search_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    action_type VARCHAR(50) NOT NULL, -- COMUNICADO_PAIS, ALERTA_SISTEMA, VISITA_TURMA, etc.
    status VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, CONCLUIDO
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id), -- Ponto Focal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_active_search_student ON active_search_actions(student_id);

-- COMENTÁRIO TÉCNICO:
-- A tabela `contract_items` deve ser atualizada via TRIGGER ou Service sempre que um `order_item` for inserido.
-- A retenção de 1.5% da Lei 15.226/25 está mapeada na tabela `transactions` como `tax_value`.
