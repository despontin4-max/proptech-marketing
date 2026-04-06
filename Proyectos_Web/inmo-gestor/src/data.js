// ============================================================
// GESTOR INMO - Datos Mock
// Basado en contrato real: Building Investment S.A. / Run Gym S.A.S.
// ============================================================

// --- Historial IPC Trimestral (Argentina - ejemplo ficticio) ---
export const ipcHistorial = [
    { periodo: 'Q1 2023', porcentaje: 21.4, mes: 'Enero-Marzo 2023' },
    { periodo: 'Q2 2023', porcentaje: 23.1, mes: 'Abril-Junio 2023' },
    { periodo: 'Q3 2023', porcentaje: 28.6, mes: 'Julio-Sep 2023' },
    { periodo: 'Q4 2023', porcentaje: 52.5, mes: 'Oct-Dic 2023' },
    { periodo: 'Q1 2024', porcentaje: 51.2, mes: 'Enero-Marzo 2024' },
    { periodo: 'Q2 2024', porcentaje: 18.3, mes: 'Abril-Junio 2024' },
    { periodo: 'Q3 2024', porcentaje: 17.6, mes: 'Julio-Sep 2024' },
    { periodo: 'Q4 2024', porcentaje: 14.8, mes: 'Oct-Dic 2024' },
    { periodo: 'Q1 2025', porcentaje: 12.5, mes: 'Enero-Marzo 2025' },
]

// --- Edificio Principal ---
export const edificios = [
    {
        id: 'ED001',
        nombre: 'Complejo Av. Tissera',
        direccion: 'Av. Tissera N° 597, Mendiolaza, Córdoba',
        administrador: 'Building Investment S.A.',
        impuestoInmobiliarioAnual: 1_800_000,
        unidades: [
            { id: 'U001', nombre: 'Unidad A - Gimnasio (1100 m²)', porcentaje: 55.0 },
            { id: 'U002', nombre: 'Unidad B - Local Comercial (500 m²)', porcentaje: 25.0 },
            { id: 'U003', nombre: 'Unidad C - Oficinas (300 m²)', porcentaje: 15.0 },
            { id: 'U004', nombre: 'Unidad D - Depósito (100 m²)', porcentaje: 5.0 },
        ],
    },
    {
        id: 'ED002',
        nombre: 'Torre Residencial San José',
        direccion: 'San José de Calazans 390, Piso 13, Córdoba',
        administrador: 'Inmobiliaria Torres Bianco',
        impuestoInmobiliarioAnual: 960_000,
        unidades: [
            { id: 'U005', nombre: 'Depto. A (75 m²)', porcentaje: 30.0 },
            { id: 'U006', nombre: 'Depto. B (60 m²)', porcentaje: 24.0 },
            { id: 'U007', nombre: 'Depto. C (65 m²)', porcentaje: 26.0 },
            { id: 'U008', nombre: 'Depto. D (50 m²)', porcentaje: 20.0 },
        ],
    },
]

// --- Inquilinos ---
export const inquilinos = [
    {
        id: 'INQ001',
        razonSocial: 'Run Gym S.A.S.',
        cuit: '33-71720328-9',
        representante: 'Cristian Napolitano',
        dni: '37.151.838',
        domicilio: 'San José de Calazans 390, Piso 13, Dep. B, Córdoba',
        email: 'contacto@rungym.com.ar',
        telefono: '351-555-0192',
        tipo: 'empresa',
    },
    {
        id: 'INQ002',
        razonSocial: 'María Elena García',
        cuit: '27-28456789-4',
        representante: '',
        dni: '28.456.789',
        domicilio: 'Av. Colón 1234, Piso 3, Córdoba',
        email: 'megarcia@gmail.com',
        telefono: '351-555-4412',
        tipo: 'persona',
    },
    {
        id: 'INQ003',
        razonSocial: 'Tech Solutions S.A.',
        cuit: '30-68000123-7',
        representante: 'Roberto Almeida',
        dni: '22.300.456',
        domicilio: 'B° Jardín, Córdoba',
        email: 'radm@techsolutions.ar',
        telefono: '351-555-7890',
        tipo: 'empresa',
    },
]

