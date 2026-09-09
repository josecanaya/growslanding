param([Parameter(Mandatory=$true)][string]$Uri)
$ErrorActionPreference='Stop'
$parsed=[Uri]$Uri
if($parsed.Scheme -ne 'grows' -or $parsed.Host -ne 'pair'){throw 'Enlace de conexión inválido.'}
Add-Type -AssemblyName System.Web
$query=[System.Web.HttpUtility]::ParseQueryString($parsed.Query)
$baseUrl=$query['url']; $token=$query['token']
if($baseUrl -notmatch '^https://[^/]+/?$' -or $token -notmatch '^[a-f0-9]{64}$'){throw 'Datos de conexión inválidos.'}
$stateDir=Join-Path $env:LOCALAPPDATA 'Grows'; New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
$configPath=Join-Path $stateDir 'bridge.private.json'
@{url=$baseUrl.TrimEnd('/');token=$token}|ConvertTo-Json|Set-Content -LiteralPath $configPath -Encoding UTF8
$root=Split-Path $PSScriptRoot -Parent
$existing=Get-CimInstance Win32_Process|Where-Object{$_.Name -eq 'node.exe' -and $_.CommandLine -like '*scripts/grows-bridge.mjs*'}
foreach($process in $existing){Stop-Process -Id $process.ProcessId -Force}
Start-Process -FilePath 'node.exe' -ArgumentList @('--use-system-ca','scripts/grows-bridge.mjs','--config',$configPath) -WorkingDirectory $root -WindowStyle Hidden
