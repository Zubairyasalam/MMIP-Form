-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `mmip_form` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mmip_form`;

-- Table structure for table `forms`
CREATE TABLE IF NOT EXISTS `forms` (
  `id` VARCHAR(255) NOT NULL,
  `data` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `responses`
CREATE TABLE IF NOT EXISTS `responses` (
  `id` VARCHAR(255) NOT NULL,
  `response_id` VARCHAR(255) DEFAULT NULL,
  `data` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_response_id` (`response_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
