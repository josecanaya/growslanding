# 🚀 Script de configuración completa para GROWS Chat con Base de Conocimiento
# Ejecutar con: .\setup-knowledge-system.ps1

Write-Host "🧠 Configurando sistema de base de conocimiento para GROWS Chat..." -ForegroundColor Green
Write-Host ""

# Paso 1: Verificar dependencias
Write-Host "📋 Paso 1: Verificando dependencias..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala Node.js desde: https://nodejs.org/" -ForegroundColor Blue
    exit 1
}

# Verificar n8n
try {
    $n8nVersion = n8n --version 2>$null
    Write-Host "✅ n8n: $n8nVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala n8n con: npm install -g n8n" -ForegroundColor Blue
    exit 1
}

Write-Host ""

# Paso 2: Generar base de conocimiento inicial
Write-Host "📋 Paso 2: Generando base de conocimiento inicial..." -ForegroundColor Yellow

try {
    node scripts/generate-knowledge.js
    Write-Host "✅ Base de conocimiento generada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generando base de conocimiento" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Verificar archivos generados
Write-Host "📋 Paso 3: Verificando archivos generados..." -ForegroundColor Yellow

$files = @(
    "knowledge/grows_context.json",
    "scripts/generate-knowledge.js",
    "scripts/regenerate-knowledge.ps1",
    "scripts/watch-knowledge.js",
    "CONFIGURACION-BASE-CONOCIMIENTO.md",
    "n8n-workflow-config.json"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (no encontrado)" -ForegroundColor Red
    }
}

Write-Host ""

# Paso 4: Instrucciones para n8n
Write-Host "📋 Paso 4: Configuración en n8n..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Para configurar el workflow en n8n:" -ForegroundColor Cyan
Write-Host "1. Abre n8n: http://localhost:5678" -ForegroundColor White
Write-Host "2. Abre el workflow: http://localhost:5678/workflow/9rLKASIssMG1Lo0X" -ForegroundColor White
Write-Host "3. Agrega el nodo 'Knowledge Base' después del webhook" -ForegroundColor White
Write-Host "4. Configura la base de conocimiento con el archivo: knowledge/grows_context.json" -ForegroundColor White
Write-Host "5. Conecta: Webhook → Knowledge Base → IA → Respond to Webhook" -ForegroundColor White
Write-Host "6. Activa el workflow (toggle verde)" -ForegroundColor White
Write-Host ""

# Paso 5: Opciones de monitoreo
Write-Host "📋 Paso 5: Opciones de monitoreo automático..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 Para regenerar conocimiento automáticamente:" -ForegroundColor Cyan
Write-Host "• Manual: .\scripts\regenerate-knowledge.ps1" -ForegroundColor White
Write-Host "• Automático: node scripts/watch-knowledge.js" -ForegroundColor White
Write-Host "• En desarrollo: Configurar en tu IDE para ejecutar después de cambios en seeds" -ForegroundColor White
Write-Host ""

# Paso 6: Verificar n8n
Write-Host "📋 Paso 6: Verificando n8n..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5678/webhook/Growsbot" -Method Post -Body '{"message":"test","userName":"Jose"}' -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ n8n está corriendo y el webhook responde" -ForegroundColor Green
} catch {
    Write-Host "⚠️ n8n no está corriendo o el webhook no está configurado" -ForegroundColor Yellow
    Write-Host "💡 Inicia n8n con: n8n start" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentación disponible:" -ForegroundColor Blue
Write-Host "• CONFIGURACION-BASE-CONOCIMIENTO.md" -ForegroundColor White
Write-Host "• SOLUCIONAR-RESPUESTA-IA.md" -ForegroundColor White
Write-Host "• README-N8N-INTEGRATION.md" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Configura el workflow en n8n con la base de conocimiento" -ForegroundColor White
Write-Host "2. Prueba el chat con preguntas sobre construcción" -ForegroundColor White
Write-Host "3. Configura el monitoreo automático si es necesario" -ForegroundColor White
Write-Host ""
Write-Host "¡El sistema está listo para usar! 🎯" -ForegroundColor Green
