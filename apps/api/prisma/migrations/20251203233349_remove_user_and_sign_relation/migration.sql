/*
  Warnings:

  - You are about to drop the column `userId` on the `signs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."signs" DROP CONSTRAINT "signs_userId_fkey";

-- AlterTable
ALTER TABLE "signs" DROP COLUMN "userId";
