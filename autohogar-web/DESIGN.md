# Design System & Guidelines: Autohogar Web
> Arquitectura visual y tokens adaptados del sistema editorial Aker (Refero Styles) fusionados con la identidad y credibilidad comercial de Autohogar (Planes de Auto y Vivienda).

---

## 1. FILOSOFÍA VISUAL Y LENGUAJE
- **Estilo:** *Darkroom Gallery & Editorial Trust* — Fotografías de impacto a 100vw, composiciones aireadas, tipografía con jerarquía monumental y líneas finas (hairlines).
- **Sensación:** Solidez bancaria/institucional, sobriedad arquitectónica, dinamismo en planes de ahorro y máxima transparencia.
- **Sin artificios baratos:** Sin sombras exageradas ni degradados plásticos. La profundidad se logra por contraste tonal, fotografía de alta definición y capas limpias de tarjetas con bordes de 8px.

---

## 2. PALETA DE TOKENS DE COLOR (Aker Refero Styles + Selección del Usuario)

| Nombre | HEX / Valor | Token CSS | Rol / Aplicación |
| :--- | :--- | :--- | :--- |
| **Ink** | `#000000` | `--color-ink` | Texto principal, trazos finos de bordes, iconos sobre fondos claros |
| **Paper** | `#ffffff` | `--color-paper` | Base canvas claro, tarjetas sobre fondos oscuros, texto sobre fotografía |
| **Char** | `#1c1c1c` | `--color-char` | Superficies oscuras elevadas, navbar pill, tarjetas oscuras |
| **Midnight** | `#070707` | `--color-midnight` | Fondo hero oscuro, mapa interactivo, modales y overlays premium |
| **Iron** | `#262626` | `--color-iron` | Superficie intermedia tras fotos y banners oscuros |
| **Slate** | `#38464a` | `--color-slate` | Superficie oscura con tinte frío para sutil contraste |
| **Mist** | `#e5e4e4` | `--color-mist` | Fondo de tarjetas claras sobre Paper, divisores sutiles |
| **Smoke** | `#8d8d8d` | `--color-smoke` | Texto secundario, números de lista "01, 02", metadatos inactivos |
| **Pewter** | `#666666` | `--color-pewter` | Texto de lectura secundario, bordes con énfasis de cuerpo |
| **Driftwood** | `#537179` | `--color-driftwood` | **Acento de Marca Primario** — Trazos decorativos, iconos, botones y links principales |
| **Pine** | `#193f32` | `--color-pine` | Superficie verde bosque oscuro para tarjetas de productos (casas modulares) |
| **Tide** | `#002934` | `--color-tide` | Superficie petróleo profundo para tarjetas de autos 0km |
| **Primary Action Fill** | `#494949` | `--color-primary-action-fill` | Tratamiento neutro de botones para acciones secundarias |

> **PROHIBICIÓN ESTRICTA:** Queda eliminada toda la gama de naranjas (`#FA8500`). El acento cromático institucional es `#537179` (Driftwood) en armonía con `#070707`, `#1c1c1c` y `#666666`.

---

## 3. TIPOGRAFÍA Y ESCALA (Refero Styles)

- **Familia Primaria (Display, Títulos y UI):** `'Montserrat'`, `'Proxima Nova'` o `ui-sans-serif, system-ui`.
  - *Display Wordmark & Headings Hero:* `weight: 300` a `400` con `tracking: -0.025em` (estilo editorial sobrio y monumental).
  - *UI Buttons & Labels:* `weight: 400` / `500` / `600`.
- **Familia Secundaria (Lectura & Editorial):** `'Lora'`, `serif` (`weight: 400`, `letter-spacing: 0.0110em`) para párrafos editoriales destacados.

