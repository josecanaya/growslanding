-- CreateTable
CREATE TABLE "RoadmapObjetivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "progreso" REAL NOT NULL DEFAULT 0,
    "startWeek" INTEGER,
    "endWeek" INTEGER,
    "targetWeeks" INTEGER,
    "dueDate" DATETIME,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoadmapGrupoTareas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapGrupoTareas_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "RoadmapObjetivo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadmapTarea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "texto" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "estimateHrs" INTEGER,
    "owner" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "dueDate" DATETIME,
    "objetivoId" TEXT,
    "grupoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapTarea_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "RoadmapObjetivo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoadmapTarea_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "RoadmapGrupoTareas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
