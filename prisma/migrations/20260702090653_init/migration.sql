-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GuildEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "raidName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "type" TEXT NOT NULL DEFAULT 'RAID',
    "description" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "location" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 40,
    "tankNeed" INTEGER NOT NULL DEFAULT 0,
    "healerNeed" INTEGER NOT NULL DEFAULT 0,
    "meleeNeed" INTEGER NOT NULL DEFAULT 0,
    "rangedNeed" INTEGER NOT NULL DEFAULT 0,
    "leaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GuildEvent_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GuildEvent" ("createdAt", "description", "endsAt", "id", "location", "startsAt", "title", "type", "updatedAt") SELECT "createdAt", "description", "endsAt", "id", "location", "startsAt", "title", "type", "updatedAt" FROM "GuildEvent";
DROP TABLE "GuildEvent";
ALTER TABLE "new_GuildEvent" RENAME TO "GuildEvent";
CREATE INDEX "GuildEvent_startsAt_idx" ON "GuildEvent"("startsAt");
CREATE INDEX "GuildEvent_status_idx" ON "GuildEvent"("status");
CREATE INDEX "GuildEvent_raidName_idx" ON "GuildEvent"("raidName");
CREATE INDEX "GuildEvent_leaderId_idx" ON "GuildEvent"("leaderId");
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "wechatName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Member" ("createdAt", "displayName", "id", "note", "updatedAt", "wechatName") SELECT "createdAt", "displayName", "id", "note", "updatedAt", "wechatName" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE INDEX "Member_displayName_idx" ON "Member"("displayName");
CREATE TABLE "new_Signup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "characterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SIGNED_UP',
    "role" TEXT NOT NULL DEFAULT 'ranged',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Signup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GuildEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Signup_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Signup" ("characterId", "createdAt", "eventId", "id", "memberId", "note", "status", "updatedAt") SELECT "characterId", "createdAt", "eventId", "id", "memberId", "note", "status", "updatedAt" FROM "Signup";
DROP TABLE "Signup";
ALTER TABLE "new_Signup" RENAME TO "Signup";
CREATE INDEX "Signup_eventId_idx" ON "Signup"("eventId");
CREATE INDEX "Signup_memberId_idx" ON "Signup"("memberId");
CREATE UNIQUE INDEX "Signup_eventId_memberId_key" ON "Signup"("eventId", "memberId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
