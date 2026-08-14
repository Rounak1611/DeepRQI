CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSPECTOR');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INSPECTOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "roads" (
    "road_id" TEXT NOT NULL,
    "road_name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "location" geography(Point,4326),

    CONSTRAINT "roads_pkey" PRIMARY KEY ("road_id")
);

-- CreateTable
CREATE TABLE "road_images" (
    "image_id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "detections" (
    "detection_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "damage_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "bbox" JSONB NOT NULL,

    CONSTRAINT "detections_pkey" PRIMARY KEY ("detection_id")
);

-- CreateTable
CREATE TABLE "rqi_scores" (
    "rqi_id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "total_penalty" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rqi_scores_pkey" PRIMARY KEY ("rqi_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "road_images" ADD CONSTRAINT "road_images_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("road_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_images" ADD CONSTRAINT "road_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "road_images"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rqi_scores" ADD CONSTRAINT "rqi_scores_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("road_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rqi_scores" ADD CONSTRAINT "rqi_scores_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "road_images"("image_id") ON DELETE RESTRICT ON UPDATE CASCADE;
