# 🧠 Configuración de Base de Conocimiento GROWS en n8n

## 📋 Configuración del Nodo de Base de Conocimiento

### 1. **Agregar nodo "Knowledge Base" en n8n**
- Buscar "Knowledge Base" en la lista de nodos
- Conectar después del nodo de IA/LLM
- Configurar la base de conocimiento

### 2. **Configuración del nodo:**

#### **Base de Conocimiento:**
```json
{
  "name": "GROWS Knowledge Base",
  "description": "Base de conocimiento completa de GROWS - plataforma de gestión de obras",
  "source": "knowledge/grows_context.json"
}
```

#### **Prompt del sistema mejorado:**
```
Eres GrowsBot, un asistente técnico experto en construcción y gestión de obras. 

CONTEXTO DE GROWS:
GROWS es una plataforma B2B de gestión inteligente de obras que centraliza la planificación, ejecución y control de proyectos de construcción de pequeña y mediana escala.

FUNCIONALIDADES PRINCIPALES:
- Gestión de obras y proyectos de construcción
- Catálogo de más de 1800 tareas constructivas
- Plantillas de elementos reutilizables
- Gestión de cuadrillas y especialidades
- Sistema de notificaciones y calendario
- Control de costos y plazos

ROLES EN LA PLATAFORMA:
1. Socio Constructor: Ejecuta tareas, reporta avances, gestiona cuadrillas
2. Supervisor: Audita calidad, valida entregables, autoriza hitos
3. Cliente Técnico: Planifica obras, coordina equipos, toma decisiones

ESPECIALIDADES DE CUADRILLAS:
- Albañilería
- Yesería  
- Carpintería
- Pintura
- Instalaciones

ESTADOS DE TAREAS:
- Propuesta → Presupuestada → Asignada → En Ejecución → Terminada → Validada

INSTRUCCIONES:
- Responde siempre en español con tono profesional
- Usa terminología técnica de construcción
- Proporciona consejos prácticos y específicos
- Si no sabes algo específico de GROWS, dilo claramente
- Mantén las respuestas concisas pero completas

Mensaje del usuario: {{ $json.message }}
```

### 3. **Estructura del workflow completo:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webhook   │───▶│ Knowledge   │───▶│     IA/LLM      │───▶│ Respond to      │
│  (Growsbot) │    │ Base        │    │  (OpenAI/       │    │ Webhook         │
│             │    │             │    │   Claude)        │    │                 │
└─────────────┘    └─────────────┘    └─────────────────┘    └─────────────────┘
```

### 4. **Configuración del nodo "Respond to Webhook":**
```json
{
  "response": "{{ $json.response }}"
}
```

## 🔄 Sistema de Regeneración Automática

### Script de regeneración:
```bash
# Ejecutar manualmente
node scripts/generate-knowledge.js

# O usar el script de PowerShell
.\scripts\regenerate-knowledge.ps1
```

### Archivos monitoreados:
- `prisma/seeds/plantillas-elementos.ts`
- `prisma/seeds/plantillas-tareas.ts`
- `prisma/seeds/suscripciones.ts`
- `prisma/seeds/usuarios.ts`
- `knowledge/grows_context.json`

## 🎯 Beneficios de la Base de Conocimiento:

### ✅ **Respuestas más precisas:**
- Información específica de GROWS
- Terminología técnica correcta
- Contexto de roles y permisos

### ✅ **Actualización automática:**
- Se regenera cuando cambian los seeds
- Mantiene información actualizada
- Sincronización con la base de datos

### ✅ **Mejor experiencia de usuario:**
- Respuestas contextualizadas
- Consejos específicos de construcción
- Información de la plataforma GROWS

## 🚀 Una vez configurado:

1. **El chat tendrá acceso completo** a la información de GROWS
2. **Las respuestas serán específicas** para construcción y gestión de obras
3. **El conocimiento se actualizará automáticamente** cuando cambien los seeds
4. **GrowsBot será un verdadero experto** en la plataforma GROWS
