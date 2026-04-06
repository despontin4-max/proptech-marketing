param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("enable", "disable")]
    [string]$Action
)

$ConfigPath = "C:\Users\USER\.gemini\antigravity\mcp_config.json"
if (-Not (Test-Path $ConfigPath)) {
    Write-Host "Error: No se encontró mcp_config.json en $ConfigPath" -ForegroundColor Red
    exit 1
}

$JsonContent = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
$HeavyServers = @("github-mcp-server", "canva", "StitchMCP", "filesystem")

# Asegurarse de que el objeto disabledMcpServers exista en el JSON
if ($null -eq $JsonContent.disabledMcpServers) {
    $JsonContent | Add-Member -NotePropertyName "disabledMcpServers" -NotePropertyValue @{}
}

$CambiosRealizados = $false

if ($Action -eq "disable") {
    Write-Host "=== MODO MARKETING/SCRAPING ===" -ForegroundColor Yellow
    Write-Host "Deshabilitando servidores pesados para liberar espacio y RAM..."
    foreach ($server in $HeavyServers) {
        if ($null -ne $JsonContent.mcpServers.$server) {
            $JsonContent.disabledMcpServers | Add-Member -NotePropertyName $server -NotePropertyValue $JsonContent.mcpServers.$server -Force
            $JsonContent.mcpServers.PSObject.Properties.Remove($server)
            Write-Host "[x] $server desactivado." -ForegroundColor DarkGray
            $CambiosRealizados = $true
        }
    }
} elseif ($Action -eq "enable") {
    Write-Host "=== MODO DESARROLLO (CeroKM) ===" -ForegroundColor Green
    Write-Host "Re-habilitando servidores de código y diseño..."
    foreach ($server in $HeavyServers) {
        if ($null -ne $JsonContent.disabledMcpServers.$server) {
            $JsonContent.mcpServers | Add-Member -NotePropertyName $server -NotePropertyValue $JsonContent.disabledMcpServers.$server -Force
            $JsonContent.disabledMcpServers.PSObject.Properties.Remove($server)
            Write-Host "[+] $server activado exitosamente." -ForegroundColor Cyan
            $CambiosRealizados = $true
        }
    }
}

if ($CambiosRealizados) {
    # Guardamos con formato bonito y codificación UTF-8
    $JsonContent | ConvertTo-Json -Depth 20 | Out-File -FilePath $ConfigPath -Encoding utf8
    Write-Host "--------------------------------"
    Write-Host "¡Operación completada exitosamente!" -ForegroundColor Green
    Write-Host "IMPORTANTE: Refresca o reinicia el agente/chat para que el límite de 100 herramientas se actualice." -ForegroundColor Red
} else {
    Write-Host "--------------------------------"
    Write-Host "No hubo cambios (los servidores ya estaban en ese estado)." -ForegroundColor Yellow
}
