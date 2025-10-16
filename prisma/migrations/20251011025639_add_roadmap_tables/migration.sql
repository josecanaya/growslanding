-- CreateTable
CREATE TABLE "roadmap_objetivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "progreso" REAL NOT NULL DEFAULT 0,
    "startWeek" INTEGER,
    "endWeek" INTEGER,
    "targetWeeks" INTEGER,
    "dueDate" TEXT,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roadmap_grupos_tareas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "roadmap_grupos_tareas_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "roadmap_objetivos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roadmap_tareas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "texto" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "estimateHrs" INTEGER,
    "responsable" TEXT,
    "objetivoId" TEXT,
    "grupoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "roadmap_tareas_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "roadmap_objetivos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "roadmap_tareas_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "roadmap_grupos_tareas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
