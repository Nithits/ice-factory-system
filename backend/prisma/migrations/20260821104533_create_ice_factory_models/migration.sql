/*
  Warnings:

  - You are about to drop the `trips` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `trips` DROP FOREIGN KEY `trips_userId_fkey`;

-- DropForeignKey
ALTER TABLE `trips` DROP FOREIGN KEY `trips_vehicleId_fkey`;

-- DropTable
DROP TABLE `trips`;

-- DropTable
DROP TABLE `users`;

-- DropTable
DROP TABLE `vehicles`;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'DRIVER') NOT NULL DEFAULT 'DRIVER',
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vehicle_plate_key`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IceProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'กระสอบ',
    `price` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trip` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,
    `status` ENUM('LOADING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'LOADING',
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TripItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tripId` INTEGER NOT NULL,
    `iceProductId` INTEGER NOT NULL,
    `loadedQuantity` INTEGER NOT NULL,
    `deliveredQuantity` INTEGER NOT NULL DEFAULT 0,
    `remainingQuantity` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `TripItem_tripId_iceProductId_key`(`tripId`, `iceProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Delivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tripId` INTEGER NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paymentStatus` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
    `deliveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliveryId` INTEGER NOT NULL,
    `iceProductId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `totalPrice` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GpsLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `tripId` INTEGER NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `speed` DOUBLE NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GpsLog_vehicleId_recordedAt_idx`(`vehicleId`, `recordedAt`),
    INDEX `GpsLog_tripId_recordedAt_idx`(`tripId`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripItem` ADD CONSTRAINT `TripItem_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripItem` ADD CONSTRAINT `TripItem_iceProductId_fkey` FOREIGN KEY (`iceProductId`) REFERENCES `IceProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryItem` ADD CONSTRAINT `DeliveryItem_deliveryId_fkey` FOREIGN KEY (`deliveryId`) REFERENCES `Delivery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryItem` ADD CONSTRAINT `DeliveryItem_iceProductId_fkey` FOREIGN KEY (`iceProductId`) REFERENCES `IceProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GpsLog` ADD CONSTRAINT `GpsLog_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GpsLog` ADD CONSTRAINT `GpsLog_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