// --- Propiedades ---
export const propiedades = [
    {
        id: 'PROP001',
        nombre: 'Gimnasio Sport Club – Av. Tissera',
        direccion: 'Av. Tissera N° 597, Mendiolaza, Córdoba',
        tipo: 'comercial',
        superficie: 1100,
        imagen: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80',
        estado: 'Alquilado',
        edificioId: 'ED001',
        unidadId: 'U001',
        impuestoInmobiliarioMensual: 42_000,
        contratoId: 'CONT001',
    },
    {
        id: 'PROP002',
        nombre: 'Depto. 3 Amb. – Nueva Córdoba',
        direccion: 'Calle Caseros 344, Piso 5, Of. 40, Córdoba',
        tipo: 'residencial',
        superficie: 75,
        imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80',
        estado: 'Disponible',
        edificioId: 'ED002',
        unidadId: 'U005',
        impuestoInmobiliarioMensual: 24_000,
        contratoId: null,
    },
    {
        id: 'PROP003',
        nombre: 'Local Comercial – Pta. Baja',
        direccion: 'Av. Tissera N° 597, Mendiolaza, Córdoba',
        tipo: 'comercial',
        superficie: 500,
        imagen: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80',
        estado: 'Alquilado',
        edificioId: 'ED001',
        unidadId: 'U002',
        impuestoInmobiliarioMensual: 18_000,
        contratoId: 'CONT002',
    },
    {
        id: 'PROP004',
        nombre: 'Oficinas Piso 13 – Torre San José',
        direccion: 'San José de Calazans 390, Piso 13, Córdoba',
        tipo: 'oficina',
        superficie: 65,
        imagen: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=500&q=80',
        estado: 'Alquilado',
        edificioId: 'ED002',
        unidadId: 'U007',
        impuestoInmobiliarioMensual: 15_000,
        contratoId: 'CONT003',
    },
]

// --- Contratos ---
export const contratos = [
    {
        id: 'CONT001',
        numero: '2023-001',
        propiedadId: 'PROP001',
        inquilinoId: 'INQ001',
        locadora: 'Building Investment S.A.',
        cuitLocadora: '30-71032271-2',
        representanteLocadora: 'Agustín J. Carrer',
        fechaInicio: '2023-07-01',
        fechaFin: '2028-06-30',
        plazoAnios: 5,
        destino: 'Instalación de Sucursal del gimnasio "Sport Club"',
        canonBase: 550_000,           // Mínimo original
        canonActual: 1_023_450,       // Después de ajustes IPC
        tipoActualizacion: 'ICC',     // Índice Costo de la Construcción Córdoba
        porcentajeFacturacion: 15,    // 15% facturación bruta si supera mínimo
        iva: true,
        moradiaria: 0.5,              // 0.5% diario del mensual
        estadoPago: 'Al día',
        proximoVencimiento: '2026-03-10',
        clausulas: {
            rescisionAnticipada: 'Después de 6 meses, con 1 mes de preaviso. 1.5 meses de indemnización si es dentro del 1er año.',
            intransferibilidad: 'Prohibida sin consentimiento expreso del locador.',
            seguro: 'El locatario debe contratar seguro contra Incendio, Daños, Responsabilidad Civil.',
            modificaciones: 'Ninguna modificación sin conformidad escrita del locador. Mejoras quedan a favor del locador.',
        },
        ajustesAplicados: [
            { fecha: '2024-01-01', periodo: 'Q4 2023', porcentaje: 52.5, canonAnterior: 550_000, canonNuevo: 838_750 },
            { fecha: '2024-07-01', periodo: 'Q2 2024', porcentaje: 18.3, canonAnterior: 838_750, canonNuevo: 992_422 },
            { fecha: '2025-01-01', periodo: 'Q4 2024', porcentaje: 14.8, canonAnterior: 838_750, canonNuevo: 1_023_450 },
        ],
    },
    {
        id: 'CONT002',
        numero: '2024-015',
        propiedadId: 'PROP003',
        inquilinoId: 'INQ002',
        locadora: 'Building Investment S.A.',
        cuitLocadora: '30-71032271-2',
        representanteLocadora: 'Agustín J. Carrer',
        fechaInicio: '2024-03-01',
        fechaFin: '2027-02-28',
        plazoAnios: 3,
        destino: 'Local comercial de indumentaria',
        canonBase: 320_000,
        canonActual: 432_160,
        tipoActualizacion: 'IPC',
        porcentajeFacturacion: null,
        iva: false,
        moradiaria: 0.5,
        estadoPago: 'Pendiente',
        proximoVencimiento: '2026-03-12',
        clausulas: {
            rescisionAnticipada: 'Según ley 27.551 – con 1 mes de preaviso.',
            intransferibilidad: 'Prohibida sin consentimiento del locador.',
            seguro: 'A cargo del locatario.',
            modificaciones: 'Solo con autorización escrita.',
        },
        ajustesAplicados: [
            { fecha: '2025-01-01', periodo: 'Q3 2024', porcentaje: 17.6, canonAnterior: 320_000, canonNuevo: 376_320 },
            { fecha: '2025-07-01', periodo: 'Q1 2025', porcentaje: 12.5, canonAnterior: 376_320, canonNuevo: 423_360 },
        ],
    },
    {
        id: 'CONT003',
        numero: '2025-003',
        propiedadId: 'PROP004',
        inquilinoId: 'INQ003',
        locadora: 'Building Investment S.A.',
        cuitLocadora: '30-71032271-2',
        representanteLocadora: 'Agustín J. Carrer',
        fechaInicio: '2025-01-01',
        fechaFin: '2028-12-31',
        plazoAnios: 4,
        destino: 'Oficinas corporativas',
        canonBase: 750_000,
        canonActual: 843_750,
        tipoActualizacion: 'IPC',
        porcentajeFacturacion: null,
        iva: true,
        moradiaria: 0.5,
        estadoPago: 'Vencido',
        proximoVencimiento: '2026-03-01',
        clausulas: {
            rescisionAnticipada: 'Según ley 27.551.',
            intransferibilidad: 'Prohibida.',
            seguro: 'A cargo del locatario.',
            modificaciones: 'Solo con autorización escrita.',
        },
        ajustesAplicados: [
            { fecha: '2025-07-01', periodo: 'Q1 2025', porcentaje: 12.5, canonAnterior: 750_000, canonNuevo: 843_750 },
        ],
    },
]

