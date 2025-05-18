-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "score1" INTEGER NOT NULL,
    "score2" INTEGER NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
