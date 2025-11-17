# 🚀 Guía: Trabajo Local y Deploy Incremental

## 📋 Tabla de Contenidos
1. [Configuración Inicial](#configuración-inicial)
2. [Trabajar Localmente](#trabajar-localmente)
3. [Subir Cambios de a Poco](#subir-cambios-de-a-poco)
4. [Ver Cambios en Vercel](#ver-cambios-en-vercel)
5. [Buenas Prácticas](#buenas-prácticas)

---

## 🔧 Configuración Inicial

### 1. Clonar y configurar el proyecto

```bash
# Si ya tenés el repo, asegurate de estar actualizado
git pull origin main

# Instalar dependencias (desde la raíz del proyecto)
pnpm install

# Configurar variables de entorno
# Copiar .env.example a .env.local en cada app si existe
```

### 2. Variables de entorno necesarias

**Para `apps/web`:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (opcional, para desarrollo)

**Para `apps/landing`:**
- Variables de Next.js según necesites

---

## 💻 Trabajar Localmente

### Desarrollo de la App Web

```bash
# Desde la raíz del proyecto
cd apps/web
pnpm dev

# O desde la raíz (si está configurado)
pnpm dev:web
```

La app estará en: `http://localhost:3000`

### Desarrollo de la Landing

```bash
# Desde la raíz del proyecto
cd apps/landing
pnpm dev

# O desde la raíz
pnpm dev
```

La landing estará en: `http://localhost:3001` (o el puerto que Next.js asigne)

### Ver cambios en tiempo real

- Los cambios en archivos `.tsx`, `.ts`, `.css` se reflejan automáticamente
- Si cambias variables de entorno, reiniciá el servidor
- Si cambias Prisma schema, corré: `pnpm prisma:generate`

---

## 📤 Subir Cambios de a Poco

### Estrategia: Commits Pequeños y Frecuentes

#### 1. Ver qué cambió

```bash
# Ver archivos modificados
git status

# Ver diferencias detalladas
git diff

# Ver cambios de un archivo específico
git diff apps/web/components/socio/TopBar.tsx
```

#### 2. Hacer un commit pequeño

```bash
# Agregar archivos específicos (NO usar git add . a menos que estés seguro)
git add apps/web/components/socio/TopBar.tsx
git add apps/web/app/socio/panel/page.tsx

# Hacer commit con mensaje descriptivo
git commit -m "fix(socio): elimina TopBar duplicado en panel page"

# O usar el formato que tenés configurado
git commit -m "fix(socio): corrige avatares duplicados en header"
```

#### 3. Subir a una rama (recomendado)

```bash
# Crear una rama nueva para tu feature/fix
git checkout -b fix/avatar-duplicado

# Hacer tus commits
git add .
git commit -m "fix(socio): elimina TopBar duplicado"

# Subir la rama
git push origin fix/avatar-duplicado
```

**Ventaja:** Vercel crea un preview deployment automático para cada push a una rama.

#### 4. O subir directo a main (si estás seguro)

```bash
# Verificar que todo esté bien
git status
git diff

# Hacer commit
git add .
git commit -m "fix(socio): elimina TopBar duplicado"

# Subir a main
git push origin main
```

---

## 🌐 Ver Cambios en Vercel

### Preview Deployments (Ramas)

1. **Crear una rama y pushear:**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   git push origin feature/nueva-funcionalidad
   ```

2. **Vercel automáticamente:**
   - Detecta el push
   - Crea un preview deployment
   - Te da una URL única tipo: `grows-app-abc123.vercel.app`

3. **Ver el preview:**
   - Andá a tu dashboard de Vercel
   - Buscá el deployment de la rama
   - Hacé clic para ver la URL

### Production Deploy (main)

1. **Cuando estés listo para producción:**
   ```bash
   # Asegurate de estar en main y actualizado
   git checkout main
   git pull origin main
   
   # Mergear tu rama (si usaste rama)
   git merge feature/nueva-funcionalidad
   
   # O hacer commit directo
   git add .
   git commit -m "feat: nueva funcionalidad"
   
   # Push a main
   git push origin main
   ```

2. **Vercel automáticamente:**
   - Detecta el push a `main`
   - Hace build y deploy a producción
   - Los cambios aparecen en `app.grows.com.ar` y `grows.com.ar`

---

## ✅ Buenas Prácticas

### 1. Commits Atómicos

**❌ Mal:**
```bash
git commit -m "cambios varios"
```

**✅ Bien:**
```bash
git commit -m "fix(socio): elimina TopBar duplicado"
git commit -m "feat(auth): agrega redirección a app.grows.com.ar"
git commit -m "style(landing): actualiza precios de planes"
```

### 2. Trabajar en Ramas

```bash
# Para cada feature/fix, crear una rama
git checkout -b fix/nombre-del-fix
git checkout -b feature/nombre-de-feature

# Trabajar, hacer commits
# Push y crear PR (si usás GitHub) o mergear directo
```

### 3. Probar Localmente Antes de Push

```bash
# Build local para verificar errores
cd apps/web
pnpm build

# Si hay errores, corregilos antes de push
```

### 4. Revisar Cambios Antes de Commit

```bash
# Ver qué vas a commitear
git diff --staged

# Si algo no debería estar, sacarlo
git reset HEAD archivo-que-no-quiero.tsx
```

### 5. Flujo Recomendado Diario

```bash
# 1. Actualizar tu código local
git pull origin main

# 2. Crear rama para tu trabajo
git checkout -b fix/mi-cambio

# 3. Trabajar localmente
# ... hacer cambios ...
pnpm dev:web  # probar en local

# 4. Commit pequeño
git add archivos-especificos
git commit -m "fix: descripción clara"

# 5. Push (crea preview en Vercel)
git push origin fix/mi-cambio

# 6. Ver preview en Vercel, si está bien:
git checkout main
git merge fix/mi-cambio
git push origin main
```

---

## 🐛 Troubleshooting

### Error: "Merge conflict"

```bash
# Ver archivos con conflictos
git status

# Resolver manualmente o usar herramienta
git mergetool

# Después de resolver
git add archivo-resuelto.tsx
git commit -m "fix: resuelve conflictos de merge"
```

### Error: "Build failed in Vercel"

1. Probar build local:
   ```bash
   cd apps/web
   pnpm build
   ```

2. Si falla local, corregir antes de push

3. Revisar logs en Vercel para más detalles

### Deshacer un commit (aún no pusheado)

```bash
# Deshacer último commit pero mantener cambios
git reset --soft HEAD~1

# Deshacer último commit y cambios
git reset --hard HEAD~1
```

---

## 📝 Ejemplo de Flujo Completo

```bash
# 1. Actualizar
git pull origin main

# 2. Crear rama
git checkout -b fix/avatar-duplicado

# 3. Hacer cambios en TopBar.tsx y panel/page.tsx
# ... editar archivos ...

# 4. Probar localmente
cd apps/web
pnpm dev
# Abrir http://localhost:3000 y verificar

# 5. Commit
git add apps/web/components/socio/TopBar.tsx
git add apps/web/app/socio/panel/page.tsx
git commit -m "fix(socio): elimina TopBar duplicado en panel"

# 6. Push (crea preview)
git push origin fix/avatar-duplicado

# 7. Ver preview en Vercel, si está bien:
git checkout main
git merge fix/avatar-duplicado
git push origin main

# 8. Limpiar rama local (opcional)
git branch -d fix/avatar-duplicado
```

---

## 🎯 Resumen Rápido

**Para trabajar local:**
```bash
pnpm dev:web    # App web en localhost:3000
pnpm dev        # Landing en localhost:3001
```

**Para subir cambios:**
```bash
git add archivos
git commit -m "tipo(alcance): descripción"
git push origin main  # o nombre-de-rama
```

**Para ver preview:**
- Push a una rama → Vercel crea preview automático
- Push a main → Deploy a producción

---

¿Necesitás ayuda con algo específico? Preguntame! 🚀


