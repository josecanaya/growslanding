-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "localizacion" TEXT,
    "cliente" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "cantidad_plantas" INTEGER,
    "superficie_por_planta" REAL,
    "superficie_total" REAL,
    "ancho_terreno" REAL,
    "largo_terreno" REAL,
    "ancho_planta" REAL,
    "largo_planta" REAL,
    "tipo_proyecto" TEXT,
    "coordenadas_lat" REAL,
    "coordenadas_lng" REAL,
    "direccion_completa" TEXT,
    "fecha_inicio" TEXT,
    "presupuesto" TEXT,
    "descripcion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
