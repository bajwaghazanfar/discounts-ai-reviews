/*
  Warnings:

  - Added the required column `companyResponse` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `like` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "testimonial" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "like" INTEGER NOT NULL,
    "companyResponse" TEXT NOT NULL,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("author", "createdAt", "id", "imageUrl", "productId", "rating", "testimonial", "title") SELECT "author", "createdAt", "id", "imageUrl", "productId", "rating", "testimonial", "title" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
