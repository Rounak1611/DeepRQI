/*
  Warnings:

  - The primary key for the `detections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bbox` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `damageType` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `detections` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `detections` table. All the data in the column will be lost.
  - The primary key for the `road_images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `imagePath` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `roadId` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `road_images` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `road_images` table. All the data in the column will be lost.
  - The primary key for the `roads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `district` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `roadName` on the `roads` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `roads` table. All the data in the column will be lost.
  - The primary key for the `rqi_scores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `breakdown` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `roadId` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `rqi_scores` table. All the data in the column will be lost.
  - You are about to drop the column `totalPenalty` on the `rqi_scores` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - Added the required column `damage_type` to the `detections` table without a default value. This is not possible if the table is not empty.
  - The required column `detection_id` was added to the `detections` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `image_id` to the `detections` table without a default value. This is not possible if the table is not empty.
  - The required column `image_id` was added to the `road_images` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `image_path` to the `road_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `road_id` to the `road_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaded_by` to the `road_images` table without a default value. This is not possible if the table is not empty.
  - The required column `road_id` was added to the `roads` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `road_name` to the `roads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_id` to the `rqi_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `road_id` to the `rqi_scores` table without a default value. This is not possible if the table is not empty.
  - The required column `rqi_id` was added to the `rqi_scores` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `total_penalty` to the `rqi_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - The required column `user_id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "detections" DROP CONSTRAINT "detections_imageId_fkey";

-- DropForeignKey
ALTER TABLE "road_images" DROP CONSTRAINT "road_images_roadId_fkey";

-- DropForeignKey
ALTER TABLE "road_images" DROP CONSTRAINT "road_images_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "rqi_scores" DROP CONSTRAINT "rqi_scores_imageId_fkey";

-- DropForeignKey
ALTER TABLE "rqi_scores" DROP CONSTRAINT "rqi_scores_roadId_fkey";

-- AlterTable
ALTER TABLE "detections" DROP CONSTRAINT "detections_pkey",
DROP COLUMN "bbox",
DROP COLUMN "confidence",
DROP COLUMN "damageType",
DROP COLUMN "id",
DROP COLUMN "imageId",
DROP COLUMN "severity",
ADD COLUMN     "damage_type" TEXT NOT NULL,
ADD COLUMN     "detection_id" TEXT NOT NULL,
ADD COLUMN     "image_id" TEXT NOT NULL,
ADD CONSTRAINT "detections_pkey" PRIMARY KEY ("detection_id");

-- AlterTable
ALTER TABLE "road_images" DROP CONSTRAINT "road_images_pkey",
DROP COLUMN "id",
DROP COLUMN "imagePath",
DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "roadId",
DROP COLUMN "uploadedAt",
DROP COLUMN "uploadedById",
ADD COLUMN     "image_id" TEXT NOT NULL,
ADD COLUMN     "image_path" TEXT NOT NULL,
ADD COLUMN     "road_id" TEXT NOT NULL,
ADD COLUMN     "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploaded_by" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD CONSTRAINT "road_images_pkey" PRIMARY KEY ("image_id");

-- AlterTable
ALTER TABLE "roads" DROP CONSTRAINT "roads_pkey",
DROP COLUMN "district",
DROP COLUMN "id",
DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "location",
DROP COLUMN "roadName",
DROP COLUMN "state",
ADD COLUMN     "road_id" TEXT NOT NULL,
ADD COLUMN     "road_name" TEXT NOT NULL,
ADD CONSTRAINT "roads_pkey" PRIMARY KEY ("road_id");

-- AlterTable
ALTER TABLE "rqi_scores" DROP CONSTRAINT "rqi_scores_pkey",
DROP COLUMN "breakdown",
DROP COLUMN "category",
DROP COLUMN "generatedAt",
DROP COLUMN "id",
DROP COLUMN "imageId",
DROP COLUMN "roadId",
DROP COLUMN "score",
DROP COLUMN "totalPenalty",
ADD COLUMN     "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image_id" TEXT NOT NULL,
ADD COLUMN     "road_id" TEXT NOT NULL,
ADD COLUMN     "rqi_id" TEXT NOT NULL,
ADD COLUMN     "total_penalty" DOUBLE PRECISION NOT NULL,
ADD CONSTRAINT "rqi_scores_pkey" PRIMARY KEY ("rqi_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "passwordHash",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- AddForeignKey
ALTER TABLE "road_images" ADD CONSTRAINT "road_images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_images" ADD CONSTRAINT "road_images_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("road_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rqi_scores" ADD CONSTRAINT "rqi_scores_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("road_id") ON DELETE RESTRICT ON UPDATE CASCADE;
