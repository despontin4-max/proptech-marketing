import { contratos, propiedades, inquilinos, ipcHistorial, calcularNuevoCanon, formatPeso, getInquilino } from '../data.js'

export function renderContratos() {
    const statusClass = { 'Al día': 'badge-success', 'Pendiente': 'badge-warning', 'Vencido': 'badge-danger' }

    document.getElementById('content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
      <div>
        <h1 style="font-size:1.875rem;margin-bottom:0.25rem;">Contratos</h1>
        <p style="color:var(--text-muted);font-size:0.875rem;">${contratos.length} contratos activos</p>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:1.5rem;">
      ${contratos.map(c => {
        const prop = propiedades.find(p => p.id === c.propiedadId)
        const inq = getInquilino(c.inquilinoId)
        const diasRestantes = Math.floor((new Date(c.fechaFin) - new Date()) / (1000 * 60 * 60 * 24))
        const ultimoIpc = ipcHistorial[ipcHistorial.length - 1]
        const canonNuevo = calcularNuevoCanon(c.canonActual, ultimoIpc.porcentaje)
        return `
        <div class="card-container">
          <div class="card-header" style="background:#f9fafb;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <div style="width:42px;height:42px;background:var(--primary);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                <i data-lucide="file-text" style="width:20px;height:20px;color:white;"></i>
              </div>
              <div>
                <div style="font-weight:700;">Contrato N° ${c.numero}</div>
                <div style="font-size:0.8125rem;color:var(--text-muted);">${prop?.nombre ?? '-'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:1rem;">
              <span class="badge ${statusClass[c.estadoPago] ?? ''}">${c.estadoPago}</span>
              <button class="btn btn-primary btn-ver-contrato" data-id="${c.id}" style="padding:0.4rem 1rem;font-size:0.8125rem;">
                Ver detalle
              </button>
              <button class="btn btn-ipc" data-id="${c.id}" data-canon="${c.canonActual}" data-nuevo="${canonNuevo}"
                style="padding:0.4rem 1rem;font-size:0.8125rem;background:rgba(11,80,218,0.08);color:var(--primary);border:1px solid rgba(11,80,218,0.2);">
                <i data-lucide="trending-up" style="width:14px;height:14px;"></i>Ajustar IPC
              </button>
            </div>
          </div>
          <div style="padding:1.25rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(150px,1fr));gap:1rem;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Inquilino</div>
              <div style="font-weight:600;font-size:0.9rem;">${inq?.razonSocial ?? '-'}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Canon Actual</div>
              <div style="font-weight:700;color:var(--secondary);font-size:1rem;">${formatPeso(c.canonActual)}${c.iva ? ' + IVA' : ''}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Próx. Vencimiento</div>
              <div style="font-weight:600;">${new Date(c.proximoVencimiento).toLocaleDateString('es-AR')}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Vence contrato</div>
              <div style="font-weight:600;color:${diasRestantes < 180 ? '#b45309' : 'inherit'};">
                ${new Date(c.fechaFin).toLocaleDateString('es-AR')} <small style="color:var(--text-muted);">(${diasRestantes} días)</small>
              </div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Actualización</div>
              <div style="font-weight:600;">${c.tipoActualizacion}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">Mora (por día)</div>
              <div style="font-weight:600;">${c.moradiaria}% del canon</div>
            </div>
          </div>
        </div>`
    }).join('')}
    </div>

    <!-- IPC Panel -->
    <div class="card-container" style="margin-top:2rem;">
      <div class="card-header">
        <h2 style="font-size:1.125rem;font-weight:700;">Historial IPC Trimestral</h2>
        <span style="font-size:0.8125rem;color:var(--text-muted);">Fuente: INDEC (datos de ejemplo)</span>
      </div>
      <div style="padding:1.25rem;display:flex;gap:1rem;flex-wrap:wrap;">
        ${ipcHistorial.map(ipc => `
          <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:0.875rem 1.25rem;text-align:center;min-width:130px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.2rem;">${ipc.periodo}</div>
            <div style="font-size:1.5rem;font-weight:800;color:var(--primary);">+${ipc.porcentaje}%</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">${ipc.mes}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `
    lucide.createIcons()

    // Attach event handlers
    document.querySelectorAll('.btn-ver-contrato').forEach(btn => {
        btn.addEventListener('click', () => showContratoDetail(btn.getAttribute('data-id')))
    })
    document.querySelectorAll('.btn-ipc').forEach(btn => {
        btn.addEventListener('click', () => showIpcModal(btn.getAttribute('data-id'), +btn.getAttribute('data-canon'), +btn.getAttribute('data-nuevo')))
    })
}

function showIpcModal(contratoId, canonActual, canonNuevo) {
    const contrato = contratos.find(c => c.id === contratoId)
    const ultimoIpc = ipcHistorial[ipcHistorial.length - 1]
    const diferencia = canonNuevo - canonActual
    const modal = document.createElement('div')
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:480px;max-width:95vw;">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <div style="width:56px;height:56px;background:rgba(11,80,218,0.08);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
          <i data-lucide="trending-up" style="color:var(--primary);width:24px;height:24px;"></i>
        </div>
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:0.25rem;">Ajuste por IPC</h2>
        <p style="color:var(--text-muted);font-size:0.875rem;">Período ${ultimoIpc.periodo} – ${ultimoIpc.mes}</p>
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <span style="color:var(--text-muted);font-size:0.875rem;">Canon actual</span>
          <span style="font-weight:600;">${formatPeso(canonActual)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <span style="color:var(--text-muted);font-size:0.875rem;">Variación IPC ${ultimoIpc.periodo}</span>
          <span style="font-weight:700;color:var(--primary);">+${ultimoIpc.porcentaje}%</span>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0.75rem 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;">Nuevo canon</span>
          <span style="font-weight:800;font-size:1.25rem;color:var(--secondary);">${formatPeso(canonNuevo)}</span>
        </div>
        <div style="text-align:right;font-size:0.8125rem;color:var(--text-muted);margin-top:0.25rem;">Aumento: ${formatPeso(diferencia)}/mes</div>
      </div>
      <div style="display:flex;gap:0.75rem;">
        <button class="btn close-modal" style="flex:1;background:#f3f4f6;color:var(--text-main);">Cancelar</button>
        <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="alert('¡Canon actualizado a ${formatPeso(canonNuevo)}! (Demo – sin persistencia)')">Confirmar Ajuste</button>
      </div>
    </div>
  `
    document.body.appendChild(modal)
    lucide.createIcons()
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()))
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}

function showContratoDetail(id) {
    const c = contratos.find(x => x.id === id)
    if (!c) return
    const prop = propiedades.find(p => p.id === c.propiedadId)
    const inq = getInquilino(c.inquilinoId)
    const statusClass = { 'Al día': 'badge-success', 'Pendiente': 'badge-warning', 'Vencido': 'badge-danger' }

    const modal = document.createElement('div')
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:2rem;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;width:680px;max-width:95vw;max-height:90vh;overflow-y:auto;">
      <div style="padding:1.5rem;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-start;position:sticky;top:0;background:white;z-index:10;">
        <div>
          <h2 style="font-size:1.25rem;font-weight:700;">Contrato N° ${c.numero}</h2>
          <p style="font-size:0.8125rem;color:var(--text-muted);margin-top:0.25rem;">${prop?.nombre ?? '-'}</p>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="badge ${statusClass[c.estadoPago] ?? ''}">${c.estadoPago}</span>
          <button class="close-modal" style="background:none;border:none;cursor:pointer;color:#6b7280;"><i data-lucide="x"></i></button>
        </div>
      </div>
      <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;">
        
        <!-- Partes -->
        <section>
          <h3 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Partes</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div style="background:#f9fafb;border-radius:10px;padding:1rem;">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">Locadora</div>
              <div style="font-weight:700;">${c.locadora}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">CUIT: ${c.cuitLocadora}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">Rep: ${c.representanteLocadora}</div>
            </div>
            <div style="background:#f9fafb;border-radius:10px;padding:1rem;">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">Locatario</div>
              <div style="font-weight:700;">${inq?.razonSocial ?? '-'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">CUIT: ${inq?.cuit ?? '-'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">Rep: ${inq?.representante ?? '-'}</div>
            </div>
          </div>
        </section>

        <!-- Condiciones -->
        <section>
          <h3 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Condiciones Económicas</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.875rem;">
            <div style="display:flex;flex-direction:column;gap:0.25rem;"><span style="color:var(--text-muted);">Canon base original</span><span style="font-weight:700;">${formatPeso(c.canonBase)}</span></div>
            <div style="display:flex;flex-direction:column;gap:0.25rem;"><span style="color:var(--text-muted);">Canon actual</span><span style="font-weight:800;color:var(--secondary);font-size:1.05rem;">${formatPeso(c.canonActual)}${c.iva ? ' + IVA' : ''}</span></div>
            <div style="display:flex;flex-direction:column;gap:0.25rem;"><span style="color:var(--text-muted);">Actualización</span><span style="font-weight:600;">${c.tipoActualizacion} – Trimestral</span></div>
            <div style="display:flex;flex-direction:column;gap:0.25rem;"><span style="color:var(--text-muted);">Mora por día</span><span style="font-weight:600;">${c.moradiaria}% del canon</span></div>
            ${c.porcentajeFacturacion ? `<div style="display:flex;flex-direction:column;gap:0.25rem;grid-column:span 2;background:#f0fdf4;border-radius:8px;padding:0.75rem;"><span style="color:#166534;font-size:0.75rem;">Cláusula especial</span><span style="font-weight:600;color:#15803d;">El locatario abona el ${c.porcentajeFacturacion}% de su facturación bruta si supera el canon mínimo</span></div>` : ''}
          </div>
        </section>

        <!-- Historial de Ajustes -->
        ${c.ajustesAplicados.length > 0 ? `
        <section>
          <h3 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Historial de Ajustes IPC</h3>
          <table class="data-table" style="font-size:0.8125rem;">
            <thead><tr><th>Fecha</th><th>Período IPC</th><th>%</th><th>Canon anterior</th><th>Canon nuevo</th></tr></thead>
            <tbody>
              ${c.ajustesAplicados.map(a => `
              <tr>
                <td>${new Date(a.fecha).toLocaleDateString('es-AR')}</td>
                <td>${a.periodo}</td>
                <td style="font-weight:700;color:var(--primary);">+${a.porcentaje}%</td>
                <td>${formatPeso(a.canonAnterior)}</td>
                <td style="font-weight:700;">${formatPeso(a.canonNuevo)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </section>` : ''}

        <!-- Cláusulas Relevantes -->
        <section>
          <h3 style="font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Cláusulas Relevantes</h3>
          ${Object.entries(c.clausulas).map(([key, val]) => `
          <div style="padding:0.75rem 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-weight:600;font-size:0.8125rem;text-transform:capitalize;">${key.replace(/([A-Z])/g, ' $1')}: </span>
            <span style="font-size:0.8125rem;color:var(--text-muted);">${val}</span>
          </div>`).join('')}
        </section>
      </div>
    </div>
  `
    document.body.appendChild(modal)
    lucide.createIcons()
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()))
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}
