import { liquidaciones, edificios, formatPeso, calcularExpensasPorUnidad, propiedades, contratos, getInquilino } from '../data.js'

export function renderExpensas() {
    document.getElementById('content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
      <div>
        <h1 style="font-size:1.875rem;margin-bottom:0.25rem;">Liquidación de Expensas</h1>
        <p style="color:var(--text-muted);font-size:0.875rem;">Gastos comunes por edificio, distribuidos por porcentaje de unidad</p>
      </div>
      <button class="btn btn-secondary" id="btnNuevaLiq">
        <i data-lucide="plus" style="width:16px;height:16px;"></i>Nueva Liquidación
      </button>
    </div>

    <!-- Edificios con sus liquidaciones -->
    ${edificios.map(ed => {
        const liqsEdificio = liquidaciones.filter(l => l.edificioId === ed.id)
        const impMensual = Math.round(ed.impuestoInmobiliarioAnual / 12)
        return `
      <div class="card-container" style="margin-bottom:1.5rem;">
        <div class="card-header" style="background:linear-gradient(135deg, #0b50da10, #0fbd6610);">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="width:44px;height:44px;background:var(--primary);border-radius:12px;display:flex;align-items:center;justify-content:center;">
              <i data-lucide="building" style="width:22px;height:22px;color:white;"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.05rem;">${ed.nombre}</div>
              <div style="font-size:0.8125rem;color:var(--text-muted);">${ed.direccion}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem;color:var(--text-muted);">Impuesto Inmobiliario Mensual</div>
            <div style="font-weight:700;color:#b45309;font-size:1rem;">${formatPeso(impMensual)}</div>
          </div>
        </div>

        <!-- Unidades y porcentajes -->
        <div style="padding:1.25rem;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Unidades y Porcentajes</div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            ${ed.unidades.map(u => `
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0.5rem 1rem;font-size:0.8125rem;">
                <span style="font-weight:600;">${u.nombre}</span>
                <span style="color:var(--primary);font-weight:700;margin-left:0.5rem;">${u.porcentaje}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Liquidaciones -->
        ${liqsEdificio.length === 0 ? `<div style="padding:2rem;text-align:center;color:var(--text-muted);">Sin liquidaciones registradas</div>` :
                liqsEdificio.map(liq => {
                    const totalGastos = liq.items.reduce((s, i) => s + i.monto, 0)
                    const distribuciones = calcularExpensasPorUnidad(liq.id)
                    const statusColor = liq.estado === 'Cobrada' ? '#15803d' : '#0b50da'
                    const statusBg = liq.estado === 'Cobrada' ? '#f0fdf4' : '#eff6ff'
                    return `
            <div style="padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <div>
                  <span style="font-weight:700;font-size:1rem;">Expensas ${liq.periodo}</span>
                  <span style="margin-left:0.75rem;padding:0.2rem 0.75rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:${statusBg};color:${statusColor};">${liq.estado}</span>
                </div>
                <button class="btn" style="background:none;color:var(--primary);font-weight:600;font-size:0.8125rem;border:1px solid rgba(11,80,218,0.2);padding:0.3rem 1rem;" onclick="this.closest('.liq-body').classList.toggle('hidden')">
                  Ver detalle
                </button>
              </div>

              <!-- Total y distribución por unidad -->
              <div style="background:#f0f7ff;border-radius:10px;padding:1rem;margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                  <span style="font-size:0.875rem;color:var(--text-muted);">Total gastos comunes</span>
                  <span style="font-weight:800;font-size:1.1rem;color:var(--primary);">${formatPeso(totalGastos)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                  <span style="font-size:0.875rem;color:var(--text-muted);">Impuesto inmobiliario prorateado</span>
                  <span style="font-weight:700;color:#b45309;">${formatPeso(impMensual)}</span>
                </div>
                <hr style="border:none;border-top:1px solid #bfdbfe;margin:0.5rem 0;">
                <div style="display:flex;justify-content:space-between;">
                  <span style="font-weight:700;">Total a distribuir</span>
                  <span style="font-weight:800;color:var(--primary);">${formatPeso(totalGastos + impMensual)}</span>
                </div>
              </div>

              <!-- Distribución por unidad -->
              <div style="margin-bottom:0.75rem;">
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem;">Distribución por Unidad</div>
                <table class="data-table" style="font-size:0.8125rem;">
                  <thead><tr><th>Unidad</th><th>%</th><th>Gastos Comunes</th><th>Imp. Inmob.</th><th>Total</th><th>Estado</th></tr></thead>
                  <tbody>
                    ${distribuciones.map(d => {
                        const impUnidad = Math.round(impMensual * d.porcentaje / 100)
                        const totalUnidad = d.montoExpensas + impUnidad
                        return `<tr>
                        <td style="font-weight:600;">${d.nombre}</td>
                        <td>${d.porcentaje}%</td>
                        <td>${formatPeso(d.montoExpensas)}</td>
                        <td style="color:#b45309;">${formatPeso(impUnidad)}</td>
                        <td style="font-weight:700;">${formatPeso(totalUnidad)}</td>
                        <td><span class="badge ${liq.estado === 'Cobrada' ? 'badge-success' : 'badge-warning'}">${liq.estado}</span></td>
                      </tr>`
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Detalle de ítems (colapsable) -->
              <div class="liq-body" style="background:#f9fafb;border-radius:10px;overflow:hidden;">
                <div style="padding:0.75rem 1rem;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Ítems de Gastos Comunes</div>
                ${liq.items.map(item => `
                  <div style="display:flex;justify-content:space-between;padding:0.5rem 1rem;border-top:1px solid #e5e7eb;font-size:0.8125rem;">
                    <span style="color:var(--text-main);">${item.concepto}</span>
                    <span style="font-weight:600;${item.monto === 0 ? 'color:var(--text-muted);' : ''}">${item.monto === 0 ? '–' : formatPeso(item.monto)}</span>
                  </div>
                `).join('')}
                <div style="display:flex;justify-content:space-between;padding:0.75rem 1rem;background:#e0edff;font-weight:700;font-size:0.875rem;">
                  <span>TOTAL GASTOS COMUNES</span>
                  <span style="color:var(--primary);">${formatPeso(totalGastos)}</span>
                </div>
              </div>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;">`
                }).join('')
            }
      </div>`
    }).join('')}
  `
    lucide.createIcons()

    document.getElementById('btnNuevaLiq')?.addEventListener('click', showNuevaLiqModal)
}

function showNuevaLiqModal() {
    const modal = document.createElement('div')
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:2rem;`
    modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h2 style="font-size:1.25rem;font-weight:700;">Nueva Liquidación de Expensas</h2>
        <button class="close-modal" style="background:none;border:none;cursor:pointer;color:#6b7280;"><i data-lucide="x"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <div>
          <label class="form-label">Edificio</label>
          <select class="form-input">
            ${edificios.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div><label class="form-label">Período</label><input type="text" class="form-input" value="Marzo 2026" placeholder="Ej: Marzo 2026"></div>
          <div><label class="form-label">Fecha de Emisión</label><input type="date" class="form-input" value="2026-03-31"></div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="padding:0.75rem 1rem;background:#f9fafb;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Ítems de Gastos</div>
          ${[
            { concepto: 'Electricidad Áreas Comunes', monto: '95000' },
            { concepto: 'Agua y Cloacas', monto: '28000' },
            { concepto: 'Limpieza y Mantenimiento', monto: '65000' },
            { concepto: 'Vigilancia / Portería', monto: '120000' },
            { concepto: 'Seguro del Edificio', monto: '45000' },
            { concepto: 'Reparaciones Extraordinarias', monto: '0' },
            { concepto: 'Honorarios Administración', monto: '50000' },
        ].map((item, i) => `
            <div style="display:grid;grid-template-columns:1fr auto;gap:0.5rem;padding:0.625rem 1rem;border-top:1px solid #e5e7eb;">
              <input type="text" class="form-input" style="font-size:0.8125rem;padding:0.4rem 0.75rem;" value="${item.concepto}">
              <input type="number" class="form-input" style="font-size:0.8125rem;padding:0.4rem 0.75rem;width:120px;text-align:right;" value="${item.monto}">
            </div>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;">
        <button class="btn close-modal" style="background:#f3f4f6;color:var(--text-main);">Cancelar</button>
        <button class="btn btn-secondary" onclick="alert('Liquidación creada correctamente (Demo)'); this.closest('.modal-bg').remove()">
          <i data-lucide="file-check" style="width:16px;height:16px;"></i>Emitir Liquidación
        </button>
      </div>
    </div>
  `
    modal.classList.add('modal-bg')
    document.body.appendChild(modal)
    lucide.createIcons()
    modal.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => modal.remove()))
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
}
