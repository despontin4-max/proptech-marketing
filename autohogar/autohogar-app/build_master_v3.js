/**
 * BUILD_MASTER_V3.js - Script DEFINITIVO CON DISCRIMINACIÓN DE MEDIOS, DEVOLUCIONES Y FORMATO LIMPIO
 * Extrae TODOS los datos disponibles de todas las fuentes:
 * - POSNET (discriminado de reportes de caja/cotejo)
 * - BANCO GALICIA / BANCO (discriminado de reportes bancarios)
 * - MERCADO PAGO (reportes electrónicos)
 * - EFECTIVO / OFICINA (cobranza física)
 * - DEVOLUCIONES (montos y fechas exactas de reintegros)
 * - Arrastre (desglosado en saldo a favor, cuotas adelantadas y deuda previa)
 * - Fechas normalizadas (convierte seriales de Excel como 46205 a DD/MM/AAAA)
 * - Montos numéricos normalizados para lectura sin errores por IA / Bots / Google Sheets
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_relational');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TXT_DIR = path.join(BASE, 'numeros-autohogar', 'txt_extracted');

// ============================================================
// 1. LEER REPORTES DE TEXTO (Medios de Pago y Devoluciones)
// ============================================================
const methodIndex = new Map(); // normalized_name -> 'POSNET (OFICINA)' | 'BANCO GALICIA' | 'MERCADO PAGO'
const devolucionesList = [];   // Array of { name, amount, date, source }
const devolucionesByNormName = new Map();

function normalize(name) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

function excelSerialToDate(serial) {
    if (!serial) return '';
    const num = Number(serial);
    if (isNaN(num)) return serial.toString().trim();
    if (num >= 40000 && num <= 50000) {
        const utc_days  = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;                                        
        const date_info = new Date(utc_value * 1000);
        const day = String(date_info.getUTCDate()).padStart(2, '0');
        const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
        const year = date_info.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    return serial.toString().trim();
}

function cleanNumeric(val) {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') return val.toString();
    let s = val.toString().trim();
    if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes('.') && !s.includes(',')) {
        if (/^\d{1,3}\.\d{3}$/.test(s)) {
            s = s.replace('.', '');
        }
    } else if (s.includes(',') && !s.includes('.')) {
        s = s.replace(',', '.');
    }
    s = s.replace(/[^\d.-]/g, '');
    const num = parseFloat(s);
    return isNaN(num) ? '' : num.toString();
}

function loadTxtReports() {
    if (!fs.existsSync(TXT_DIR)) return;

    const files = fs.readdirSync(TXT_DIR);

    for (const file of files) {
        if (!file.endsWith('.txt')) continue;
        const fpath = path.join(TXT_DIR, file);
        const lines = fs.readFileSync(fpath, 'utf8').split('\n');

        for (let rawLine of lines) {
            let line = rawLine.trim();
            if (!line) continue;
            let upper = line.toUpperCase();

            // 1. Extraer Devoluciones
            if (upper.includes('DEVOLUCION')) {
                const devMatch = upper.match(/DEVOLUCION\s+([A-ZÑÁÉÍÓÚ\s]+?)(?:\s+\d+|\s+\$|\s+-|\t|$)/);
                const amountMatch = line.match(/(?:-|\$)\s*([\d\.,]+)/) || line.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/);
                const dateMatch = line.match(/(\d{1,2}[\/\-](?:\d{1,2}|[a-zA-Z]{3})[\/\-]?(?:\d{2,4})?)/);

                if (devMatch) {
                    let devName = devMatch[1].replace(/[\d\-]/g, '').trim();
                    let devAmount = amountMatch ? amountMatch[1].trim() : '';
                    let devDate = dateMatch ? dateMatch[1].trim() : '';
                    if (devName.length > 3 && !devName.includes('CUENTA') && !devName.includes('SUBPAC')) {
                        const cleanDevAmount = cleanNumeric(devAmount);
                        const finalDevAmount = cleanDevAmount ? (cleanDevAmount.startsWith('-') ? cleanDevAmount : '-' + cleanDevAmount) : '-0';
                        const devObj = {
                            name: devName,
                            amount: finalDevAmount,
                            date: devDate,
                            file: file
                        };
                        devolucionesList.push(devObj);
                        devolucionesByNormName.set(normalize(devName), devObj);
                    }
                }
            }

            // 2. Extraer POSNET
            if (upper.includes('POSNET') && !upper.includes('PRUEBA POSNET') && !upper.includes('TOTAL') && !upper.includes('%')) {
                const nameMatch = upper.match(/(?:POSNET.*?)(?:[0-9\.,]+\s+)?(?:[0-9]{1,2}-[A-Z]{3}\s+)?([A-ZÑÁÉÍÓÚ\s]+?)(?:\s*\$\s*|\s+[0-9\.,]+|\s+X\s+X|$)/);
                if (nameMatch) {
                    let pName = nameMatch[1].replace(/POSNET|\$|[0-9\-]/g, '').trim();
                    if (pName.length > 4 && !pName.includes('OFICINA') && !pName.includes('COBRADOR')) {
                        methodIndex.set(normalize(pName), 'POSNET (OFICINA)');
                    }
                }
            }

            // 3. Extraer BANCO GALICIA
            if (file.toUpperCase().includes('BANCO') || upper.includes('BANCO GALICIA') || upper.includes('DEPÓSITOS BANCO GALICIA')) {
                const m = upper.match(/(?:BANCO GALICIA|DEPÓSITOS BANCO GALICIA)\s+([A-ZÑÁÉÍÓÚ\s]+?)\s+\d+/);
                if (m) {
                    const name = m[1].trim().replace(/\s+/g, ' ');
                    if (name.length > 3) methodIndex.set(normalize(name), 'BANCO GALICIA');
                }
            }

            // 4. Extraer MERCADO PAGO
            if (upper.includes('MERCADO PAGO') && !upper.includes('DEVOLUCION')) {
                const m = upper.match(/(?:MERCADO PAGO)\s+([A-ZÑÁÉÍÓÚ\s]+?)\s+\d+/);
                if (m) {
                    const name = m[1].trim().replace(/\s+/g, ' ');
                    if (name.length > 3) {
                        const norm = normalize(name);
                        if (!methodIndex.has(norm)) {
                            methodIndex.set(norm, 'MERCADO PAGO');
                        }
                    }
                }
            }
        }
    }
    console.log(`Loaded ${methodIndex.size} specific payment methods (Posnet/Banco/MP).`);
    console.log(`Loaded ${devolucionesList.length} devoluciones records.`);
}

function findMedioByName(name) {
    const norm = normalize(name);
    if (methodIndex.has(norm)) return methodIndex.get(norm);
    
    const tokens = norm.split(' ').filter(t => t.length > 3);
    for (const [key, method] of methodIndex) {
        let matchCount = 0;
        for (const t of tokens) {
            if (key.includes(t)) matchCount++;
        }
        if (matchCount >= 2) return method;
    }
    return null;
}

function findDevolucionByName(name) {
    const norm = normalize(name);
    if (devolucionesByNormName.has(norm)) return devolucionesByNormName.get(norm);
    
    const tokens = norm.split(' ').filter(t => t.length > 3);
    for (const [key, dev] of devolucionesByNormName) {
        let matchCount = 0;
        for (const t of tokens) {
            if (key.includes(t)) matchCount++;
        }
        if (matchCount >= 2) return dev;
    }
    return null;
}

// ============================================================
// 2. CARGAR CARGA DIARIA 14 AGOSTO (datos 100% verificados)
// ============================================================
const carga14Map = new Map();
function loadCarga14() {
    const fpath = path.join(BASE, 'CARGA CLIENTES ASESOR COBRANZAS 14 de agosto.xlsx');
    if (!fs.existsSync(fpath)) return;
    const wb = xlsx.readFile(fpath);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).slice(3);
    for (const row of rows) {
        if (!row[1] || isNaN(Number(row[1]))) continue;
        carga14Map.set(String(row[1]), {
            nombre: row[2] || '',
            importe: cleanNumeric(row[3]),
            cobrador: row[4] || '',
            medio: row[5] || 'EFECTIVO / OFICINA'
        });
    }
    console.log(`Loaded ${carga14Map.size} records from Carga 14/08.`);
}

// ============================================================
// 3. CARGAR AGOSTO 2026 COMPLETO (fuente principal verificada)
// ============================================================
const agosto26Map = new Map();
function loadAgosto2026() {
    const fpath = path.join(BASE, '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
    if (!fs.existsSync(fpath)) return;
    const wb = xlsx.readFile(fpath);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).slice(3);
    for (const row of rows) {
        if (!row[0] || !row[1] || isNaN(Number(row[0]))) continue;
        agosto26Map.set(String(row[0]), {
            cod: row[0], nombre: row[1], telefono: formatPhone(row[2]),
            localidad: row[3] || '', soli: row[4] || '',
            cuotas: row[5] || '',               // CTA = cuota actual
            cuotas_plan: cleanNumeric(row[6]),  // CUOTAS = monto cuota pactada  
            arrastre: cleanNumeric(row[7]) || 0, // saldo a favor o deuda
            pago_agosto: cleanNumeric(row[8]),
            pago_adelanto: cleanNumeric(row[9]),
            pago_antes: cleanNumeric(row[10]),
            x_oficina: row[11] || '',           // si paga en oficina
            bco_o_elect: row[12] || '',         // si paga electrónico / banco
            con_mora: cleanNumeric(row[13]),
            sistema: cleanNumeric(row[14]),
            planilla_salida: cleanNumeric(row[15]),
            pago_mes_ant: excelSerialToDate(row[18]), // Normalizado a DD/MM/AAAA
            cobrador: row[23] || '',
            comision: cleanNumeric(row[25]),
        });
    }
    console.log(`Loaded ${agosto26Map.size} records from Agosto 2026.`);
}

// ============================================================
// 4. CARGAR ENERO 2025 (base histórica)
// ============================================================
const enero25Map = new Map();
function loadEnero2025() {
    const fpath = path.join(BASE, '07 Clientes de pago electronico  de ENERO 2025.xlsx');
    if (!fs.existsSync(fpath)) return;
    const wb = xlsx.readFile(fpath);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).slice(3);
    for (const row of rows) {
        if (!row[0] || !row[1] || isNaN(Number(row[0]))) continue;
        enero25Map.set(String(row[0]), {
            cod: row[0], nombre: row[1], telefono: formatPhone(row[2]),
            localidad: row[3] || '', soli: row[4] || '',
            cuota_ene25: cleanNumeric(row[6]),
            arrastre_ene25: cleanNumeric(row[7]) || 0,
            x_oficina: row[11] || '',
            bco_o_elect: row[12] || '',
        });
    }
    console.log(`Loaded ${enero25Map.size} records from Enero 2025.`);
}

// ============================================================
// 5. CARGAR JSON (137 clientes con DNI, dirección, plan, historial)
// ============================================================
let jsonData = [];
function loadJSON() {
    const fpath = path.join(BASE, 'extracted_clients_august_2026.json');
    if (!fs.existsSync(fpath)) return;
    jsonData = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    console.log(`Loaded ${jsonData.length} records from JSON.`);
}

// ============================================================
// UTILS
// ============================================================
function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.toString().replace(/[^\d]/g, '');
    if (clean.length === 10) return clean.substring(0, 3) + '-' + clean.substring(3);
    return phone.toString().trim();
}

function toCSV(dataArray, headers) {
    let csv = headers.join(',') + '\n';
    for (const row of dataArray) {
        csv += headers.map(h => {
            const val = (row[h] !== undefined && row[h] !== null) ? row[h].toString().replace(/"/g, '""') : '';
            return `"${val}"`;
        }).join(',') + '\n';
    }
    return csv;
}

// ============================================================
// MAIN: CONSOLIDAR
// ============================================================
async function buildAll() {
    loadTxtReports();
    loadCarga14();
    loadAgosto2026();
    loadEnero2025();
    loadJSON();

    const jsonByCod = new Map();
    for (const item of jsonData) jsonByCod.set(String(item.cod), item);

    const allCods = new Set([
        ...Array.from(agosto26Map.keys()),
        ...Array.from(enero25Map.keys()),
    ]);

    const masterClients = [];
    const masterTransactions = [];

    for (const cod of allCods) {
        const a26 = agosto26Map.get(cod);
        const e25 = enero25Map.get(cod);
        const j = jsonByCod.get(cod);
        const c14 = carga14Map.get(cod);

        const nombre = (a26 && a26.nombre) || (j && j.name) || (e25 && e25.nombre) || '';
        if (!nombre) continue;

        const telefono = (a26 && a26.telefono) || (j && j.phone && formatPhone(j.phone)) || (e25 && e25.telefono) || '';
        const ciudad = (j && j.city) || (a26 && a26.localidad) || (e25 && e25.localidad) || '';
        const soli = (j && j.soli) || (a26 && a26.soli) || (e25 && e25.soli) || '';
        const dni = (j && j.dni) || '';
        const direccion = (j && j.address) || '';
        const plan = (j && j.plan) || '';

        const cuota_num = (j && j.cuotaNum) || (a26 && a26.cuotas) || '';
        const cuotas_pagadas = cuota_num;

        let cuotas_pactadas = '';
        if (plan) {
            const m = plan.match(/(\d+)\s*C/i);
            if (m) cuotas_pactadas = m[1];
        }
        if (!cuotas_pactadas) cuotas_pactadas = 'CONSULTAR CONTRATO';

        const monto_cuota_str = 
            (c14 && c14.importe ? String(c14.importe) : null) ||
            (j && j.amount ? cleanNumeric(j.amount) : null) ||
            (a26 && a26.cuotas_plan ? String(a26.cuotas_plan) : null) ||
            (e25 && e25.cuota_ene25 ? String(e25.cuota_ene25) : null) ||
            '';

        // Arrastre
        const arrastre_raw = (a26 && a26.arrastre !== undefined && a26.arrastre !== '') 
            ? Number(a26.arrastre)
            : (e25 && e25.arrastre_ene25 ? Number(e25.arrastre_ene25) : 0);

        let saldo_a_favor = '';
        let deuda_previa = '';
        let cuotas_adelantadas = '';
        if (arrastre_raw > 0) {
            saldo_a_favor = arrastre_raw.toString();
            const monto_ref = Number(monto_cuota_str) || 0;
            if (monto_ref > 0) {
                cuotas_adelantadas = Math.floor(arrastre_raw / monto_ref).toString();
            }
        } else if (arrastre_raw < 0) {
            deuda_previa = Math.abs(arrastre_raw).toString();
        }

        const cuota_ene25 = (e25 && e25.cuota_ene25) ? String(e25.cuota_ene25) : '';
        let fecha_cambio_monto = '';
        if (cuota_ene25 && monto_cuota_str && cuota_ene25 !== monto_cuota_str) {
            fecha_cambio_monto = 'ENTRE ENE/2025 Y AGO/2026';
        }

        let cobrador_num = (c14 && c14.cobrador) || (a26 && a26.cobrador) || '';
        let x_oficina = (a26 && a26.x_oficina) || (e25 && e25.x_oficina) || '';
        
        // Determinar Medio de Pago Exacto y Discriminado
        let medio_pago = '';
        if (c14 && c14.medio && c14.medio !== 'EFECTIVO / OFICINA') {
            medio_pago = c14.medio;
        } else {
            const detected = findMedioByName(nombre);
            if (detected) {
                medio_pago = detected;
            } else if (x_oficina) {
                medio_pago = 'EFECTIVO / OFICINA';
            } else if (a26 && a26.bco_o_elect) {
                medio_pago = 'BANCO / TRANSFERENCIA';
            } else {
                medio_pago = 'EFECTIVO / OFICINA';
            }
        }

        // Devoluciones
        const devInfo = findDevolucionByName(nombre);
        let devolucion_monto = devInfo ? devInfo.amount : '';
        let devolucion_detalle = devInfo ? `FECHA: ${devInfo.date || 'S/D'} | ARCHIVO: ${devInfo.file}` : '';

        const con_mora = (a26 && a26.con_mora) ? String(a26.con_mora) : '';
        const pago_mes_ant = (a26 && a26.pago_mes_ant) ? String(a26.pago_mes_ant) : '';
        const comision = (a26 && a26.comision) ? String(a26.comision) : '';
        const historial_5 = (j && j.history) || '';

        let capital_pagado = '';
        if (monto_cuota_str && cuota_num) {
            const montoNum = parseFloat(monto_cuota_str);
            const cuotaNumInt = parseInt(cuota_num);
            if (!isNaN(montoNum) && !isNaN(cuotaNumInt)) {
                capital_pagado = Math.round(montoNum * cuotaNumInt).toString();
            }
        }

        const verificacion = (j || a26) ? 'VERIFICADO' : 'PROVISIONAL';

        masterClients.push({
            COD: cod,
            SOLI: soli,
            NOMBRE: nombre,
            DNI: dni,
            TELEFONO: telefono,
            DIRECCION: direccion,
            CIUDAD: ciudad,
            PLAN_VIVIENDA: plan,
            CUOTAS_PAGADAS: cuotas_pagadas,
            CUOTAS_PACTADAS: cuotas_pactadas,
            VALOR_CUOTA_ACTUAL: monto_cuota_str,
            COBRADOR: cobrador_num,
            MEDIO_DE_PAGO: medio_pago,
            SALDO_A_FAVOR: saldo_a_favor,
            CUOTAS_ADELANTADAS: cuotas_adelantadas,
            DEUDA_PREVIA: deuda_previa,
            DEVOLUCION_MONTO: devolucion_monto,
            DEVOLUCION_DETALLE: devolucion_detalle,
            CAPITAL_PAGADO_ESTIMADO: capital_pagado,
            CON_MORA: con_mora,
            PAGO_MES_ANT_AGOSTO: pago_mes_ant,
            CUOTA_ENERO_2025: cuota_ene25,
            FECHA_CAMBIO_MONTO: fecha_cambio_monto,
            COMISION: comision,
            HISTORIAL_5_PAGOS: historial_5,
            VERIFICACION: verificacion,
        });

        // TRANSACCIONES (Pagos regulares)
        if (j && j.history) {
            const dates = j.history.split('-').map(d => d.trim()).filter(d => d.length > 0);
            const cuotaActual = parseInt(j.cuotaNum) || 0;
            for (let i = 0; i < dates.length; i++) {
                masterTransactions.push({
                    ID_TRANSACCION: `TR-${cod}-${dates[i].replace(/\//g, '')}`,
                    COD_CLIENTE: cod,
                    NOMBRE: nombre,
                    NRO_CUOTA: cuotaActual > 0 ? (cuotaActual - i).toString() : '',
                    FECHA_PAGO: dates[i],
                    MONTO_ABONADO: cleanNumeric(j.amount),
                    MEDIO_DE_PAGO: medio_pago,
                    LUGAR: (medio_pago.includes('OFICINA') || medio_pago.includes('POSNET')) ? 'OFICINA' : 'REMOTO',
                    TIPO: 'FACTURA NORMAL',
                });
            }
        }

        // TRANSACCIÓN DE DEVOLUCIÓN (si existe)
        if (devInfo) {
            masterTransactions.push({
                ID_TRANSACCION: `DEV-${cod}-${(devInfo.date || 'SD').replace(/[\/\-]/g, '')}`,
                COD_CLIENTE: cod,
                NOMBRE: nombre,
                NRO_CUOTA: '-',
                FECHA_PAGO: devInfo.date || '-',
                MONTO_ABONADO: devInfo.amount,
                MEDIO_DE_PAGO: 'MERCADO PAGO (REINTEGRO)',
                LUGAR: 'SISTEMA CENTRAL',
                TIPO: 'DEVOLUCION',
            });
        }
    }

    // Agregar Devoluciones huérfanas
    for (const dev of devolucionesList) {
        const found = masterClients.some(c => normalize(c.NOMBRE).includes(normalize(dev.name)) || normalize(dev.name).includes(normalize(c.NOMBRE)));
        if (!found) {
            const orphanCod = `DEV-${masterClients.length + 1}`;
            masterClients.push({
                COD: orphanCod,
                SOLI: '-',
                NOMBRE: dev.name + ' (CLIENTE EN DEVOLUCION)',
                DNI: '',
                TELEFONO: '',
                DIRECCION: '',
                CIUDAD: '',
                PLAN_VIVIENDA: 'BAJA / REINTEGRO',
                CUOTAS_PAGADAS: '-',
                CUOTAS_PACTADAS: '-',
                VALOR_CUOTA_ACTUAL: '-',
                COBRADOR: '-',
                MEDIO_DE_PAGO: 'MERCADO PAGO',
                SALDO_A_FAVOR: '',
                CUOTAS_ADELANTADAS: '',
                DEUDA_PREVIA: '',
                DEVOLUCION_MONTO: dev.amount,
                DEVOLUCION_DETALLE: `FECHA: ${dev.date || 'S/D'} | ARCHIVO: ${dev.file}`,
                CAPITAL_PAGADO_ESTIMADO: '',
                CON_MORA: '',
                PAGO_MES_ANT_AGOSTO: '',
                CUOTA_ENERO_2025: '',
                FECHA_CAMBIO_MONTO: '',
                COMISION: '',
                HISTORIAL_5_PAGOS: '',
                VERIFICACION: 'VERIFICADO',
            });

            masterTransactions.push({
                ID_TRANSACCION: `DEV-ORPH-${(dev.date || 'SD').replace(/[\/\-]/g, '')}`,
                COD_CLIENTE: orphanCod,
                NOMBRE: dev.name,
                NRO_CUOTA: '-',
                FECHA_PAGO: dev.date || '-',
                MONTO_ABONADO: dev.amount,
                MEDIO_DE_PAGO: 'MERCADO PAGO (REINTEGRO)',
                LUGAR: 'SISTEMA CENTRAL',
                TIPO: 'DEVOLUCION',
            });
        }
    }

    // APP_CARGA_DIARIA: Solo clientes de cobro en oficina (Efectivo o Posnet)
    const appData = masterClients
        .filter(c => c.MEDIO_DE_PAGO === 'EFECTIVO / OFICINA' || c.MEDIO_DE_PAGO === 'POSNET (OFICINA)')
        .map(c => ({
            NRO_CLIENTE: c.COD,
            NOMBRE: c.NOMBRE,
            TELEFONO: c.TELEFONO,
            MEDIO_HABITUAL: c.MEDIO_DE_PAGO,
            IMPORTE_A_COBRAR: c.VALOR_CUOTA_ACTUAL,
            SALDO_A_FAVOR: c.SALDO_A_FAVOR,
            CUOTAS_ADELANTADAS: c.CUOTAS_ADELANTADAS,
            DEUDA_PREVIA: c.DEUDA_PREVIA,
            DEVOLUCIONES: c.DEVOLUCION_MONTO,
            HISTORIAL: c.HISTORIAL_5_PAGOS
        }));

    // WRITE
    const clientHeaders = [
        'COD','SOLI','NOMBRE','DNI','TELEFONO','DIRECCION','CIUDAD','PLAN_VIVIENDA',
        'CUOTAS_PAGADAS','CUOTAS_PACTADAS','VALOR_CUOTA_ACTUAL','COBRADOR','MEDIO_DE_PAGO',
        'SALDO_A_FAVOR','CUOTAS_ADELANTADAS','DEUDA_PREVIA','DEVOLUCION_MONTO','DEVOLUCION_DETALLE',
        'CAPITAL_PAGADO_ESTIMADO','CON_MORA','PAGO_MES_ANT_AGOSTO',
        'CUOTA_ENERO_2025','FECHA_CAMBIO_MONTO','COMISION','HISTORIAL_5_PAGOS','VERIFICACION'
    ];
    const transHeaders = [
        'ID_TRANSACCION','COD_CLIENTE','NOMBRE','NRO_CUOTA','FECHA_PAGO',
        'MONTO_ABONADO','MEDIO_DE_PAGO','LUGAR','TIPO'
    ];
    const appHeaders = [
        'NRO_CLIENTE','NOMBRE','TELEFONO','MEDIO_HABITUAL','IMPORTE_A_COBRAR',
        'SALDO_A_FAVOR','CUOTAS_ADELANTADAS','DEUDA_PREVIA','DEVOLUCIONES','HISTORIAL'
    ];

    fs.writeFileSync(path.join(OUTPUT_DIR, 'MASTER_CLIENTES_V3.csv'), toCSV(masterClients, clientHeaders));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'MASTER_TRANSACCIONES_V3.csv'), toCSV(masterTransactions, transHeaders));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'APP_CARGA_DIARIA_V3.csv'), toCSV(appData, appHeaders));

    console.log(`\n=== GENERACION CON FORMATO NORMALIZADO COMPLETADA ===`);
    console.log(`MASTER_CLIENTES_V3.csv: ${masterClients.length} registros | ${clientHeaders.length} columnas`);
    console.log(`MASTER_TRANSACCIONES_V3.csv: ${masterTransactions.length} transacciones`);
    console.log(`APP_CARGA_DIARIA_V3.csv: ${appData.length} clientes de oficina`);
}

buildAll().catch(console.error);
