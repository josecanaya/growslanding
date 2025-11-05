# 📦 BACKUP - Componentes Obras Obsoletos

**Fecha de creación**: 2025-10-31 15:58

Este directorio contiene componentes obsoletos de la sección "Obras" que fueron movidos a la papelera para limpieza del código.

## 📁 Estructura del Backup

### `wizard_legacy/`
Carpeta completa `components/clienteTecnico/wizard/` (~35 archivos)
- Wizards obsoletos:
  - `WizardCrearObra.tsx`
  - `WizardCrearObraNuevo.tsx`
  - `WizardCrearObraMejorado.tsx`
- Pasos obsoletos del wizard legacy
- Procesadores BIM/IFC no usados
- Modales del wizard legacy
- Otros componentes auxiliares

**Razón**: Reemplazado por `components/obras/wizardNuevo/WizardCrearObraLayout.tsx`

---

### `archivos_individuales/`
Archivos obsoletos individuales:
- `LegajoTecnicoSection.tsx` - Reemplazado por `LegajoOrganizado.tsx`
- `ModalCargarLegajo.tsx` - Modal obsoleto

**Razón**: Componentes duplicados o reemplazados por versiones nuevas.

---

### `wizard_nuevo_pasos_obsoletos/`
Pasos no usados del wizard nuevo (`components/obras/wizardNuevo/`):
- `PasoDatosGenerales.tsx`
- `PasoLegajos.tsx`
- `PasoMetodoCarga.tsx`
- `PasoResumen.tsx`

**Razón**: El wizard actual solo usa 3 pasos:
1. `PasoDatosBasicos.tsx` ✅
2. `PasoSuperficies.tsx` ✅
3. `PasoCargaElementos.tsx` ✅

---

## ⚠️ ADVERTENCIA

**NO eliminar estos archivos definitivamente** hasta verificar que:
1. No hay referencias a estos componentes en el código
2. No hay funcionalidades importantes que dependan de ellos
3. La aplicación funciona correctamente sin ellos

## 🔄 Para restaurar

Si necesitas recuperar algún archivo:
1. Copia el archivo de `backup_obras_obsoletos/` de vuelta a su ubicación original
2. Verifica que no haya conflictos con componentes actuales

## ✅ Componentes que NO se movieron (en uso)

- `components/obras/containers/ObrasListContainer.tsx` - ✅ EN USO (app/obras/page.tsx)
- `components/obras/ui/ObrasStatsRow.tsx` - ✅ EN USO (ObrasListContainer)
- `components/clienteTecnico/ObrasSection.tsx` - ✅ EN USO (app/cliente-tecnico/page.tsx)
- `components/clienteTecnico/DetalleObra.tsx` - ✅ EN USO


