$ErrorActionPreference='Stop'
$handler=Join-Path $PSScriptRoot 'grows-connect.ps1'
$root='HKCU:\Software\Classes\grows'
New-Item -Path $root -Force | Out-Null
Set-ItemProperty -Path $root -Name '(Default)' -Value 'URL:Grows Bridge Protocol'
Set-ItemProperty -Path $root -Name 'URL Protocol' -Value ''
$command=Join-Path $root 'shell\open\command'; New-Item -Path $command -Force | Out-Null
Set-ItemProperty -Path $command -Name '(Default)' -Value ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}" "%1"' -f $handler)
Write-Host 'Grows Bridge quedó instalado para conexiones de un clic.'
