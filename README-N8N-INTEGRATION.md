# Integración GROWS Chat con n8n Webhook

## 🎯 Descripción

El chat de GROWS ahora está integrado con n8n usando webhooks. Los mensajes del usuario se envían automáticamente al webhook de n8n y las respuestas se muestran en el chat.

## 🚀 Configuración

### 1. Instalar ngrok
```bash
npm install -g ngrok
```

### 2. Iniciar n8n
Asegúrate de que n8n esté corriendo en el puerto 5678:
```bash
n8n start
```

### 3. Iniciar ngrok
Ejecuta el script de PowerShell:
```powershell
.\start-ngrok.ps1
```

O manualmente:
```bash
ngrok http 5678
```

### 4. Configurar el webhook en n8n
1. Abre n8n en http://localhost:5678
2. Crea un nuevo workflow
3. Agrega un nodo "Webhook"
4. Configura la URL como: `/webhook/Growsbot`
5. Método: POST
6. Agrega nodos para procesar el mensaje y generar respuesta

## 📡 Estructura del Webhook

### Datos enviados al webhook:
```json
{
  "message": "Mensaje del usuario",
  "userName": "Nombre del usuario",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "1234567890"
}
```

### Respuesta esperada del webhook:
```json
{
  "response": "Respuesta del bot",
  "message": "Mensaje alternativo",
  "status": "success"
}
```

## 🔧 Configuración del Chat

### URL del webhook (ChatSection.tsx):
```typescript
// Para desarrollo local:
const webhookUrl = 'http://localhost:5678/webhook/Growsbot';

// Para producción con ngrok:
const webhookUrl = 'https://abc123.ngrok.io/webhook/Growsbot';
```

## 🛠️ Funcionalidades

### ✅ Implementado:
- ✅ Envío automático de mensajes a n8n
- ✅ Recepción de respuestas del webhook
- ✅ Manejo de errores con respuestas de fallback
- ✅ Indicador de escritura durante el procesamiento
- ✅ Logging en consola para debugging

### 🔄 Flujo de trabajo:
1. Usuario escribe mensaje
2. Mensaje se envía al webhook de n8n
3. n8n procesa el mensaje
4. n8n devuelve respuesta
5. Respuesta se muestra en el chat

## 🐛 Troubleshooting

### Error: "No se puede conectar con n8n"
- Verifica que n8n esté corriendo en puerto 5678
- Verifica que el webhook esté configurado correctamente
- Revisa la consola del navegador para errores

### Error: "ngrok no funciona"
- Instala ngrok: `npm install -g ngrok`
- Ejecuta: `ngrok http 5678`
- Verifica la URL en http://localhost:4040

### El chat no responde:
- Verifica que n8n esté procesando los webhooks
- Revisa los logs de n8n
- Verifica la estructura de respuesta del webhook

## 📁 Archivos modificados:
- `apps/web/components/clienteTecnico/ChatSection.tsx` - Integración principal
- `ngrok-config.md` - Configuración de ngrok
- `start-ngrok.ps1` - Script de inicio
- `README-N8N-INTEGRATION.md` - Esta documentación

## 🎉 ¡Listo!

El chat de GROWS ahora está conectado con n8n. Los mensajes se procesan automáticamente y las respuestas se muestran en tiempo real.
