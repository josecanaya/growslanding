# Wizard Técnico de Elementos Constructivos

## 🎯 Objetivo Cumplido

Se ha creado un **wizard técnico profesional** que permite configuraciones técnicas avanzadas de elementos constructivos, manteniendo toda la lógica de backend intacta y usando únicamente los catálogos existentes.

## ✅ Funcionalidades Implementadas

### 1. **Estructura Wizard Paso a Paso**
- **6 etapas técnicas**: Fundaciones → Muros → Pisos → Cubiertas → Escaleras → Carpinterías
- **Progress bar visual** con iconos y estado de completado
- **Navegación clara** con botones Anterior/Siguiente
- **Una etapa a la vez** para mejor enfoque y organización

### 2. **Cards de Elementos Técnicos**
- **Información técnica completa**: tareas, duración, fases constructivas
- **Estados visuales claros**: disponible vs configurado
- **Hover effects** y animaciones suaves
- **Grid responsive** adaptado a diferentes pantallas

### 3. **Configuraciones Técnicas Avanzadas**
- **Modal de configuración** para cada elemento
- **Parámetros específicos** por tipo de elemento:
  - **Fundaciones**: profundidad, acero, hormigón, recubrimiento
  - **Muros**: espesor, material, aislación, terminación
  - **Losas**: tipo (maciza/alivianada), espesor, acero
  - **Pisos**: tipo cerámico, dimensiones, acabado
  - **Cubiertas**: tipo chapa, espesor, aislación, color
  - **Escaleras**: tipo, ancho, altura, terminación
  - **Carpinterías**: material, tipo, terminación
- **Inputs inteligentes**: dropdowns, números, checkboxes
- **Validación de rangos** y valores técnicos

### 4. **Resumen Dinámico en Modal**
- **Modal lateral** que no ocupa espacio fijo
- **Estadísticas en tiempo real**: elementos, tareas, días, categorías
- **Configuraciones técnicas detalladas** de cada elemento
- **Funcionalidad de exportación** a archivo de texto
- **Botón de quitar elementos** individual

### 5. **Estilo Visual Minimalista y Moderno**
- **Glassmorphism** en navegación sticky
- **Gradientes sutiles** en botones y cards
- **Animaciones suaves** con cubic-bezier
- **Micro-interactions** y hover effects
- **Paleta de colores profesional**: azules, verdes, grises
- **Responsive design** mobile-first

## 🏗️ Arquitectura Técnica

### Componentes Creados
```
apps/web/components/wizard/
├── TecnicoElementosWizard.tsx   # Wizard principal paso a paso
├── ConfiguracionTecnicaModal.tsx # Modal de configuraciones técnicas
├── ResumenModal.tsx             # Modal de resumen dinámico
├── SubgrupoAccordion.tsx        # Accordion de subgrupos (legacy)
├── ElementoCard.tsx             # Card de elemento (legacy)
├── MiniResumenFloat.tsx         # Botón flotante + modal (legacy)
├── ResumenPaso.tsx              # Paso dedicado de resumen (legacy)
└── tecnico-wizard.css           # Estilos minimalistas y modernos
```

### Tipos de Datos
```typescript
interface Seleccion {
  subgrupo: string;              // ej: "Fundaciones y Estructuras"
  elementoNombre: string;        // ej: "Base aislada"
  opcionId: string;              // id única de la configuración
  opcionLabel: string;           // ej: "Profundidad: 120 cm, Acero: Ø12, Hormigón: H21"
  unidad?: string;               // ej: "m²"
  duracionEstimadaDias?: number; // calculado desde tareas
  tareasSugeridas?: string[];    // IDs de tareas del catálogo
}
```

## 🎨 Reglas de Diseño Implementadas

### Visual
- **Subgrupos**: `rounded-xl border shadow-sm` con `data-state=open/closed`
- **Elementos**: Cards con `rounded-xl border p-4 hover:shadow-md transition`
- **Estados**: Verde para seleccionado (`bg-green-50 border-green-300`)
- **Botones**: `btn btn-primary` con estados disabled
- **Responsive**: Mobile-first con grid adaptativo

### Interactividad
- **Hover effects**: Sombra ligera en cards
- **Transiciones**: `transition-all duration-200`
- **Estados**: Visual feedback inmediato
- **Navegación**: Footer con Anterior/Siguiente, botón Confirmar en resumen

## 📊 Mapeo de Opciones (Sin Tocar Catálogos)

Las variantes se derivan del catálogo existente usando reglas heurísticas:

```typescript
const reglasOpciones = {
  "Muro común 15 cm": ["15 cm", "30 cm (doble muro)"],
  "Losa de hormigón armado": ["Maciza", "Alivianada", "Pretensada"],
  "Fundación": ["Superficial", "Profunda"],
  // etc. (solo UI, NO DB)
}
```

## 🔄 Flujo de Usuario Técnico

1. **Paso 1**: Datos básicos de la obra
2. **Paso 2**: Wizard técnico paso a paso
   - **Etapa 1**: Fundaciones y Estructuras
   - **Etapa 2**: Muros
   - **Etapa 3**: Pisos  
   - **Etapa 4**: Cubiertas
   - **Etapa 5**: Escaleras
   - **Etapa 6**: Carpinterías
   - En cada etapa: seleccionar elemento → configurar parámetros técnicos → agregar
   - Resumen dinámico disponible en cualquier momento
3. **Paso 3**: Resumen completo (pantalla dedicada)
   - Revisar todas las configuraciones técnicas
   - Exportar especificaciones
   - Confirmar y continuar
4. **Paso 4**: Revisión de tareas
5. **Paso 5**: Configuración de dependencias

## ✅ Checklist de Aceptación

- ✅ **Estructura wizard paso a paso**: 6 etapas técnicas organizadas
- ✅ **Progress bar visual**: Estado de completado con iconos
- ✅ **Cards técnicas**: Información completa de tareas y duración
- ✅ **Configuraciones avanzadas**: Parámetros técnicos específicos por elemento
- ✅ **Modal de configuración**: Inputs inteligentes (dropdowns, números, checkboxes)
- ✅ **Resumen dinámico**: Modal lateral con estadísticas en tiempo real
- ✅ **Navegación clara**: Botones Anterior/Siguiente en cada paso
- ✅ **Estilo minimalista**: Glassmorphism, gradientes, animaciones suaves
- ✅ **Backend intacto**: No se alteró base de datos ni catálogos
- ✅ **Mobile-first**: Responsive en todas las pantallas

## 🚀 Resultado Final

El wizard técnico ahora ofrece:
- **Configuraciones técnicas avanzadas**: Parámetros específicos por elemento
- **UX profesional**: Navegación paso a paso clara y organizada
- **Flexibilidad técnica**: Múltiples opciones de configuración
- **Feedback visual**: Estados claros y transiciones suaves
- **Exportación**: Funcionalidad para exportar especificaciones
- **Mobile-friendly**: Optimizado para todos los dispositivos

**¡El wizard técnico está completamente implementado y funcionando!** 🎉
