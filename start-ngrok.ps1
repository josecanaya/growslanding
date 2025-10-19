# Script para iniciar ngrok y configurar el webhook de GROWS Chat
# Ejecutar con: .\start-ngrok.ps1

Write-Host "🚀 Iniciando ngrok para GROWS Chat..." -ForegroundColor Green

# Verificar si ngrok está instalado
try {
    $ngrokVersion = ngrok version 2>$null
    Write-Host "✅ ngrok está instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok no está instalado. Instalando..." -ForegroundColor Red
    npm install -g ngrok
}

# Iniciar ngrok en background
Write-Host "🌐 Iniciando túnel ngrok para puerto 5678..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "5678" -WindowStyle Hidden

# Esperar a que ngrok se inicie
Start-Sleep -Seconds 5

# Intentar obtener la URL pública
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
    $publicUrl = $response.tunnels[0].public_url
    
    if ($publicUrl) {
        Write-Host "🎉 ngrok iniciado correctamente!" -ForegroundColor Green
        Write-Host "📡 URL pública: $publicUrl" -ForegroundColor Cyan
        Write-Host "🔗 Webhook URL: $publicUrl/webhook/Growsbot" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Para usar esta URL en el chat, actualiza ChatSection.tsx:" -ForegroundColor Yellow
        Write-Host "const webhookUrl = '$publicUrl/webhook/Growsbot';" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 Interfaz web de ngrok: http://localhost:4040" -ForegroundColor Blue
    } else {
        Write-Host "⚠️ ngrok iniciado pero no se pudo obtener la URL pública" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ No se pudo conectar con ngrok. Verifica que esté corriendo." -ForegroundColor Yellow
    Write-Host "💡 Puedes iniciar ngrok manualmente con: ngrok http 5678" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🛑 Para detener ngrok, presiona Ctrl+C o cierra la ventana" -ForegroundColor Red