// --- Liquidaciones de Expensas ---
export const liquidaciones = [
    {
        id: 'LIQ001',
        edificioId: 'ED001',
        periodo: 'Febrero 2026',
        fechaEmision: '2026-02-28',
        estado: 'Emitida',
        items: [
            { concepto: 'Electricidad Áreas Comunes', monto: 95_000 },
            { concepto: 'Agua y Cloacas', monto: 28_000 },
            { concepto: 'Limpieza y Mantenimiento', monto: 65_000 },
            { concepto: 'Vigilancia / Portería', monto: 120_000 },
            { concepto: 'Seguro del Edificio', monto: 45_000 },
            { concepto: 'Reparaciones Extraordinarias', monto: 30_000 },
            { concepto: 'Honorarios Administración', monto: 50_000 },
        ],
    },
    {
        id: 'LIQ002',
        edificioId: 'ED001',
        periodo: 'Enero 2026',
        fechaEmision: '2026-01-31',
        estado: 'Cobrada',
        items: [
            { concepto: 'Electricidad Áreas Comunes', monto: 88_000 },
            { concepto: 'Agua y Cloacas', monto: 25_000 },
            { concepto: 'Limpieza y Mantenimiento', monto: 65_000 },
            { concepto: 'Vigilancia / Portería', monto: 120_000 },
            { concepto: 'Seguro del Edificio', monto: 45_000 },
            { concepto: 'Reparaciones Extraordinarias', monto: 0 },
            { concepto: 'Honorarios Administración', monto: 50_000 },
        ],
    },
    {
        id: 'LIQ003',
        edificioId: 'ED002',
        periodo: 'Febrero 2026',
        fechaEmision: '2026-02-28',
        estado: 'Emitida',
        items: [
            { concepto: 'Electricidad Áreas Comunes', monto: 42_000 },
            { concepto: 'Agua y Cloacas', monto: 18_000 },
            { concepto: 'Limpieza y Mantenimiento', monto: 35_000 },
            { concepto: 'Ascensor – Mantenimiento', monto: 22_000 },
            { concepto: 'Seguro del Edificio', monto: 30_000 },
            { concepto: 'Honorarios Administración', monto: 25_000 },
        ],
    },
]

// --- Helpers ---
export function formatPeso(n) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export function calcularExpensasPorUnidad(liquidacionId) {
    const liq = liquidaciones.find(l => l.id === liquidacionId)
    if (!liq) return []
    const edificio = edificios.find(e => e.id === liq.edificioId)
    if (!edificio) return []
    const totalGastos = liq.items.reduce((sum, i) => sum + i.monto, 0)
    return edificio.unidades.map(u => ({
        ...u,
        montoExpensas: Math.round(totalGastos * u.porcentaje / 100),
    }))
}

export function calcularNuevoCanon(canonActual, porcentajeIpc) {
    return Math.round(canonActual * (1 + porcentajeIpc / 100))
}

export function getPropiedad(id) { return propiedades.find(p => p.id === id) }
export function getContrato(id) { return contratos.find(c => c.id === id) }
export function getInquilino(id) { return inquilinos.find(i => i.id === id) }
export function getEdificio(id) { return edificios.find(e => e.id === id) }
