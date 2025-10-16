/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Obra` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `Obra` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Obra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "localizacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Obra" ("estado", "id", "nombre", "updatedAt") SELECT "estado", "id", "nombre", "updatedAt" FROM "Obra";
DROP TABLE "Obra";
ALTER TABLE "new_Obra" RENAME TO "Obra";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
