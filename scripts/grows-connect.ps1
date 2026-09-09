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
 $stateDir=Join-Path $env:LOCALAPPDATA 'Grows'
 New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
 $configPath=Join-Path $stateDir 'bridge.private.json'
 # Resolver los CLIs en PowerShell (contexto normal) y pasar rutas absolutas,
 # porque el proceso node lanzado por el navegador puede no poder listar AppData.
 function Resolve-Bin($names,$globs){
  foreach($n in $names){ $c=Get-Command $n -ErrorAction SilentlyContinue; if($c){ return $c.Source } }
  foreach($g in $globs){ $f=Get-ChildItem -Path $g -ErrorAction SilentlyContinue | Sort-Object { try{[version]($_.Directory.Name)}catch{[version]'0.0.0'} } -Descending | Select-Object -First 1; if($f){ return $f.FullName } }
  return $null
 }
 $claudeBin=Resolve-Bin @('claude') @("$env:APPDATA\Claude\claude-code\*\claude.exe","$env:LOCALAPPDATA\Claude\claude-code\*\claude.exe")
 $codexBin=Resolve-Bin @('codex') @("$env:APPDATA\npm\codex.cmd","$env:USERPROFILE\.local\bin\codex.exe","$env:USERPROFILE\.codex\bin\codex.exe")
 $cursorBin=Resolve-Bin @('cursor-agent') @("$env:LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor-agent.cmd","$env:APPDATA\npm\cursor-agent.cmd")
 $cfg=@{url=$baseUrl.TrimEnd('/');token=$token}
 if($claudeBin){ $cfg.claudeBin=$claudeBin; Write-Host "Claude: $claudeBin" }
 if($codexBin){ $cfg.codexBin=$codexBin; Write-Host "Codex: $codexBin" }
 if($cursorBin){ $cfg.cursorBin=$cursorBin; Write-Host "Cursor: $cursorBin" }
 $json=$cfg|ConvertTo-Json
 [System.IO.File]::WriteAllText($configPath,$json,(New-Object System.Text.UTF8Encoding $false))
 Write-Host "Config guardado en: $configPath"
 $root=Split-Path $PSScriptRoot -Parent
 Write-Host "Raiz del proyecto: $root"
 $nodeCmd=Get-Command node.exe -ErrorAction SilentlyContinue
 if(-not $nodeCmd){throw "node.exe no encontrado en PATH. Instala Node.js y agrega al PATH del sistema."}
 $node=$nodeCmd.Source
 Write-Host "Node: $node"
 $existing=Get-CimInstance Win32_Process -ErrorAction SilentlyContinue|Where-Object{$_.Name -eq 'node.exe' -and $_.CommandLine -like '*grows-bridge.mjs*'}
 foreach($p in $existing){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue}
 $bridgePath=Join-Path $root 'scripts\grows-bridge.mjs'
 if(-not (Test-Path $bridgePath)){throw "No se encontro el bridge en: $bridgePath"}
 $logOut=Join-Path $stateDir 'bridge.log'
 $logErr=Join-Path $stateDir 'bridge-error.log'
 $env:GROWS_BRIDGE_DEBUG='1'
 Start-Process -FilePath $node -ArgumentList @($bridgePath,'--config',$configPath,'--debug-detect') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr
 Write-Host "Grows Bridge iniciado. Log: $logOut"
 Start-Sleep -Seconds 2
} catch {
 Write-Host ""
 Write-Host "ERROR: $_" -ForegroundColor Red
 Write-Host ""
 Write-Host "Presiona Enter para cerrar..."
 Read-Host
}
