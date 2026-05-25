-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrocaDia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Registro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoria" TEXT NOT NULL,
    "realizado" REAL NOT NULL,
    "meta" REAL NOT NULL,
    "trocaDiaId" INTEGER NOT NULL,
    CONSTRAINT "Registro_trocaDiaId_fkey" FOREIGN KEY ("trocaDiaId") REFERENCES "TrocaDia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "TrocaDia_data_key" ON "TrocaDia"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Registro_trocaDiaId_categoria_key" ON "Registro"("trocaDiaId", "categoria");
