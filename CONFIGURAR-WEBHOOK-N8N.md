# 🚨 PROBLEMA IDENTIFICADO: Webhook no configurado en n8n

## ✅ Lo que está funcionando:
- ✅ n8n está corriendo en puerto 5678
- ✅ El chat está enviando mensajes correctamente
- ✅ El manejo de errores funciona (respuestas de fallback)

## ❌ Lo que falta:
- ❌ El webhook "Growsbot" no está configurado en n8n

## 🔧 SOLUCIÓN: Configurar el webhook en n8n

### Paso 1: Abrir n8n
```
http://localhost:5678
```

### Paso 2: Crear un nuevo workflow
1. Haz clic en "New workflow"
2. Arrastra un nodo "Webhook" al canvas
3. Configura el webhook:
   - **Path**: `Growsbot`
   - **Method**: `POST`
   - **Response Mode**: `On Received`

### Paso 3: Agregar nodo de respuesta
1. Arrastra un nodo "Respond to Webhook"
2. Conecta el webhook con el nodo de respuesta
3. Configura la respuesta:
   ```json
   {
     "response": "Hola! Soy GrowsBot, tu asistente de construcción. ¿En qué puedo ayudarte?"
   }
   ```

### Paso 4: Activar el workflow
1. Haz clic en el toggle "Active" en la esquina superior derecha
2. El workflow debe estar en verde (activo)

### Paso 5: Probar el webhook
Una vez configurado, el chat funcionará automáticamente.

## 🎯 Estructura del webhook esperada:

### Datos que recibe n8n:
```json
{
  "message": "Mensaje del usuario",
  "userName": "Jose",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "1234567890"
}
```

### Respuesta que debe devolver n8n:
```json
{
  "response": "Respuesta del bot"
}
```

## 🚀 Una vez configurado:
- El chat enviará mensajes a n8n automáticamente
- n8n procesará los mensajes
- Las respuestas aparecerán en el chat
- Si n8n no está disponible, usará respuestas de fallback

## 📝 Notas:
- El webhook debe estar **ACTIVO** para funcionar
- La URL del webhook es: `http://localhost:5678/webhook/Growsbot`
- Puedes agregar más nodos en n8n para procesar los mensajes (IA, base de datos, etc.)
|