# 🔧 Configuración del Webhook Específico de GROWS

## 🎯 Nueva URL del Webhook
```
http://localhost:5678/webhook/767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat
```

## ❌ Problema actual:
El webhook devuelve error 404, lo que significa que no está configurado correctamente en n8n.

## 🔧 SOLUCIÓN: Configurar el webhook en n8n

### Paso 1: Abrir n8n
```
http://localhost:5678
```

### Paso 2: Crear o editar el workflow
1. Busca el workflow con ID: `767d1a90-3a2a-4fdc-b63a-2b94210f6f7d`
2. O crea un nuevo workflow

### Paso 3: Configurar el nodo Webhook
1. **Agregar nodo "Webhook"**
2. **Configurar la URL**:
   - **Path**: `767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat`
   - **Method**: `POST`
   - **Response Mode**: `On Received`

### Paso 4: Agregar nodos de procesamiento
```
[Webhook] → [Knowledge Base] → [IA/LLM] → [Respond to Webhook]
```

#### Configuración del nodo "Knowledge Base":
```json
{
  "knowledgeBase": {
    "name": "GROWS Knowledge Base",
    "description": "Base de conocimiento de GROWS",
    "source": "knowledge/grows_context.json"
  },
  "query": "{{ $json.message }}"
}
```

#### Configuración del nodo "Respond to Webhook":
```json
{
  "response": "{{ $json.response }}"
}
```

### Paso 5: Activar el workflow
- Asegúrate de que el toggle esté en verde (activo)

## 🧪 Probar el webhook

### Comando de prueba:
```powershell
$body = @{
    message = "Hola, necesito ayuda con la construcción"
    userName = "Jose"
    timestamp = "2024-01-01T12:00:00.000Z"
    sessionId = "1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat" -Method Post -Body $body -ContentType "application/json"
```

### Respuesta esperada:
```json
{
  "response": "Hola Jose! Soy GrowsBot, tu asistente experto en construcción..."
}
```

## 📋 Estructura del workflow completo:

```
┌─────────────────────────────────┐
│ Webhook                         │
│ Path: 767d1a90-3a2a-4fdc-      │
│       b63a-2b94210f6f7d/chat   │
│ Method: POST                   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Knowledge Base                  │
│ Source: grows_context.json      │
│ Query: {{ $json.message }}      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ IA/LLM (OpenAI/Claude)          │
│ Prompt: GrowsBot experto        │
│ Input: {{ $json.message }}      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Respond to Webhook               │
│ Response: {{ $json.response }}   │
└─────────────────────────────────┘
```

## 🚀 Una vez configurado:

1. **El chat funcionará automáticamente** con la nueva URL
2. **Las respuestas serán inteligentes** usando la base de conocimiento
3. **GrowsBot será un experto** en construcción y gestión de obras

## 📝 Notas importantes:

- La URL del webhook debe coincidir exactamente
- El workflow debe estar **ACTIVO** (toggle verde)
- El nodo "Respond to Webhook" es **CRÍTICO** para devolver respuestas
- La base de conocimiento debe estar configurada correctamente

