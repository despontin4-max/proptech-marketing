import { propiedades, contratos, getContrato, getInquilino, getEdificio, formatPeso } from '../data.js'

export function renderProperties() {
    const content = document.getElementById('content')
    content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
      <div>
        <h1 style="font-size:1.875rem;margin-bottom:0.25rem;">Propiedades</h1>
        <p style="color:var(--text-muted);font-size:0.875rem;">${propiedades.length} propiedades registradas</p>
      </div>
      <div style="display:flex;gap:0.75rem;">
        <select id="filtroEstado" class="form-input" style="padding:0.5rem 1rem;border-radius:8px;border:1px solid #e5e7eb;font-size:0.875rem;">
          <option value="">Todos los estados</option>
          <option value="Alquilado">Alquilado</option>
          <option value="Disponible">Disponible</option>
        </select>
        <button class="btn btn-secondary" id="btnAddProperty"><i data-lucide="plus" style="width:16px;height:16px;"></i>Nueva</button>
      </div>
    </div>

    <div id="propGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;">
      ${propiedades.map(renderPropertyCard).join('')}
    </div>
  `
    lucide.createIcons()

    document.getElementById('filtroEstado')?.addEventListener('change', (e) => {
        const val = e.target.value
        const filtered = val ? propiedades.filter(p => p.estado === val) : propiedades
        document.getElementById('propGrid').innerHTML = filtered.map(renderPropertyCard).join('')
        lucide.createIcons()
        attachCardHandlers()
    })

    document.getElementById('btnAddProperty')?.addEventListener('click', showAddPropertyModal)
    attachCardHandlers()
}

function renderPropertyCard(p) {
    const contrato = p.contratoId ? contratos.find(c => c.id === p.contratoId) : null
    const inquilino = contrato ? getInquilino(contrato.inquilinoId) : null
    const isAlquilado = p.estado === 'Alquilado'
    return `
    <div class="prop-card card-container" data-id="${p.id}"
         style="cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;"
         onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 40px rgba(0,0,0,0.12)'"
         onmouseout="this.style.transform='translateY(0)';this.style.boxShadow=''">
      <div style="position:relative;height:180px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img src="${p.imagen}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;">
        <span class="badge ${isAlquilado ? 'badge-success' : 'badge-warning'}"
          style="position:absolute;top:10px;right:10px;padding:0.3rem 0.9rem;background:${isAlquilado ? 'rgba(15,189,102,0.92)' : 'rgba(245,158,11,0.92)'};color:white;backdrop-filter:blur(4px);">
          ${p.estado}
        </span>
      </div>
      <div style="padding:1.25rem;">
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.25rem;">${p.tipo}</div>
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.5rem;line-height:1.3;">${p.nombre}</h3>
        <p style="color:var(--text-muted);font-size:0.8125rem;display:flex;align-items:center;gap:0.3rem;margin-bottom:1rem;">
          <i data-lucide="map-pin" style="width:13px;min-width:13px;"></i>${p.direccion}
        </p>
        <div style="display:flex;gap:1rem;margin-bottom:1rem;color:var(--text-muted);font-size:0.75rem;">
          <span style="display:flex;align-items:center;gap:0.3rem;"><i data-lucide="maximize" style="width:13px;"></i>${p.superficie} m²</span>
          <span style="display:flex;align-items:center;gap:0.3rem;"><i data-lucide="landmark" style="width:13px;"></i>${formatPeso(p.impuestoInmobiliarioMensual)}/mes impuesto</span>
        </div>
        ${contrato ? `
        <div style="background:#f9fafb;border-radius:8px;padding:0.75rem;margin-bottom:1rem;font-size:0.8rem;">
          <div style="font-weight:600;color:var(--text-main);">${formatPeso(contrato.canonActual)}/mes${contrato.iva ? ' + IVA' : ''}</div>
          <div style="color:var(--text-muted);">Inquilino: ${inquilino?.razonSocial ?? '-'}</div>
        </div>
        ` : `<div style="background:#fef3c7;border-radius:8px;padding:0.75rem;margin-bottom:1rem;font-size:0.8rem;color:#92400e;">Sin contrato activo</div>`}
        <button class="btn btn-primary btn-ver-detalles" data-id="${p.id}" style="width:100%;justify-content:center;">
          Ver Detalles
        </button>
      </div>
    </div>
  `
}

function attachCardHandlers() {
    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            showPropertyDetailModal(btn.getAttribute('data-id'))
        })
    })
}

function showPropertyDetailModal(propId) {
    const p = propiedades.find(x => x.id === propId)
    if (!p) return
    const contrato = p.contratoId ? contratos.find(c => c.id === p.contratoId) : null
    const inquilino = contrato ? getInquilino(contrato.inquilinoId) : null
    const edificio = p.edificioId ? getEdificio(p.edificioId) : null

    const modal = document.createElement('div')
    modal.id = 'modal-prop-detail'
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:2rem;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;width:620px;max-width:95vw;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
      <div style="position:relative;height:220px;overflow:hidden;border-radius:16px 16px 0 0;">
        <img src="${p.imagen}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;">
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
        <h2 style="position:absolute;bottom:1rem;left:1.5rem;color:white;font-size:1.25rem;font-weight:700;">${p.nombre}</h2>
        <button id="closePropDetail" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.2);backdrop-filter:blur(4px);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;">
          <i data-lucide="x" style="width:16px;height:16px;"></i>
        </button>
      </div>
      <div style="padding:1.5rem;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <div style="background:#f9fafb;padding:1rem;border-radius:10px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">Superficie</div>
            <div style="font-weight:700;">${p.superficie} m²</div>
          </div>
          <div style="background:#f9fafb;padding:1rem;border-radius:10px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">Tipo</div>
            <div style="font-weight:700;text-transform:capitalize;">${p.tipo}</div>
          </div>
          <div style="background:#fff7ed;padding:1rem;border-radius:10px;">
            <div style="font-size:0.75rem;color:#92400e;margin-bottom:0.25rem;display:flex;align-items:center;gap:0.3rem;"><i data-lucide="landmark" style="width:12px;"></i>Impuesto Inmobiliario/mes</div>
            <div style="font-weight:700;color:#b45309;">${formatPeso(p.impuestoInmobiliarioMensual)}</div>
          </div>
          <div style="background:#f0fdf4;padding:1rem;border-radius:10px;">
            <div style="font-size:0.75rem;color:#166534;margin-bottom:0.25rem;">Estado</div>
            <div style="font-weight:700;color:${p.estado === 'Alquilado' ? '#15803d' : '#b45309'};">${p.estado}</div>
          </div>
        </div>

        ${contrato ? `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;padding-bottom:0.5rem;border-bottom:1px solid #e5e7eb;">Contrato Vigente</h3>
        <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.875rem;margin-bottom:1.5rem;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Canon mensual</span><span style="font-weight:700;">${formatPeso(contrato.canonActual)}${contrato.iva ? ' + IVA' : ''}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Inquilino</span><span style="font-weight:600;">${inquilino?.razonSocial ?? '-'}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Vigencia</span><span>${new Date(contrato.fechaInicio).toLocaleDateString('es-AR')} → ${new Date(contrato.fechaFin).toLocaleDateString('es-AR')}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Estado</span><span class="badge ${contrato.estadoPago === 'Al día' ? 'badge-success' : contrato.estadoPago === 'Pendiente' ? 'badge-warning' : 'badge-danger'}">${contrato.estadoPago}</span></div>
        </div>
        ` : ''}

        ${edificio ? `
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid #e5e7eb;">Edificio</h3>
        <p style="font-size:0.875rem;margin-bottom:0.25rem;"><span style="color:var(--text-muted);">Nombre:</span> ${edificio.nombre}</p>
        <p style="font-size:0.875rem;"><span style="color:var(--text-muted);">Administrador:</span> ${edificio.administrador}</p>
        ` : ''}
      </div>
    </div>
  `
    document.body.appendChild(modal)
    lucide.createIcons()
    document.getElementById('closePropDetail')?.addEventListener('click', () => modal.remove())
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}

function showAddPropertyModal() {
    const modal = document.createElement('div')
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:520px;max-width:95vw;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h2 style="font-size:1.25rem;font-weight:700;">Nueva Propiedad</h2>
        <button class="close-modal" style="background:none;border:none;cursor:pointer;color:#6b7280;"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <div><label class="form-label">Nombre / Identificación</label><input type="text" class="form-input" placeholder="Ej: Depto. 2 Amb. – Barrio Jardín"></div>
        <div><label class="form-label">Dirección</label><input type="text" class="form-input" placeholder="Calle, número, ciudad"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div><label class="form-label">Tipo</label><select class="form-input"><option>Residencial</option><option>Comercial</option><option>Oficina</option></select></div>
          <div><label class="form-label">Superficie (m²)</label><input type="number" class="form-input" placeholder="75"></div>
        </div>
        <div><label class="form-label">Impuesto Inmobiliario Mensual ($)</label><input type="number" class="form-input" placeholder="20000"></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;">
        <button class="btn close-modal" style="background:#f3f4f6;color:var(--text-main);">Cancelar</button>
        <button class="btn btn-secondary">Guardar Propiedad</button>
      </div>
    </div>
  `
    document.body.appendChild(modal)
    lucide.createIcons()
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()))
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}
