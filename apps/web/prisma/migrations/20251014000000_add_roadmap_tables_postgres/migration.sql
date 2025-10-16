-- CreateTable
CREATE TABLE "roadmap_objetivos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_grupos_tareas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivo_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_grupos_tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tareas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "texto" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "estimateHrs" INTEGER,
    "responsable" TEXT,
    "objetivo_id" UUID,
    "grupo_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_tareas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "roadmap_grupos_tareas" ADD CONSTRAINT "roadmap_grupos_tareas_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "roadmap_objetivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tareas" ADD CONSTRAINT "roadmap_tareas_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "roadmap_objetivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tareas" ADD CONSTRAINT "roadmap_tareas_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "roadmap_grupos_tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

