-- AlterTable
ALTER TABLE "Character" ADD COLUMN "itemLevel" INTEGER;
ALTER TABLE "Character" ADD COLUMN "roleType" TEXT;
ALTER TABLE "Character" ADD COLUMN "spec" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "wechatName" TEXT,
    "guildName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Member" ("active", "createdAt", "displayName", "id", "note", "updatedAt", "wechatName") SELECT "active", "createdAt", "displayName", "id", "note", "updatedAt", "wechatName" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE INDEX "Member_displayName_idx" ON "Member"("displayName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
