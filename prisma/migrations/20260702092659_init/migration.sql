-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Signup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "characterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'signed',
    "role" TEXT NOT NULL DEFAULT 'ranged',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Signup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GuildEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signup_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Signup" ("characterId", "createdAt", "eventId", "id", "memberId", "note", "role", "status", "updatedAt") SELECT "characterId", "createdAt", "eventId", "id", "memberId", "note", "role", "status", "updatedAt" FROM "Signup";
DROP TABLE "Signup";
ALTER TABLE "new_Signup" RENAME TO "Signup";
CREATE INDEX "Signup_eventId_idx" ON "Signup"("eventId");
CREATE INDEX "Signup_memberId_idx" ON "Signup"("memberId");
CREATE UNIQUE INDEX "Signup_eventId_memberId_key" ON "Signup"("eventId", "memberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
