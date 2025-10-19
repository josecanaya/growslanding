# 🚨 PROBLEMA IDENTIFICADO: Workflow no devuelve respuesta de IA

## ❌ El problema:
El webhook está recibiendo los datos correctamente pero **NO está devolviendo la respuesta de la IA**. Por eso el chat siempre muestra: "Gracias por tu mensaje. ¿En qué más puedo ayudarte?"

## 🔍 Lo que está pasando:
1. ✅ Chat envía mensaje a n8n
2. ✅ n8n recibe los datos correctamente
3. ✅ n8n tiene el prompt configurado
4. ❌ **n8n NO devuelve la respuesta de la IA**

## 🔧 SOLUCIÓN: Configurar el workflow en n8n

### Paso 1: Abrir el workflow
```
http://localhost:5678/workflow/9rLKASIssMG1Lo0X
```

### Paso 2: Verificar la configuración
El workflow debe tener esta estructura:

```
[Webhook] → [IA/LLM] → [Respond to Webhook]
```

### Paso 3: Configurar el nodo de IA
1. **Agregar nodo de IA** (OpenAI, Claude, etc.)
2. **Configurar el prompt**:
   ```
   Sos GrowsBot, un asistente técnico experto en construcción, planificación y gestión de obras. Responde siempre en español, con precisión y tono profesional.
   
   Mensaje del usuario: {{ $json.message }}
   ```

### Paso 4: Configurar "Respond to Webhook"
1. **Agregar nodo "Respond to Webhook"**
2. **Configurar la respuesta**:
   ```json
   {
     "response": "{{ $json.response }}"
   }
   ```
   O simplemente:
   ```json
   "{{ $json.response }}"
   ```

### Paso 5: Activar el workflow
- Asegúrate de que el toggle esté en verde (activo)

## 🎯 Estructura correcta del workflow:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│   Webhook   │───▶│     IA      │───▶│ Respond to      │
│  (Growsbot) │    │  (OpenAI/   │    │ Webhook         │
│             │    │   Claude)    │    │                 │
└─────────────┘    └─────────────┘    └─────────────────┘
```

## 🚀 Una vez configurado:
- El chat recibirá respuestas inteligentes de la IA
- Las respuestas serán específicas para construcción
- El bot responderá en español con tono profesional

## 📝 Notas importantes:
- El nodo "Respond to Webhook" es **CRÍTICO**
- Sin este nodo, n8n no devuelve respuesta
- La respuesta debe estar en el campo correcto (response, message, etc.)
