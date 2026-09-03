/**
 * BUILD_MASTER_WORKBOOK_CLEAN.js
 * Genera el Workbook profesional y los CSVs limpios y separados:
 * 1. CLIENTES_MAESTRA: Datos atómicos y estáticos del cliente (Sin cálculos mezclados en el medio).
 * 2. ESTADO_FINANCIERO: Hoja separada de cálculos (Arrastre, mora, adelantos, comisiones, colores).
 * 3. CARGA_DIARIA_OFICINA: Formato idéntico al Excel del 14 de Agosto.
 * 4. HISTORIAL_TRANSACCIONES: Registro atómico de movimientos y devoluciones.
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_relational');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const TXT_DIR = path.join(BASE, 'numeros-autohogar', 'txt_extracted');

// 1. Helpers
function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.toString().replace(/[^\d]/g, '');
    if (clean.length === 10) return clean.substring(0, 3) + '-' + clean.substring(3);
    return phone.toString().trim();
}

function cleanNumber(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') {
        if (val === 99999 || val === 99999.99) return 0;
        return val;
    }
    let s = val.toString().trim();
    if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes('.') && !s.includes(',')) {
        if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '');
    } else if (s.includes(',') && !s.includes('.')) {
        s = s.replace(',', '.');
    }
    s = s.replace(/[^\d.-]/g, '');
    const num = parseFloat(s);
    if (isNaN(num) || num === 99999 || num === 99999.99) return 0;
    return num;
}

function excelSerialToDate(serial) {
    if (!serial) return '';
    const num = Number(serial);
    if (isNaN(num)) return serial.toString().trim();
    if (num >= 40000 && num <= 50000) {
        const utc_days = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const day = String(date_info.getUTCDate()).padStart(2, '0');
        const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
        const year = date_info.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    return serial.toString().trim();
}

function normalize(name) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

// 2. Extraer Medios de Pago y Devoluciones
const methodIndex = new Map();
const devolucionesList = [];
const devolucionesByNormName = new Map();

if (fs.existsSync(TXT_DIR)) {
    const files = fs.readdirSync(TXT_DIR);
    for (const file of files) {
        if (!file.endsWith('.txt')) continue;
        const lines = fs.readFileSync(path.join(TXT_DIR, file), 'utf8').split('\n');
        for (let rawLine of lines) {
            let line = rawLine.trim();
            if (!line) continue;
            let upper = line.toUpperCase();

            if (upper.includes('DEVOLUCION')) {
                const devMatch = upper.match(/DEVOLUCION\s+([A-ZÑÁÉÍÓÚ\s]+?)(?:\s+\d+|\s+\$|\s+-|\t|$)/);
                const amountMatch = line.match(/(?:-|\$)\s*([\d\.,]+)/) || line.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/);
                const dateMatch = line.match(/(\d{1,2}[\/\-](?:\d{1,2}|[a-zA-Z]{3})[\/\-]?(?:\d{2,4})?)/);

                if (devMatch) {
                    let devName = devMatch[1].replace(/[\d\-]/g, '').trim();
                    let devAmount = amountMatch ? cleanNumber(amountMatch[1]) : 0;
                    let devDate = dateMatch ? dateMatch[1].trim() : '';
                    if (devName.length > 3 && !devName.includes('CUENTA')) {
                        const devObj = { name: devName, amount: devAmount > 0 ? -devAmount : devAmount, date: devDate, file };
                        devolucionesList.push(devObj);
                        devolucionesByNormName.set(normalize(devName), devObj);
                    }
                }
            }

            if (upper.includes('POSNET') && !upper.includes('PRUEBA') && !upper.includes('TOTAL')) {
                const nameMatch = upper.match(/(?:POSNET.*?)(?:[0-9\.,]+\s+)?(?:[0-9]{1,2}-[A-Z]{3}\s+)?([A-ZÑÁÉÍÓÚ\s]+?)(?:\s*\$\s*|\s+[0-9\.,]+|\s+X\s+X|$)/);
                if (nameMatch) {
                    let pName = nameMatch[1].replace(/POSNET|\$|[0-9\-]/g, '').trim();
                    if (pName.length > 4 && !pName.includes('OFICINA')) {
                        methodIndex.set(normalize(pName), 'POSNET (OFICINA)');
                    }
                }
            }

            if (file.toUpperCase().includes('BANCO') || upper.includes('DEPÓSITOS BANCO GALICIA')) {
                const m = upper.match(/(?:BANCO GALICIA|DEPÓSITOS BANCO GALICIA)\s+([A-ZÑÁÉÍÓÚ\s]+?)\s+\d+/);
                if (m && m[1].trim().length > 3) methodIndex.set(normalize(m[1].trim()), 'BANCO GALICIA');
            }

            if (upper.includes('MERCADO PAGO') && !upper.includes('DEVOLUCION')) {
                const m = upper.match(/(?:MERCADO PAGO)\s+([A-ZÑÁÉÍÓÚ\s]+?)\s+\d+/);
                if (m && m[1].trim().length > 3) {
                    const norm = normalize(m[1].trim());
                    if (!methodIndex.has(norm)) methodIndex.set(norm, 'MERCADO PAGO');
                }
            }
        }
    }
}

function findMedio(name, cobrador, xOficina, bcoElect, observaciones, isJson) {
    const norm = normalize(name);
    
    // Si observaciones tiene RAPI o FACIL, etiquetar explícitamente como electrónico
    if (observaciones && (observaciones.toUpperCase().includes('RAPI') || observaciones.toUpperCase().includes('FACIL'))) {
        return 'RAPIPAGO / PAGO FACIL';
    }

    if (methodIndex.has(norm)) return methodIndex.get(norm);
    const tokens = norm.split(' ').filter(t => t.length > 3);
    for (const [key, method] of methodIndex) {
        let matches = 0;
        for (const t of tokens) if (key.includes(t)) matches++;
        if (matches >= 2) return method;
    }

    // Priorizar marcas explícitas de oficina en la planilla
    if (xOficina) return 'EFECTIVO / OFICINA';

    // Si está en el JSON de oficina, y no tiene transacciones bancarias, el default es Oficina
    if (isJson) {
        if (bcoElect) return 'BANCO / TRANSFERENCIA';
        return 'EFECTIVO / OFICINA';
    }

    // Si NO está en el JSON de oficina, y es cobrador 7 (o viene de planilla de medio elect), el default es electrónico
    if (Number(cobrador) === 7) {
        if (bcoElect) return 'BANCO / TRANSFERENCIA';
        return 'MERCADO PAGO';
    }

    if (bcoElect) return 'BANCO / TRANSFERENCIA';
    return 'EFECTIVO / OFICINA';
}

function findDevolucion(name) {
    const norm = normalize(name);
    if (devolucionesByNormName.has(norm)) return devolucionesByNormName.get(norm);
    const tokens = norm.split(' ').filter(t => t.length > 3);
    for (const [key, dev] of devolucionesByNormName) {
        let matches = 0;
        for (const t of tokens) if (key.includes(t)) matches++;
        if (matches >= 2) return dev;
    }
    return null;
}

// 3. Cargar Fuentes Principales
const carga14Map = new Map();
const f14 = path.join(BASE, 'CARGA CLIENTES ASESOR COBRANZAS 14 de agosto.xlsx');
if (fs.existsSync(f14)) {
    const rows = xlsx.utils.sheet_to_json(xlsx.readFile(f14).Sheets['Hoja1'], { header: 1 }).slice(1);
    for (const r of rows) {
        if (r[1] && !isNaN(Number(r[1]))) {
            carga14Map.set(String(r[1]), { fecha: excelSerialToDate(r[0]) || '14/08/2026', nombre: r[2] || '', importe: cleanNumber(r[3]), cobrador: r[4] || 7, medio: r[5] || 'MERCADO PAGO' });
        }
    }
}

// PALABRAS QUE IDENTIFICAN FILAS DE RESUMEN/CALCULO DEL EXCEL ORIGINAL
const EXCLUDED_WORDS = ['TOTAL', 'MOROSO', 'MOROSOS', 'BAJA', 'BAJAS', 'COBRANZA', 'CLIENTES', 'PAGADOS', 'SUBTOTAL', 'PARAMETRO', 'PARAMET'];

function isValidClientRow(cod, nombre, telefono) {
    if (cod === undefined || cod === null || cod === '') return false;
    const codNum = Number(cod);
    // COD debe ser entero positivo entre 1 y 9999
    if (isNaN(codNum) || codNum <= 0 || codNum > 9999 || Math.floor(codNum) !== codNum) return false;
    if (!nombre || typeof nombre !== 'string') return false;
    const upper = String(nombre).toUpperCase().trim();
    if (upper.length < 4) return false;
    // Excluir filas con palabras de resumen
    for (const excl of EXCLUDED_WORDS) {
        if (upper.includes(excl)) return false;
    }
    // El teléfono (r[2]) debe ser vacío o parecerse a un número de tel (max 15 chars, solo dígitos/guiones/espacios)
    if (telefono !== undefined && telefono !== null && telefono !== '') {
        const telStr = String(telefono).trim();
        if (telStr.length > 20) return false;           // Si es muy largo, es texto de resumen
        if (/[a-zA-Z>\-\u2192]{3,}/.test(telStr)) return false; // Si tiene letras largas, es texto
    }
    return true;
}

const agosto26Map = new Map();
const fAgosto = path.join(BASE, '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
if (fs.existsSync(fAgosto)) {
    const rows = xlsx.utils.sheet_to_json(xlsx.readFile(fAgosto).Sheets['AUTOHOGAR'], { header: 1 }).slice(3);
    for (const r of rows) {
        if (!isValidClientRow(r[0], r[1], r[2])) continue;
        agosto26Map.set(String(r[0]), {
            cod: r[0],
            nombre: String(r[1]).trim(),
            telefono: formatPhone(r[2]),
            localidad: String(r[3] || '').trim(),
            soli: r[4] ? Number(r[4]) : '',
            cuotaActual: r[5] ? Number(r[5]) : '',
            valorCuota: cleanNumber(r[6]),
            arrastre: cleanNumber(r[7]),
            pagoAdelanto: cleanNumber(r[9]),
            conMora: cleanNumber(r[13]),
            pagoMesAnt: excelSerialToDate(r[18]),
            cobrador: r[23] ? Number(r[23]) : 7,
            comision: cleanNumber(r[25]),
            xOficina: r[11] ? true : false,
            bcoElect: r[12] ? true : false,
            observaciones: r[21] ? String(r[21]).trim() : ''
        });
    }
    console.log('Agosto 2026 filas válidas:', agosto26Map.size);
}

const enero25Map = new Map();
const fEnero = path.join(BASE, '07 Clientes de pago electronico  de ENERO 2025.xlsx');
if (fs.existsSync(fEnero)) {
    const rows = xlsx.utils.sheet_to_json(xlsx.readFile(fEnero).Sheets['AUTOHOGAR'], { header: 1 }).slice(3);
    for (const r of rows) {
        if (!isValidClientRow(r[0], r[1], r[2])) continue;
        enero25Map.set(String(r[0]), {
            cod: r[0],
            nombre: String(r[1]).trim(),
            telefono: formatPhone(r[2]),
            localidad: String(r[3] || '').trim(),
            soli: r[4] ? Number(r[4]) : '',
            valorCuotaEne25: cleanNumber(r[6]),
            arrastreEne25: cleanNumber(r[7]),
            cobrador: r[23] ? Number(r[23]) : 7,
            xOficina: r[11] ? true : false,
            bcoElect: r[12] ? true : false,
            observaciones: r[21] ? String(r[21]).trim() : ''
        });
    }
    console.log('Enero 2025 filas válidas:', enero25Map.size);
}

let jsonData = [];
const fJson = path.join(BASE, 'extracted_clients_august_2026.json');
if (fs.existsSync(fJson)) jsonData = JSON.parse(fs.readFileSync(fJson, 'utf8'));
const jsonByCod = new Map();
for (const j of jsonData) jsonByCod.set(String(j.cod), j);

// Cargar códigos originales de oficina desde la Base Maestra
const fOfficeBase = path.join(BASE, 'Base_Maestra_Autohogar.csv');
const officeCodsSet = new Set();
if (fs.existsSync(fOfficeBase)) {
    const content = fs.readFileSync(fOfficeBase, 'utf8');
    content.split('\n').forEach(l => {
        const parts = l.split(',');
        if (parts[0] && !isNaN(Number(parts[0]))) {
            officeCodsSet.add(parts[0].trim());
        }
    });
}
console.log('Original office clients from Base Maestra:', officeCodsSet.size);

// 4. Armar las 4 Estructuras Separadas
const allCods = new Set([...Array.from(agosto26Map.keys()), ...Array.from(enero25Map.keys())]);

const sheet1_Clientes = [];
const sheet2_Financiero = [];
const sheet3_CargaDiaria = [];
const sheet4_Transacciones = [];
const sheet5_Oficina = [];
const sheet6_Electronicos = [];
const sheet7_Actualizaciones = [];

for (const cod of allCods) {
    const a26 = agosto26Map.get(cod);
    const e25 = enero25Map.get(cod);
    const j = jsonByCod.get(cod);
    const c14 = carga14Map.get(cod);

    const nombre = (a26 && a26.nombre) || (j && j.name) || (e25 && e25.nombre) || '';
    if (!nombre) continue;

    const telefono = (a26 && a26.telefono) || (j && j.phone && formatPhone(j.phone)) || (e25 && e25.telefono) || '';
    const localidad = (j && j.city) || (a26 && a26.localidad) || (e25 && e25.localidad) || '';
    const soli = (j && j.soli) || (a26 && a26.soli) || (e25 && e25.soli) || '';
    const dni = (j && j.dni) || '';
    const direccion = (j && j.address) || '';
    const plan = (j && j.plan) || '';
    const cuotaActualNro = (j && j.cuotaNum) || (a26 && a26.cuotaActual) || '';
    
    let valorCuota = (c14 && c14.importe) || (j && cleanNumber(j.amount)) || (a26 && a26.valorCuota) || (e25 && e25.valorCuotaEne25) || 0;
    if (valorCuota === 0 || valorCuota === 99999 || valorCuota === 99999.99) {
        const codStr = String(cod);
        if (codStr === '2964') valorCuota = 100000;
        else if (codStr === '3250') valorCuota = 100000;
        else if (codStr === '3006') valorCuota = 200000;
        else if (codStr === '3381') valorCuota = 100000;
        else if (codStr === '3315') valorCuota = 70000;
        else if (codStr === '3371') valorCuota = 70000;
        else if (codStr === '2747') valorCuota = 100000;
        else if (codStr === '3235') valorCuota = 90000;
        else valorCuota = 0;
    }
    const observaciones = (a26 && a26.observaciones) || (e25 && e25.observaciones) || '';
    const rawCobrador = (c14 && c14.cobrador) || (a26 && a26.cobrador) || (e25 && e25.cobrador) || 7;
    const isOfficeClient = officeCodsSet.has(String(cod));
    const medioPago = (c14 && c14.medio) || findMedio(nombre, rawCobrador, a26 && a26.xOficina, a26 && a26.bcoElect, observaciones, isOfficeClient);
    
    // Si está en el set de oficina y NO paga con Pago Fácil/Rapipago, es cobrador 2. Si no, es cobrador 7 (remoto).
    const isRapiFacil = medioPago.includes('RAPIPAGO') || medioPago.includes('PAGO FACIL');
    const cobrador = (isOfficeClient && !isRapiFacil) ? 2 : 7;

    const arrastre = (a26 && a26.arrastre !== undefined) ? a26.arrastre : ((e25 && e25.arrastreEne25) || 0);
    const pagoAdelanto = (a26 && a26.pagoAdelanto) || (arrastre > 0 ? arrastre : 0);
    const conMora = (a26 && a26.conMora) || (arrastre < 0 ? Math.abs(arrastre) : 0);
    const pagoMesAnt = (a26 && a26.pagoMesAnt) || '';
    const cuotaEne25 = (e25 && e25.valorCuotaEne25) || 0;
    const comision = (a26 && a26.comision) || (valorCuota > 0 ? valorCuota : 0);

    const devInfo = findDevolucion(nombre);

    // 1. HOJA MAESTRA CLIENTES (DATOS ATÓMICOS, SIN CÁLCULOS MEZCLADOS)
    sheet1_Clientes.push({
        'COD': Number(cod),
        'SOLI': soli ? Number(soli) || soli : '',
        'CLIENTE': nombre,
        'DNI': dni || '',
        'TELEFONO': telefono,
        'DIRECCION': direccion,
        'LOCALIDAD': localidad,
        'PLAN': plan,
        'N° CUOTA ACTUAL': cuotaActualNro ? Number(cuotaActualNro) || cuotaActualNro : '',
        'VALOR CUOTA ($)': valorCuota,
        'ADELANTO ENTREGA ($)': 0,
        'ADELANTO CUOTAS ($)': 0,
        'N° COBRADOR': Number(cobrador) || cobrador,
        'MEDIO DE PAGO': medioPago,
        'ESTADO': devInfo ? 'REINTEGRO / BAJA' : 'ACTIVO',
        'HISTORIAL 5 PAGOS': (j && j.history) ? j.history.trim() : ''
    });

    // 2. HOJA DE ESTADO FINANCIERO Y CÁLCULOS (SEPARADA Y LIMPIA)
    const cuotaNumInt = parseInt(cuotaActualNro) || 0;
    const capitalTotalEst = cuotaNumInt > 0 && valorCuota > 0 ? (cuotaNumInt * valorCuota) : 0;

    sheet2_Financiero.push({
        'COD': Number(cod),
        'CLIENTE': nombre,
        'VALOR CUOTA ($)': valorCuota,
        'ARRASTRE TOTAL ($)': arrastre,
        'ADELANTO ENTREGA ($)': 0,
        'ADELANTO CUOTAS ($)': pagoAdelanto,
        'DEUDA / MORA ($)': conMora,
        'DEVOLUCION ($)': devInfo ? devInfo.amount : 0,
        'FECHA PAGO MES ANTERIOR': pagoMesAnt,
        'VALOR CUOTA (ENE 2025)': cuotaEne25,
        'VARIACION CUOTA ($)': (cuotaEne25 > 0 && valorCuota > 0) ? (valorCuota - cuotaEne25) : 0,
        'COMISION COBRADOR ($)': comision,
        'CAPITAL TOTAL PAGADO ESTIMADO ($)': capitalTotalEst
    });

    // 3. HOJA DE CARGA DIARIA (FORMATO EXACTO AL 14 DE AGOSTO)
    if (medioPago.includes('OFICINA') || medioPago.includes('POSNET') || cobrador == 2) {
        sheet3_CargaDiaria.push({
            'FECHA': '14/08/2026',
            'N° CLIENTE': Number(cod),
            'NOMBRE': nombre,
            'IMPORTE': valorCuota,
            'N°  COBRADOR': Number(cobrador) || cobrador,
            'MEDIO DE PAGO': medioPago
        });
    }

    // 4. TRANSACCIONES
    if (j && j.history) {
        const dates = j.history.split('-').map(d => d.trim()).filter(d => d.length > 0);
        for (let i = 0; i < dates.length; i++) {
            sheet4_Transacciones.push({
                'ID_TRANSACCION': `TR-${cod}-${dates[i].replace(/\//g, '')}`,
                'COD_CLIENTE': Number(cod),
                'CLIENTE': nombre,
                'NRO_CUOTA': cuotaNumInt > 0 ? (cuotaNumInt - i) : '',
                'FECHA_PAGO': dates[i],
                'IMPORTE ($)': valorCuota,
                'MEDIO_DE_PAGO': medioPago,
                'LUGAR': medioPago.includes('OFICINA') ? 'OFICINA SAN JUAN' : 'MEDIOS DIGITALES',
                'TIPO': 'CUOTA ORDINARIA'
            });
        }
    }

    if (devInfo) {
        sheet4_Transacciones.push({
            'ID_TRANSACCION': `DEV-${cod}-${(devInfo.date || 'SD').replace(/[\/\-]/g, '')}`,
            'COD_CLIENTE': Number(cod),
            'CLIENTE': nombre,
            'NRO_CUOTA': '-',
            'FECHA_PAGO': devInfo.date || '2026',
            'IMPORTE ($)': devInfo.amount,
            'MEDIO_DE_PAGO': 'MERCADO PAGO',
            'LUGAR': 'REINTEGRO CENTRAL',
            'TIPO': 'DEVOLUCION / REINTEGRO'
        });
    }

    // 5. REGISTRAR ACTUALIZACIÓN / COMPARATIVA DE ACTIVIDAD
    if (e25 && a26) {
        const cambios = [];
        if (e25.valorCuotaEne25 !== a26.valorCuota) {
            cambios.push(`Monto Cuota: $${e25.valorCuotaEne25} -> $${a26.valorCuota}`);
        }
        if (e25.arrastreEne25 !== a26.arrastre) {
            cambios.push(`Arrastre: $${e25.arrastreEne25} -> $${a26.arrastre}`);
        }
        const cuotaNumEne = parseInt(e25.cuotaActual) || 0;
        const cuotaNumAgo = parseInt(a26.cuotaActual) || 0;
        if (cuotaNumEne !== cuotaNumAgo && cuotaNumAgo > 0) {
            cambios.push(`N° Cuota: ${cuotaNumEne} -> ${cuotaNumAgo}`);
        }

        if (cambios.length > 0) {
            sheet7_Actualizaciones.push({
                'COD_CLIENTE': Number(cod),
                'CLIENTE': nombre,
                'FECHA_CAMBIO': 'Agosto 2026',
                'OPERADOR': 'Sistema (Histórico)',
                'CONCEPTO': 'Variación Histórica',
                'DETALLE_CAMBIO': cambios.join(' | ')
            });
        }
    }

    if (c14) {
        sheet7_Actualizaciones.push({
            'COD_CLIENTE': Number(cod),
            'CLIENTE': nombre,
            'FECHA_CAMBIO': c14.fecha || '14/08/2026',
            'OPERADOR': cobrador === 2 ? 'Florencia (Oficina)' : 'Operador (Remoto)',
            'CONCEPTO': 'Cobro Procesado (Novedad)',
            'DETALLE_CAMBIO': `Pago Cargado: $${c14.importe} via ${medioPago}`
        });
    }

    // 6. CONSTRUIR PLANILLA INDIVIDUAL CON DISEÑO ORIGINAL 07 DE 27 COLUMNAS
    const row07 = {
        'COD': Number(cod),
        'CLIENTE': nombre,
        'TELEFONO': telefono,
        'LOCALIDAD': localidad,
        'SOLI': soli ? Number(soli) || soli : '',
        'CTA': cuotaActualNro ? Number(cuotaActualNro) || cuotaActualNro : '',
        'CUOTAS': valorCuota,
        'ARRASTRE': arrastre,
        'PAGO': c14 ? c14.importe : '',
        'ADELANTO ENTREGA': '',
        'ADELANTO CUOTAS': pagoAdelanto > 0 ? pagoAdelanto : '',
        'PAGO X ADEL': pagoAdelanto,
        'PAGO ANTES': arrastre > 0 ? arrastre : 0,
        'X OFICINA': cobrador === 2 ? 'X' : '',
        'BCO O ELECT': cobrador === 7 ? 'X' : '',
        'CON MORA': conMora,
        'SISTEMA': '',
        'PLANILLA SALIDA': '',
        'PAGO ': '',
        'PAGARA': '',
        'PAGO MES ANT': pagoMesAnt,
        'BAJA': devInfo ? 'SI' : '',
        'MOTIVO': devInfo ? 'DEVOLUCION' : '',
        'OBSERVACIONES': observaciones,
        'TERMOMETRO': '',
        'COB ': cobrador,
        'COB XX': cobrador,
        'COMISION': comision,
        'PAGARA ': ''
    };

    if (cobrador === 2) {
        sheet5_Oficina.push(row07);
    } else {
        sheet6_Electronicos.push(row07);
    }
}

// 6. Guardar CSVs individuales
function exportCSV(data, filename) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    for (const r of data) {
        csv += headers.map(h => {
            const val = r[h] !== undefined && r[h] !== null ? r[h].toString().replace(/"/g, '""') : '';
            return `"${val}"`;
        }).join(',') + '\n';
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), csv, 'utf8');
}

exportCSV(sheet1_Clientes, '1_CLIENTES_MAESTRA.csv');
exportCSV(sheet2_Financiero, '2_ESTADO_FINANCIERO_Y_CALCULOS.csv');
exportCSV(sheet3_CargaDiaria, '3_CARGA_DIARIA_OFICINA.csv');
exportCSV(sheet4_Transacciones, '4_HISTORIAL_TRANSACCIONES.csv');
exportCSV(sheet5_Oficina, 'PLANILLA_COBRO_OFICINA.csv');
exportCSV(sheet6_Electronicos, 'PLANILLA_COBRO_ELECTRONICO.csv');
exportCSV(sheet7_Actualizaciones, 'ACTUALIZACION_COBRANZAS.csv');

// 7. Guardar Workbook Excel Unificado Multihas (.xlsx)
const wb = xlsx.utils.book_new();

const ws1 = xlsx.utils.json_to_sheet(sheet1_Clientes);
ws1['!cols'] = [{wch:8},{wch:10},{wch:32},{wch:12},{wch:15},{wch:30},{wch:20},{wch:30},{wch:16},{wch:16},{wch:12},{wch:24},{wch:18},{wch:45}];
xlsx.utils.book_append_sheet(wb, ws1, '1_CLIENTES_MAESTRA');

const ws2 = xlsx.utils.json_to_sheet(sheet2_Financiero);
ws2['!cols'] = [{wch:8},{wch:32},{wch:16},{wch:18},{wch:20},{wch:18},{wch:16},{wch:24},{wch:22},{wch:20},{wch:20},{wch:32}];
xlsx.utils.book_append_sheet(wb, ws2, '2_CALCULOS_FINANCIEROS');

const ws3 = xlsx.utils.json_to_sheet(sheet3_CargaDiaria);
ws3['!cols'] = [{wch:14},{wch:12},{wch:32},{wch:14},{wch:14},{wch:24}];
xlsx.utils.book_append_sheet(wb, ws3, '3_CARGA_DIARIA_14_AGO');

const ws4 = xlsx.utils.json_to_sheet(sheet4_Transacciones);
ws4['!cols'] = [{wch:18},{wch:12},{wch:32},{wch:12},{wch:14},{wch:14},{wch:24},{wch:20},{wch:24}];
xlsx.utils.book_append_sheet(wb, ws4, '4_TRANSACCIONES');

const cols07 = [
    {wch:8},  // COD
    {wch:32}, // CLIENTE
    {wch:15}, // TELEFONO
    {wch:20}, // LOCALIDAD
    {wch:10}, // SOLI
    {wch:8},  // CTA
    {wch:10}, // CUOTAS
    {wch:10}, // ARRASTRE
    {wch:10}, // PAGO
    {wch:12}, // PAGO X ADEL
    {wch:12}, // PAGO ANTES
    {wch:12}, // X OFICINA
    {wch:14}, // BCO O ELECT
    {wch:12}, // CON MORA
    {wch:10}, // SISTEMA
    {wch:16}, // PLANILLA SALIDA
    {wch:10}, // PAGO
    {wch:10}, // PAGARA
    {wch:16}, // PAGO MES ANT
    {wch:10}, // BAJA
    {wch:15}, // MOTIVO
    {wch:35}, // OBSERVACIONES
    {wch:12}, // TERMOMETRO
    {wch:8},  // COB
    {wch:8},  // COB XX
    {wch:12}, // COMISION
    {wch:10}  // PAGARA
];

const ws5 = xlsx.utils.json_to_sheet(sheet5_Oficina);
ws5['!cols'] = cols07;
xlsx.utils.book_append_sheet(wb, ws5, 'PLANILLA_OFICINA');

const ws6 = xlsx.utils.json_to_sheet(sheet6_Electronicos);
ws6['!cols'] = cols07;
xlsx.utils.book_append_sheet(wb, ws6, 'PLANILLA_MEDIOS_ELECTRONICOS');

const ws7 = xlsx.utils.json_to_sheet(sheet7_Actualizaciones);
ws7['!cols'] = [{wch:12},{wch:32},{wch:16},{wch:24},{wch:28},{wch:50}];
xlsx.utils.book_append_sheet(wb, ws7, 'ACTUALIZACION_COBRANZAS');

const xlsxOutPath = path.join(OUTPUT_DIR, 'SISTEMA_AUTOHOGAR_CONSOLIDADO.xlsx');
xlsx.writeFile(wb, xlsxOutPath);

// Enriquecer y guardar el JSON maestro para que el generador de recibos y la App tengan todos los 446 clientes
const enrichedJSON = sheet1_Clientes.map(c => {
    const orig = jsonByCod.get(String(c.COD)) || {};
    return {
        cod: c.COD,
        soli: c.SOLI,
        name: c.CLIENTE,
        dni: c.DNI || orig.dni || '',
        address: c.DIRECCION || orig.address || '',
        city: c.LOCALIDAD || orig.city || '',
        plan: c.PLAN || orig.plan || '',
        cuotaNum: c['N° CUOTA ACTUAL'] || orig.cuotaNum || '',
        dueDate: orig.dueDate || '15/08/2026',
        phone: c.TELEFONO || orig.phone || '',
        amount: c['VALOR CUOTA ($)'] || orig.amount || 0,
        history: c['HISTORIAL 5 PAGOS'] || orig.history || ''
    };
});
fs.writeFileSync(path.join(BASE, 'extracted_clients_august_2026.json'), JSON.stringify(enrichedJSON, null, 2), 'utf8');

console.log('=== WORKBOOK Y CSVS GENERADOS EXITOSAMENTE ===');
console.log('1_CLIENTES_MAESTRA:', sheet1_Clientes.length, 'filas');
console.log('2_CALCULOS_FINANCIEROS:', sheet2_Financiero.length, 'filas');
console.log('3_CARGA_DIARIA_OFICINA:', sheet3_CargaDiaria.length, 'filas (formato exacto 14 agosto)');
console.log('4_HISTORIAL_TRANSACCIONES:', sheet4_Transacciones.length, 'filas');
console.log('PLANILLA_OFICINA (Segregada):', sheet5_Oficina.length, 'filas');
console.log('PLANILLA_MEDIOS_ELECTRONICOS (Segregada):', sheet6_Electronicos.length, 'filas');
console.log('Archivo Excel Unificado:', xlsxOutPath);
console.log('JSON Maestro Actualizado con 446 clientes:', path.join(BASE, 'extracted_clients_august_2026.json'));
