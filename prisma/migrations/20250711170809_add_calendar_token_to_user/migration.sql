/*
  Warnings:

  - A unique constraint covering the columns `[calendarToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "calendarToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_calendarToken_key" ON "users"("calendarToken");
