const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const jsonPath = path.join(__dirname, '../extracted_clients_august_2026.json');
const excelPath = path.join(__dirname, '../07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
const outputPath = path.join(__dirname, '../Base_Maestra_Autohogar.csv');

async function buildDB() {
    console.log('Iniciando construcción de Base Maestra...');
    
    // 1. Cargar JSON original
    let clients = [];
    if (fs.existsSync(jsonPath)) {
        clients = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`Cargados ${clients.length} clientes del JSON.`);
    }

    // Convertir a un mapa para búsqueda rápida por COD
    const clientMap = new Map();
    clients.forEach(c => {
        if (c.cod) clientMap.set(String(c.cod), c);
    });

    // 2. Cargar Excel para actualizar/agregar
    if (fs.existsSync(excelPath)) {
        const wb = xlsx.readFile(excelPath);
        const sheet = wb.Sheets['AUTOHOGAR']; // Asumiendo que es la primera hoja importante
        if (sheet) {
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            console.log(`Leídas ${data.length} filas del Excel.`);
            
            // Fila 3 en adelante tiene los datos (índice 3)
            for (let i = 3; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const cod = String(row[0] || '').trim();
                const nombre = String(row[1] || '').trim();
                const telefono = String(row[2] || '').trim();
                const localidad = String(row[3] || '').trim();
                const soli = String(row[4] || '').trim();
                
                if (!cod || cod === 'undefined' || !nombre) continue;

                if (clientMap.has(cod)) {
                    // Actualizar
                    const existing = clientMap.get(cod);
                    if (!existing.phone || existing.phone === '') existing.phone = telefono;
                    if (!existing.city || existing.city === '') existing.city = localidad;
                    // No sobreescribimos nombre o DNI si ya están bien en el JSON
                } else {
                    // Agregar nuevo (faltará DNI y Plan, pero sirve de base)
                    clientMap.set(cod, {
                        cod: cod,
                        soli: soli,
                        name: nombre,
                        dni: '',
                        phone: telefono,
                        plan: '',
                        address: '',
                        city: localidad,
                        history: ''
                    });
                }
            }
        }
    }

    // 3. Escribir a CSV
    const finalClients = Array.from(clientMap.values());
    console.log(`Total clientes consolidados: ${finalClients.length}`);

    // CSV Header
    const headers = ['COD', 'SOLI', 'NOMBRE', 'DNI', 'TELEFONO', 'PLAN', 'DIRECCION', 'CIUDAD', 'HISTORIAL'];
    let csvContent = headers.join(',') + '\n';

    finalClients.forEach(c => {
        // Limpiar comas y comillas para CSV
        const clean = (str) => {
            if (!str) return '';
            let s = String(str).replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ');
            if (s.includes(',')) s = `"${s}"`;
            return s;
        };
        
        const row = [
            clean(c.cod),
            clean(c.soli),
            clean(c.name),
            clean(c.dni),
            clean(c.phone),
            clean(c.plan),
            clean(c.address),
            clean(c.city),
            clean(c.history)
        ];
        csvContent += row.join(',') + '\n';
    });

    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`Base maestra guardada en: ${outputPath}`);
}

buildDB().catch(console.error);
