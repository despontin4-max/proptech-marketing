import { propiedades, contratos, inquilinos, liquidaciones, formatPeso, getInquilino, getEdificio } from '../data.js'

export function renderDashboard() {
    const hoy = new Date()
    const alquiladosCount = propiedades.filter(p => p.estado === 'Alquilado').length
    const disponiblesCount = propiedades.filter(p => p.estado === 'Disponible').length
    const pendientes = contratos.filter(c => c.estadoPago === 'Pendiente' || c.estadoPago === 'Vencido')
    const totalPendiente = pendientes.reduce((sum, c) => sum + c.canonActual, 0)
    const vencidos = contratos.filter(c => c.estadoPago === 'Vencido').length

    const statusClass = { 'Al día': 'badge-success', 'Pendiente': 'badge-warning', 'Vencido': 'badge-danger' }

    document.getElementById('content').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
      <div>
        <h1 style="font-size:1.875rem; margin-bottom:0.25rem;">Dashboard</h1>
        <p style="color:var(--text-muted); font-size:0.875rem;">Resumen al ${hoy.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <button class="btn btn-secondary" id="btnAddProperty" style="gap:0.5rem;">
        <i data-lucide="plus" style="width:16px; height:16px;"></i>Nueva Propiedad
      </button>
    </div>

    <div class="stats-grid" style="margin-bottom:2rem;">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary)"><i data-lucide="building-2" style="width:22px;height:22px;"></i></div>
        <div class="stat-info">
          <div class="label">Propiedades Totales</div>
          <div class="value">${propiedades.length}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--secondary)"><i data-lucide="key" style="width:22px;height:22px;"></i></div>
        <div class="stat-info">
          <div class="label">Alquileres Activos</div>
          <div class="value">${alquiladosCount}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f59e0b"><i data-lucide="alert-circle" style="width:22px;height:22px;"></i></div>
        <div class="stat-info">
          <div class="label">Pagos Pendientes</div>
          <div class="value">${pendientes.length}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#ef4444"><i data-lucide="calendar-x" style="width:22px;height:22px;"></i></div>
        <div class="stat-info">
          <div class="label">Deuda Vencida</div>
          <div class="value" style="font-size:1.1rem;">${formatPeso(totalPendiente)}</div>
        </div>
      </div>
    </div>

    <div class="card-container">
      <div class="card-header">
        <h2 style="font-size:1.125rem; font-weight:700;">Próximos Vencimientos</h2>
        <button class="btn" style="background:none; border:none; color:var(--primary); font-weight:600; font-size:0.875rem; cursor:pointer;" data-view="contratos">Ver todos →</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Inquilino</th>
            <th>Vencimiento</th>
            <th>Canon mensual</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${contratos.map(c => {
        const prop = propiedades.find(p => p.id === c.propiedadId)
        const inq = getInquilino(c.inquilinoId)
        return `
            <tr>
              <td style="font-weight:600;">${prop?.nombre ?? '-'}</td>
              <td>${inq?.razonSocial ?? '-'}</td>
              <td>${new Date(c.proximoVencimiento).toLocaleDateString('es-AR')}</td>
              <td style="font-weight:600;">${formatPeso(c.canonActual)}${c.iva ? ' + IVA' : ''}</td>
              <td><span class="badge ${statusClass[c.estadoPago] ?? 'badge-warning'}">${c.estadoPago}</span></td>
            </tr>`
    }).join('')}
        </tbody>
      </table>
    </div>
  `
    lucide.createIcons()

    document.getElementById('btnAddProperty')?.addEventListener('click', () => showAddPropertyModal())
    document.querySelector('[data-view="contratos"]')?.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(l => {
            if (l.getAttribute('data-view') === 'contratos') { l.click() }
        })
    })
}

function showAddPropertyModal() {
    const modal = document.createElement('div')
    modal.id = 'modal-add-property'
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:520px;max-width:95vw;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h2 style="font-size:1.25rem;font-weight:700;">Nueva Propiedad</h2>
        <button id="closeModal" style="background:none;border:none;cursor:pointer;color:#6b7280;"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <div>
          <label class="form-label">Nombre / Identificación</label>
          <input type="text" class="form-input" placeholder="Ej: Depto. 2 Amb. – Barrio Jardín">
        </div>
        <div>
          <label class="form-label">Dirección</label>
          <input type="text" class="form-input" placeholder="Calle, número, ciudad">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <label class="form-label">Tipo</label>
            <select class="form-input">
              <option>Residencial</option><option>Comercial</option><option>Oficina</option>
            </select>
          </div>
          <div>
            <label class="form-label">Superficie (m²)</label>
            <input type="number" class="form-input" placeholder="75">
          </div>
        </div>
        <div>
          <label class="form-label">Impuesto Inmobiliario Mensual ($)</label>
          <input type="number" class="form-input" placeholder="20000">
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;">
        <button class="btn" id="cancelModal" style="background:#f3f4f6;color:var(--text-main);">Cancelar</button>
        <button class="btn btn-secondary">Guardar Propiedad</button>
      </div>
    </div>
  `
    document.body.appendChild(modal)
    lucide.createIcons()
    document.getElementById('closeModal')?.addEventListener('click', () => modal.remove())
    document.getElementById('cancelModal')?.addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}
