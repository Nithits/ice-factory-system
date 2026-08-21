/*
  Warnings:

  - You are about to drop the `TripItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `TripItem` DROP FOREIGN KEY `TripItem_iceProductId_fkey`;

-- DropForeignKey
ALTER TABLE `TripItem` DROP FOREIGN KEY `TripItem_tripId_fkey`;

-- DropTable
DROP TABLE `TripItem`;

-- CreateTable
CREATE TABLE `trip_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tripId` INTEGER NOT NULL,
    `iceProductId` INTEGER NOT NULL,
    `loadedQuantity` INTEGER NOT NULL,
    `deliveredQuantity` INTEGER NOT NULL DEFAULT 0,
    `remainingQuantity` INTEGER NOT NULL,

    UNIQUE INDEX `trip_items_tripId_iceProductId_key`(`tripId`, `iceProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trip_items` ADD CONSTRAINT `trip_items_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_items` ADD CONSTRAINT `trip_items_iceProductId_fkey` FOREIGN KEY (`iceProductId`) REFERENCES `IceProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
