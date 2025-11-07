# Script para probar el webhook de n8n
# Ejecutar con: .\test-webhook.ps1

Write-Host "🧪 Probando webhook de n8n..." -ForegroundColor Green
Write-Host ""

# Datos de prueba
$testMessage = "Hola, necesito ayuda para levantar una pared de ladrillos"
$body = @{
    message = $testMessage
    userName = "Jose"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    sessionId = [System.Guid]::NewGuid().ToString()
} | ConvertTo-Json

Write-Host "📤 Enviando mensaje: '$testMessage'" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5678/webhook/Growsbot" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ""
    
    # Verificar si hay respuesta de IA
    if ($response.response) {
        Write-Host "🤖 Respuesta de IA:" -ForegroundColor Cyan
        Write-Host $response.response -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 ¡Webhook funcionando correctamente!" -ForegroundColor Green
    } elseif ($response.message) {
        Write-Host "🤖 Respuesta de IA:" -ForegroundColor Cyan
        Write-Host $response.message -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 ¡Webhook funcionando correctamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ No se encontró respuesta de IA" -ForegroundColor Red
        Write-Host "🔍 Respuesta completa:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 10
        Write-Host ""
        Write-Host "⚠️ El workflow necesita un nodo 'Respond to Webhook'" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error al conectar con n8n:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifica que n8n esté corriendo en http://localhost:5678" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🛠️ Para configurar el workflow:" -ForegroundColor Blue
Write-Host "1. Abre: http://localhost:5678/workflow/9rLKASIssMG1Lo0X" -ForegroundColor White
Write-Host "2. Agrega nodo 'Respond to Webhook'" -ForegroundColor White
Write-Host "3. Configura la respuesta: {`"response`": `"{{ `$json.response }}`"}" -ForegroundColor White
Write-Host "4. Activa el workflow" -ForegroundColor White
