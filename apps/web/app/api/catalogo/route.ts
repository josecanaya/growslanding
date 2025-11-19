import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// En Next.js, process.cwd() puede apuntar a la raíz del monorepo o a apps/web
// Necesitamos construir la ruta relativa desde ahí
async function getCatalogoPath() {
  // Intentar diferentes rutas posibles según dónde se ejecute Next.js
  const cwd = process.cwd();
  const possiblePaths = [
    // Si estamos en la raíz del monorepo
    path.join(cwd, 'apps', 'web', 'lib', 'catalogos', 'catalogo-elementos-constructivos.json'),
    // Si estamos en apps/web (cuando Next.js se ejecuta desde ahí)
    path.join(cwd, 'lib', 'catalogos', 'catalogo-elementos-constructivos.json'),
  ];
  
  // Buscar la primera ruta que exista
  for (const filePath of possiblePaths) {
    try {
      await fs.access(filePath);
      console.log('[GET_CATALOGO] Archivo encontrado en:', filePath);
      return filePath;
    } catch {
      // Continuar con la siguiente ruta
    }
  }
  
  // Si ninguna existe, retornar la primera por defecto (para mostrar error más claro)
  console.error('[GET_CATALOGO] No se encontró el archivo en ninguna de las rutas:', possiblePaths);
  return possiblePaths[0];
}

/**
 * GET /api/catalogo
 * Lee el catálogo completo desde el archivo JSON
 */
export async function GET() {
  try {
    const catalogoPath = await getCatalogoPath();
    
    // getCatalogoPath ya verifica que el archivo existe, pero verificamos de nuevo por seguridad
    try {
      await fs.access(catalogoPath);
    } catch (accessError) {
      console.error('[GET_CATALOGO] Archivo no encontrado en:', catalogoPath);
      console.error('[GET_CATALOGO] process.cwd():', process.cwd());
      return NextResponse.json(
        {
          success: false,
          error: `Archivo no encontrado. Ruta intentada: ${catalogoPath}. Verifica que el archivo existe en apps/web/lib/catalogos/`,
        },
        { status: 404 }
      );
    }

    const fileContents = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(fileContents);
    
    return NextResponse.json({
      success: true,
      data: catalogo,
    });
  } catch (error) {
    console.error('[GET_CATALOGO] Error:', error);
    console.error('[GET_CATALOGO] process.cwd():', process.cwd());
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al leer el catálogo',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/catalogo
 * Guarda el catálogo completo en el archivo JSON
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { catalogo } = body;

    if (!catalogo) {
      return NextResponse.json(
        {
          success: false,
          error: 'El catálogo es requerido',
        },
        { status: 400 }
      );
    }

    // Validar estructura básica
    if (!catalogo.catalogo || !catalogo.version || !Array.isArray(catalogo.categorias)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Estructura del catálogo inválida',
        },
        { status: 400 }
      );
    }

    const catalogoPath = await getCatalogoPath();

    // Formatear JSON con indentación de 2 espacios
    const jsonFormateado = JSON.stringify(catalogo, null, 2);

    // Escribir al archivo
    await fs.writeFile(catalogoPath, jsonFormateado, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Catálogo guardado correctamente',
    });
  } catch (error) {
    console.error('[PUT_CATALOGO] Error:', error);
    console.error('[PUT_CATALOGO] process.cwd():', process.cwd());
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al guardar el catálogo',
      },
      { status: 500 }
    );
  }
}

