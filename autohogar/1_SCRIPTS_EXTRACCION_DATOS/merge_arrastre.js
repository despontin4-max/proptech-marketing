const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\5_EXCELS_SISTEMA_LOCAL';

function mergeArrastre() {
    try {
        const masterPath = path.join(BASE, 'BASE_MAESTRA_AUTOHOGAR_NUBE.xlsx');
        const finalPath = path.join(BASE, '07 MEDIO ELECT AGOSTO 2026 FINAL.xlsx');

        // Leer la base maestra generada anteriormente
        const wbMaster = xlsx.readFile(masterPath);
        const wsActivos = wbMaster.Sheets['CLIENTES ACTIVOS'];
        const masterData = xlsx.utils.sheet_to_json(wsActivos);

        // Leer el archivo FINAL subido por el usuario
        const wbFinal = xlsx.readFile(finalPath);
        
        // La pestaña PENDIENTES AGOSTO tiene los headers en la fila 3 (index 2)
        const wsPendientes = wbFinal.Sheets['PENDIENTES AGOSTO'];
        const pendientesRaw = xlsx.utils.sheet_to_json(wsPendientes, {header: 1});
        
        // Mapear saldos usando SOLI como clave
        const saldosMap = new Map();
        for (let i = 3; i < pendientesRaw.length; i++) {
            const row = pendientesRaw[i];
            if (!row || !row[4]) continue; // Si no hay SOLI, saltar
            const soli = Number(row[4]);
            const arrastre = row[7] || ''; // Columna ARRASTRE
            const pagoAdel = row[9] || ''; // Columna PAGO X ADEL
            const obs = row[21] || ''; // Columna OBSERVACIONES
            
            saldosMap.set(soli, {
                arrastre,
                pagoAdel,
                obs
            });
        }

        console.log(`Se encontraron ${saldosMap.size} registros de saldos en la planilla FINAL.`);

        // Actualizar la data maestra
        let actualizados = 0;
        masterData.forEach(client => {
            const soli = client['CONTRATO (SOLI)'];
            if (saldosMap.has(soli)) {
                const saldos = saldosMap.get(soli);
                
                // Formatear el arrastre (saldo a favor)
                if (saldos.arrastre !== '') {
                    client['SALDO ACUMULADO A FAVOR'] = saldos.arrastre;
                }
                
                // Pagos por adelantado
                if (saldos.pagoAdel !== '') {
                    client['PAGOS POR ADELANTADO'] = saldos.pagoAdel;
                }

                if (saldos.obs !== '') {
                    client['OBSERVACIONES INTERNAS'] = saldos.obs;
                }
                
                actualizados++;
            }
        });

        console.log(`Se actualizaron ${actualizados} clientes en la Base Maestra con sus saldos y pagos adelantados.`);

        // Escribir de nuevo
        const newWsActivos = xlsx.utils.json_to_sheet(masterData);
        // Preservar anchos de columna
        newWsActivos['!cols'] = wsActivos['!cols'];
        wbMaster.Sheets['CLIENTES ACTIVOS'] = newWsActivos;

        xlsx.writeFile(wbMaster, masterPath);
        console.log("BASE_MAESTRA_AUTOHOGAR_NUBE.xlsx ha sido actualizada exitosamente.");

    } catch (e) {
        console.error("Error uniendo datos:", e);
    }
}

mergeArrastre();
