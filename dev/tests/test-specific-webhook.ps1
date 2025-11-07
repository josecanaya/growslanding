# Script para probar el webhook específico de GROWS
# Ejecutar con: .\test-specific-webhook.ps1

Write-Host "🧪 Probando webhook específico de GROWS..." -ForegroundColor Green
Write-Host ""

$webhookUrl = "http://localhost:5678/webhook/767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat"

# Datos de prueba
$testMessage = "Hola, necesito ayuda para levantar una pared de ladrillos"
$body = @{
    message = $testMessage
    userName = "Jose"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    sessionId = [System.Guid]::NewGuid().ToString()
} | ConvertTo-Json

Write-Host "📤 Enviando mensaje: '$testMessage'" -ForegroundColor Yellow
Write-Host "🔗 URL del webhook: $webhookUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ""
    
    # Verificar si hay respuesta de IA
    if ($response.response) {
        Write-Host "🤖 Respuesta de GrowsBot:" -ForegroundColor Cyan
        Write-Host $response.response -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 ¡Webhook funcionando correctamente!" -ForegroundColor Green
    } elseif ($response.message) {
        Write-Host "🤖 Respuesta de GrowsBot:" -ForegroundColor Cyan
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
    Write-Host "❌ Error al conectar con el webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*404*") {
        Write-Host "🔧 SOLUCIÓN:" -ForegroundColor Yellow
        Write-Host "1. Abre n8n: http://localhost:5678" -ForegroundColor White
        Write-Host "2. Busca el workflow con ID: 767d1a90-3a2a-4fdc-b63a-2b94210f6f7d" -ForegroundColor White
        Write-Host "3. Configura el nodo Webhook con Path: 767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat" -ForegroundColor White
        Write-Host "4. Agrega nodos: Knowledge Base → IA → Respond to Webhook" -ForegroundColor White
        Write-Host "5. Activa el workflow (toggle verde)" -ForegroundColor White
    } elseif ($_.Exception.Message -like "*No se puede conectar*") {
        Write-Host "💡 Verifica que n8n esté corriendo en http://localhost:5678" -ForegroundColor Blue
    }
}

Write-Host ""
Write-Host "📖 Documentación:" -ForegroundColor Blue
Write-Host "• CONFIGURAR-WEBHOOK-ESPECIFICO.md" -ForegroundColor White
Write-Host "• CONFIGURACION-BASE-CONOCIMIENTO.md" -ForegroundColor White

