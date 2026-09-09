param([Parameter(Mandatory=$true)][string]$Uri)
try {
 $ErrorActionPreference='Stop'
 $parsed=[Uri]$Uri
 if($parsed.Scheme -ne 'grows' -or $parsed.Host -ne 'pair'){throw "Esquema invalido: scheme=$($parsed.Scheme) host=$($parsed.Host)"}
 Add-Type -AssemblyName System.Web
 $query=[System.Web.HttpUtility]::ParseQueryString($parsed.Query)
 $baseUrl=$query['url']; $token=$query['token']
 Write-Host "URL: $baseUrl"
 Write-Host "Token length: $($token.Length)"
 if($baseUrl -notmatch '^https?://[^/?]+/?$' -or $token -notmatch '^[a-f0-9]{64}$'){throw "Datos invalidos. URL='$baseUrl' TOKEN_LEN=$($token.Length)"}
 $stateDir=Join-Path $env:LOCALAPPDATA 'Grows'; New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
 $configPath=Join-Path $stateDir 'bridge.private.json'
 @{url=$baseUrl.TrimEnd('/');token=$token}|ConvertTo-Json|Set-Content -LiteralPath $configPath -Encoding UTF8
 Write-Host "Config guardado en: $configPath"
 $root=Split-Path $PSScriptRoot -Parent
 Write-Host "Raiz del proyecto: $root"
 $node=(Get-Command node.exe -ErrorAction SilentlyContinue)?.Source
 if(-not $node){throw "node.exe no encontrado en PATH. Instala Node.js y agrega al PATH."}
 Write-Host "Node: $node"
 $existing=Get-CimInstance Win32_Process|Where-Object{$_.Name -eq 'node.exe' -and $_.CommandLine -like '*grows-bridge.mjs*'}
 foreach($p in $existing){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue}
 $bridgePath=Join-Path $root 'scripts\grows-bridge.mjs'
 if(-not (Test-Path $bridgePath)){throw "No se encontro el bridge en: $bridgePath"}
 Start-Process -FilePath $node -ArgumentList @('--use-system-ca',$bridgePath,'--config',$configPath) -WorkingDirectory $root -WindowStyle Hidden
 Write-Host "Grows Bridge iniciado correctamente."
 Start-Sleep -Seconds 2
} catch {
 Write-Host ""
 Write-Host "ERROR: $_" -ForegroundColor Red
 Write-Host ""
 Write-Host "Presiona Enter para cerrar..."
 Read-Host
}
