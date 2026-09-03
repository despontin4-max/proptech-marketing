-- ==============================================================================
-- AUTOHOGAR - Supabase Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- Tabla: Clientes (Datos inmutables / Maestros)
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    domicilio TEXT,
    localidad VARCHAR(100),
    fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_por UUID REFERENCES auth.users(id)
);

-- Tabla: Contratos (Planes activos de los clientes)
-- Nota: Un cliente puede tener múltiples contratos.
CREATE TABLE public.contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    nro_contrato VARCHAR(50) UNIQUE NOT NULL, -- ej. 001526/001 (SOLI)
    cod_interno VARCHAR(50) UNIQUE NOT NULL, -- el COD del excel de cobranza
    plan_nombre VARCHAR(255) NOT NULL, -- ej. V. AMERICANA 2 DOR C/COCHERA
    estado VARCHAR(50) DEFAULT 'ACTIVO', -- ACTIVO, CANCELADO, SUSPENDIDO
    cuotas_totales INTEGER,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Pagos (Historial de cobranza y carga diaria)
CREATE TABLE public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL,
    importe DECIMAL(12, 2) NOT NULL,
    medio_pago VARCHAR(100) NOT NULL, -- MERCADO PAGO, OFICINA, BANCO GALICIA, etc.
    arrastre DECIMAL(12, 2) DEFAULT 0.00,
    nro_cuota INTEGER NOT NULL,
    generado_por UUID REFERENCES auth.users(id),
    pdf_url TEXT, -- URL del recibo generado si se almacena en bucket
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. PERMISOS Y SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================

-- Activar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Crear un ENUM para los roles (aunque en Supabase se suele usar auth.users.raw_user_meta_data)
-- Asumiremos que el rol se guarda en el meta_data del usuario: {"role": "admin"} o {"role": "operator"}

-- Políticas para Administradores (Ricardo) -> Acceso Total
CREATE POLICY "Admin_Full_Access_Clientes" ON public.clientes
    FOR ALL
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin_Full_Access_Contratos" ON public.contratos
    FOR ALL
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin_Full_Access_Pagos" ON public.pagos
    FOR ALL
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');


-- Políticas para Operadores (Florencia) -> Acceso Restringido (Lectura/Carga, no borrado)
-- Data Loss Prevention (DLP): En una app real, evitar la descarga masiva requiere control en la API,
-- pero RLS asegura que no puedan hacer DELETE.
CREATE POLICY "Operator_Select_Clientes" ON public.clientes
    FOR SELECT
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'operator');

CREATE POLICY "Operator_Insert_Clientes" ON public.clientes
    FOR INSERT
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'operator');
    
CREATE POLICY "Operator_Select_Contratos" ON public.contratos
    FOR SELECT
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'operator');

CREATE POLICY "Operator_Select_Pagos" ON public.pagos
    FOR SELECT
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'operator');

CREATE POLICY "Operator_Insert_Pagos" ON public.pagos
    FOR INSERT
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'operator');

-- Permitir acceso a un Bot (n8n) mediante Service Role (bypass RLS)
-- El JWT del Service Role en Supabase automáticamente bypassea RLS.
