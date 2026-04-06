import './style.css'
import { renderDashboard } from './views/dashboard.js'
import { renderProperties } from './views/properties.js'
import { renderContratos } from './views/contratos.js'
import { renderExpensas } from './views/expensas.js'

// --- Navigation & Routing ---
const routes = {
  dashboard: renderDashboard,
  properties: renderProperties,
  contratos: renderContratos,
  expensas: renderExpensas,
  reports: renderReports,
  inquilinos: renderInquilinos,
}

function navigateTo(view) {
  // Update active nav link
  document.querySelectorAll('.nav-item').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-view') === view)
  })
  // Render view
  const fn = routes[view]
  if (fn) fn()
}

function renderReports() {
  document.getElementById('content').innerHTML = `
    <div style="margin-bottom:2rem;">
      <h1 style="font-size:1.875rem;margin-bottom:0.25rem;">Reportes</h1>
      <p style="color:var(--text-muted);font-size:0.875rem;">Análisis financiero de tu cartera</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;">
      ${[
      { title: 'Ingresos por alquiler (Feb 2026)', value: '$2.299.200', change: '+18%', icon: 'trending-up', color: '#0fbd66' },
      { title: 'Expensas cobradas', value: '$763.000', change: '+5%', icon: 'receipt', color: '#0b50da' },
      { title: 'Impuestos pagados', value: '$99.000', change: '–', icon: 'landmark', color: '#b45309' },
    ].map(r => `
        <div class="stat-card card-container" style="padding:1.5rem;">
          <div>
            <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:0.5rem;">${r.title}</div>
            <div style="font-size:1.75rem;font-weight:800;color:${r.color};margin-bottom:0.25rem;">${r.value}</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);">vs. mes anterior: <strong style="color:${r.color};">${r.change}</strong></div>
          </div>
          <div class="stat-icon" style="background:${r.color};margin-left:auto;align-self:flex-start;">
            <i data-lucide="${r.icon}" style="width:22px;height:22px;"></i>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="card-container" style="margin-top:2rem;padding:2rem;text-align:center;color:var(--text-muted);">
      <i data-lucide="bar-chart-3" style="width:48px;height:48px;margin-bottom:1rem;color:#e5e7eb;"></i>
      <p style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">Gráficos detallados próximamente</p>
      <p style="font-size:0.875rem;">Podrás ver evolución de ingresos, ocupación y mora mensual.</p>
    </div>
  `
  lucide.createIcons()
}

function renderInquilinos() {
  import('./data.js').then(({ inquilinos, propiedades, contratos, formatPeso }) => {
    document.getElementById('content').innerHTML = `
      <div style="margin-bottom:2rem;">
        <h1 style="font-size:1.875rem;margin-bottom:0.25rem;">Inquilinos</h1>
        <p style="color:var(--text-muted);font-size:0.875rem;">${inquilinos.length} inquilinos registrados</p>
      </div>
      <div class="card-container">
        <table class="data-table">
          <thead><tr><th>Nombre / Razón Social</th><th>CUIT</th><th>Tipo</th><th>Representante</th><th>Contacto</th><th>Propiedad</th></tr></thead>
          <tbody>
            ${inquilinos.map(inq => {
      const contrato = contratos.find(c => c.inquilinoId === inq.id)
      const prop = contrato ? propiedades.find(p => p.id === contrato.propiedadId) : null
      return `
              <tr>
                <td style="font-weight:700;">${inq.razonSocial}</td>
                <td style="font-family:monospace;font-size:0.8125rem;">${inq.cuit}</td>
                <td><span class="badge ${inq.tipo === 'empresa' ? 'badge-success' : 'badge-warning'}" style="text-transform:capitalize;">${inq.tipo}</span></td>
                <td>${inq.representante || '–'}</td>
                <td style="font-size:0.8125rem;">${inq.email}<br><span style="color:var(--text-muted);">${inq.telefono}</span></td>
                <td style="font-size:0.8125rem;font-weight:600;">${prop?.nombre ?? '–'}</td>
              </tr>`
    }).join('')}
          </tbody>
        </table>
      </div>
    `
    lucide.createIcons()
  })
}

// --- Init ---
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      navigateTo(link.getAttribute('data-view'))
    })
  })
}

// Bootstrap
initNavigation()
navigateTo('dashboard')