### Escala Tipográfica Exacta
* **Display Monumental:** `168px` | `line-height: 0.8` | `letter-spacing: -4.2px`
* **Heading Grande (Lg):** `62px` - `80px` | `weight: 300` | `line-height: 0.95` - `1.1` | `letter-spacing: -1.55px`
* **Heading Sección:** `36px` | `weight: 300` | `line-height: 1.2` | `letter-spacing: -0.72px`
* **Heading Pequeño (Sm):** `22px` | `weight: 400` | `line-height: 1.25` | `letter-spacing: -0.44px`
* **Subheading:** `18px` | `weight: 400` | `line-height: 1.5` | `letter-spacing: 0.18px`
* **Body Text:** `15px` | `weight: 400` | `line-height: 1.5` | `letter-spacing: 0.15px`
* **Section Label / Overline:** `12px` | `weight: 400` | `letter-spacing: 0.12px` | `color: var(--color-smoke)`

---

## 4. POLÍTICA DE IMÁGENES Y NEUROMARKETING (PÚBLICO HUMILDE Y FAMILIAR)

1. **Viviendas Reales y Modestas:** Prohibido exhibir mansiones, residencias de lujo exorbitante o arquitectura ajena a la clase trabajadora argentina. Las propiedades deben reflejar casas unifamiliares de 1 o 2 dormitorios, PHs, duplex modestos y viviendas modulares compactas (36-60 m²).
2. **Ambientes Habitables (Cero Espacios Vacíos):** Fachadas y ambientes amoblados, con elementos cotidianos del hogar argentino (árbol de sombra, patio con plantas, entrada de auto humilde, familia real).
3. **Contexto Geográfico Local:** Arquitectura propia de San Juan, Mendoza y Córdoba (cielo andino, vegetación autóctona de Cuyo, ladrillo a la vista, teja o chapa acanalada moderna).
4. **Vehículos Accesibles:** Autos 0km y modelos familiares accesibles de entrada de gama (Fiat Cronos, Peugeot 208, Renault Sandero/Stepway), evitando deportivos o SUVs de alta gama incompatibles con el target.
5. **Calidad Fotorrealista:** Fotografías documentales auténticas sin textura artificial de render ni sobrecarga visual.

---

## 5. COMPONENTES Y FORMAS

- **Border Radius:**
  - Tarjetas e imágenes: `8px` (`--radius-cards`)
  - Elementos pequeños/inputs: `3.2px` (`--radius-small`)
  - Botones y pills de navegación: `80px` (`--radius-buttons`)
  - Badges y tags: `1584px` (`--radius-badges`)
- **Espaciados:**
  - Ancho máximo de página: `1200px` (`--page-max-width`)
  - Separación entre secciones: `80px` (`--section-gap`)
  - Padding de tarjetas: `16px` a `24px`
- **Elevación:**
  - Sin drop shadows artificiales. Profundidad lograda exclusivamente mediante capas de superficies (`#ffffff`, `#e5e4e4`, `#1c1c1c`, `#070707`) y fotografía full-bleed.
* **Radio de borde:** `8px` estricto en tarjetas e imágenes.
* **Columna 1 (Autos):** Fondo `Mist (#e5e4e4)` o `Char (#1c1c1c)` con botón fantasma `Texto + Flecha (→)`.
* **Columna 2 (Viviendas):** Imagen full-bleed con tipografía blanca y acento naranja.

### D. Lista de Beneficios y Pasos Numerados
* Numeración a dos dígitos (`01`, `02`, `03`) en `Smoke (#8d8d8d)`.
* Divisores hairline de `1px` en `Mist (#e5e4e4)`.

---

## 5. REGLAS ESTRICTAS DE IMPLEMENTACIÓN (DO'S & DON'TS)

### ✅ SÍ (Do):
1. Usar el logo horizontal transparente generado en `autohogar-web/branding/logos/`.
2. Mantener botones con bordes estilo píldora (`border-radius: 80px`).
3. Tarjetas de contenido con radio exacto de `8px`.
4. Acciones primarias con estilo texto + flecha (`→`) y CTAs destacados en `#537179` (Driftwood).
5. Alternar secciones claras (Paper) con bandas fotográficas oscuras (Midnight/Char).

### ❌ NO (Don't):
1. No usar sombras pesadas ni degradados multicolores estilo app barata.
2. No centrar párrafos largos (bloques de texto alineados a la izquierda a un ancho máximo de 600px).
3. No alterar la tipografía del logo ni su proporción horizontal en el header.
