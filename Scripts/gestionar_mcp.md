---
description: Habilitar o deshabilitar MCP Servers (Playwright, Canva, GitHub, GSC) para liberar memoria.
---

Este workflow debe usarse cuando necesites habilitar nuevamente los servidores MCP que fueron deshabilitados para ahorrar memoria (como Playwright, Canva, GitHub MCP, Google Search Console, etc.) o cuando quieras volver a apagarlos.

## Obligación del Agente (Antigravity o Roo-Cline)
**NUNCA asumas que el usuario sabe para qué sirve cada MCP.** 
Cuando el usuario te pida una tarea que requiera una de estas herramientas deshabilitadas, **DEBES EXPLICARLE ESTO AL USUARIO**, decirle exactamente por qué necesitas habilitarlo y qué hace ese MCP en términos simples.

### ¿Qué hace cada MCP y cuándo sugerir activarlos?
- **Playwright (`playwright`)**: Actívalo solo cuando necesites probar que una página web interactiva o un flujo de botones funciona visualmente como un humano. *(Ej: "Para probar si el botón funciona correctamente como lo vería el cliente, te sugiero habilitar Playwright").*
- **GitHub (`github-mcp-server`)**: Actívalo si necesitas gestionar Pull Requests, leer y escribir Issues, o buscar código avanzado en repositorios enteros usando la API de GitHub. *(Ej: "Para poder crear un Pull Request automático y subir tus cambios, te sugiero habilitar GitHub").*
- **Canva (`canva`)**: Actívalo si la tarea implica revisar reglas de diseño, actualizar plantillas gráficas o revisar guías de diseño de Canva directamente de la app.
- **Google Search Console (`google-search-console`)**: Actívalo cuando la tarea implique analizar el SEO técnico de la página en la cuenta de Google, revisar si Google indexó nuestras URLs, ver palabras clave o errores en Vercel. *(Ej: "Para ver cómo Google está indexando el comparador y mejorar el SEO, te sugiero encender Search Console").*

## Pasos para gestionar

1. **Revisar el estado actual:**
   Analiza el archivo `C:\Users\USER\.gemini\antigravity\mcp_config.json` para Antigravity.
   (Para Roo-Cline, revisa `%APPDATA%\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json` o la configuración en `.vscode/cline_mcp_settings.json`).

2. **Ejecutar el script de gestión:**
   Para habilitar o deshabilitar rápidamente, usa el script de PowerShell proporcionado en `scripts/toggle_mcp.ps1`.
   
   - Para **habilitarlos** (luego deberás reiniciar el chat/agente):
     `powershell.exe -ExecutionPolicy Bypass -File .\scripts\toggle_mcp.ps1 -Action enable`
   - Para **deshabilitarlos** y ahorrar RAM:
     `powershell.exe -ExecutionPolicy Bypass -File .\scripts\toggle_mcp.ps1 -Action disable`

3. **Confirmación:**
   Valida que los cambios se hayan guardado en los respectivos archivos `.json` de configuración pasando los bloques del objeto `disabledMcpServers` hacia `mcpServers` y viceversa.
   Por último, requiere que reiniciar la sesión o recargar los servicios de MCP según corresponda.
