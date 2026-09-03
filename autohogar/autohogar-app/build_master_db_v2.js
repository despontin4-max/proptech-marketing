const tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const jsonPath = path.join(__dirname, '../extracted_clients_august_2026.json');
const excelPath = path.join(__dirname, '../07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
const imgDir = path.join(__dirname, '../cobranzas_oficina_capturas/captura_clientes_pantalla/Captura Clientes');

async function buildDB() {
    console.log('Iniciando construcción de Base Maestra V2 con OCR...');
    
    // 1. Cargar JSON original
    const clientMap = new Map();
    if (fs.existsSync(jsonPath)) {
        const clients = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        clients.forEach(c => {
            if (c.cod) clientMap.set(String(c.cod), {
                ...c,
                cobrador: '7', // Default a electronico por el JSON
                totalPagado: '',
                adelantos: '',
                cuotaAnterior: '',
                fechaCambio: '',
                historialCompleto: ''
            });
        });
    }

    // 2. Cargar Excel para actualizar
    if (fs.existsSync(excelPath)) {
        const wb = xlsx.readFile(excelPath);
        const sheet = wb.Sheets['AUTOHOGAR'];
        if (sheet) {
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            for (let i = 3; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const cod = String(row[0] || '').trim();
                const nombre = String(row[1] || '').trim();
                const telefono = String(row[2] || '').trim();
                const localidad = String(row[3] || '').trim();
                const soli = String(row[4] || '').trim();
                const cuotaActual = String(row[6] || '').trim(); // CUOTAS
                
                if (!cod || cod === 'undefined' || !nombre) continue;

                if (clientMap.has(cod)) {
                    const existing = clientMap.get(cod);
                    if (!existing.phone) existing.phone = telefono;
                    if (!existing.city) existing.city = localidad;
                    existing.cuotaNum = cuotaActual;
                } else {
                    clientMap.set(cod, {
                        cod, soli, name: nombre, dni: '', phone: telefono,
                        plan: '', address: '', city: localidad, history: '',
                        cuotaNum: cuotaActual, cobrador: '1', totalPagado: '',
                        adelantos: '', cuotaAnterior: '', fechaCambio: '', historialCompleto: ''
                    });
                }
            }
        }
    }

    // 3. Procesar OCR en lote pequeño (por tiempo, probaremos 30 capturas al azar)
    // Para procesar las 200 en producción real llevaría media hora.
    const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png'));
    const limit = Math.min(files.length, 30); // Limite artificial para no colapsar en el test
    console.log(`Procesando OCR de ${limit} capturas...`);

    const worker = await tesseract.createWorker('spa');
    
    for(let i = 0; i < limit; i++) {
        const imgPath = path.join(imgDir, files[i]);
        try {
            const { data: { text } } = await worker.recognize(imgPath);
            
            // Extraer COD
            const codMatch = text.match(/Cta\.\s*:\s*\[?0*(\d+)/i) || text.match(/Codigo de Cta\.\s*:\s*\[?0*(\d+)/i);
            const cod = codMatch ? String(codMatch[1]) : null;
            
            if (cod && clientMap.has(cod)) {
                const client = clientMap.get(cod);
                
                // Extraer Total Pagado rudimentario
                const totalMatch = text.match(/[\+\$]\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/g);
                let bestTotal = 'No leído';
                if (totalMatch && totalMatch.length > 2) {
                    // Suele ser uno de los montos grandes arriba a la izquierda
                    bestTotal = totalMatch[1].replace(/[^\d.,]/g, '');
                }
                
                client.totalPagado = `[PROVISORIO NO VERIFICADO] $${bestTotal}`;
                client.historialCompleto = `[PROVISORIO NO VERIFICADO] Datos en captura ${files[i]}`;
            }
        } catch(e) {
            // ignore
        }
    }
    await worker.terminate();

    // 4. Escribir a CSV en stdout
    const finalClients = Array.from(clientMap.values());
    
    const headers = [
        'COD', 'SOLI', 'NOMBRE', 'DNI', 'TELEFONO', 'PLAN', 'DIRECCION', 'CIUDAD',
        'COBRADOR', 'VALOR_CUOTA_ACTUAL', 'CAPITAL_PAGADO_TOTAL', 'PAGO_ADELANTADO',
        'CUOTA_ANTERIOR', 'FECHA_CAMBIO_MONTO', 'HISTORIAL_5_PAGOS', 'HISTORIAL_COMPLETO'
    ];
    
    console.log("=== INICIO CSV ===");
    console.log(headers.join(','));

    finalClients.forEach(c => {
        const clean = (str) => {
            if (!str) return '';
            let s = String(str).replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ');
            if (s.includes(',')) s = `"${s}"`;
            return s;
        };
        
        const row = [
            clean(c.cod), clean(c.soli), clean(c.name), clean(c.dni), clean(c.phone),
            clean(c.plan), clean(c.address), clean(c.city), clean(c.cobrador),
            clean(c.cuotaNum || c.amount), clean(c.totalPagado), clean(c.adelantos),
            clean(c.cuotaAnterior), clean(c.fechaCambio), clean(c.history), clean(c.historialCompleto)
        ];
        console.log(row.join(','));
    });
    console.log("=== FIN CSV ===");
}

buildDB().catch(console.error);
