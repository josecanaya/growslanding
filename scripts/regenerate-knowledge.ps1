# Script para regenerar automáticamente el archivo de conocimiento de GROWS
# Ejecutar con: .\scripts\regenerate-knowledge.ps1

Write-Host "🧠 Regenerando base de conocimiento de GROWS..." -ForegroundColor Green
Write-Host ""

# Verificar que Node.js esté instalado
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado. Instalando..." -ForegroundColor Red
    # Aquí podrías agregar la instalación automática de Node.js
    exit 1
}

# Ejecutar el script de generación
try {
    Write-Host "🔄 Ejecutando generador de conocimiento..." -ForegroundColor Yellow
    node scripts/generate-knowledge.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de conocimiento regenerada exitosamente" -ForegroundColor Green
        Write-Host ""
        
        # Verificar que el archivo se creó
        $knowledgeFile = "knowledge/grows_context.json"
        if (Test-Path $knowledgeFile) {
            $fileSize = (Get-Item $knowledgeFile).Length
            Write-Host "📄 Archivo generado: $knowledgeFile ($fileSize bytes)" -ForegroundColor Cyan
            
            # Mostrar resumen del contenido
            $content = Get-Content $knowledgeFile -Raw | ConvertFrom-Json
            Write-Host "📊 Resumen del conocimiento:" -ForegroundColor Blue
            Write-Host "   - Plantillas de elementos: $($content.plantillas_elementos.Count)" -ForegroundColor White
            Write-Host "   - Plantillas de tareas: $($content.plantillas_tareas.Count)" -ForegroundColor White
            Write-Host "   - Tipos de suscripción: $($content.tipos_suscripcion.Count)" -ForegroundColor White
            Write-Host "   - Roles de usuario: $($content.roles_usuario.Count)" -ForegroundColor White
            Write-Host "   - Última actualización: $($content.ultima_actualizacion)" -ForegroundColor White
        } else {
            Write-Host "⚠️ El archivo de conocimiento no se generó correctamente" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Error al generar la base de conocimiento" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error ejecutando el script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Para configurar regeneración automática:" -ForegroundColor Blue
Write-Host "1. Ejecutar este script después de cambios en seeds" -ForegroundColor White
Write-Host "2. Configurar en n8n el nodo de Base de Conocimiento" -ForegroundColor White
Write-Host "3. Actualizar el workflow para usar la nueva base" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentación: CONFIGURACION-BASE-CONOCIMIENTO.md" -ForegroundColor Cyan
