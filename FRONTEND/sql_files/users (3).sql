-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 06, 2026 at 02:59 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smm_panel`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `balance` decimal(21,4) NOT NULL DEFAULT 0.0000,
  `spent` decimal(21,4) NOT NULL DEFAULT 0.0000,
  `balance_type` enum('1','2') NOT NULL DEFAULT '2',
  `debit_limit` double DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `profile_picture` text DEFAULT NULL,
  `auth_provider` enum('local','google','both') DEFAULT 'local',
  `admin_type` enum('1','2') NOT NULL DEFAULT '2',
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verification_token` varchar(500) DEFAULT NULL,
  `email_verification_expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `login_ip` varchar(225) DEFAULT NULL,
  `apikey` text DEFAULT NULL,
  `tel_type` enum('1','2') NOT NULL DEFAULT '1',
  `client_type` enum('1','2') NOT NULL DEFAULT '2',
  `access` text DEFAULT NULL,
  `lang` varchar(255) NOT NULL DEFAULT 'en',
  `timezone` double NOT NULL DEFAULT 0,
  `currency_type` varchar(10) DEFAULT NULL,
  `ref_code` text DEFAULT NULL,
  `ref_by` text DEFAULT NULL,
  `change_email` enum('1','2') NOT NULL DEFAULT '2',
  `resend_max` int(11) NOT NULL DEFAULT 3,
  `currency` varchar(225) NOT NULL DEFAULT '1',
  `passwordreset_token` varchar(225) DEFAULT NULL,
  `discount_percentage` int(11) NOT NULL DEFAULT 0,
  `broadcast_id` varchar(255) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `balance`, `spent`, `balance_type`, `debit_limit`, `whatsapp`, `google_id`, `profile_picture`, `auth_provider`, `admin_type`, `password`, `is_active`, `email_verified`, `email_verification_token`, `email_verification_expires`, `created_at`, `updated_at`, `last_login`, `login_ip`, `apikey`, `tel_type`, `client_type`, `access`, `lang`, `timezone`, `currency_type`, `ref_code`, `ref_by`, `change_email`, `resend_max`, `currency`, `passwordreset_token`, `discount_percentage`, `broadcast_id`) VALUES
(64, 'Danuka3', 'educatelux1@gmail.com', '0776121326', 0.0000, 0.0000, '2', NULL, '0776121326', '113336139623733959687', 'https://lh3.googleusercontent.com/a/ACg8ocJ5_YZHlBiA1A1FZeHkGs4xa1PWf8GxhbgQEfLn8BymjXBc6g=s96-c', 'local', '2', '$2a$12$0s6tw9pGrZA1sLigub7VrOsWC7pQwSPDq8hPPZFJAWCu254rAQEqK', 1, 1, NULL, NULL, '2026-03-04 23:12:43', '2026-03-05 00:35:03', '2026-03-04 23:19:27', NULL, NULL, '1', '2', NULL, 'en', 0, NULL, NULL, NULL, '2', 3, '1', NULL, 0, '0'),
(71, 'Danuka', 'makemetrendweb@gmail.com', '0776121326', 35.3160, 61.9620, '2', NULL, '0776121326', '102851615178576859108', 'https://lh3.googleusercontent.com/a/ACg8ocLZgySb_Iu49Ehgkxl3hUwN2x6i7e4iOLUuGn1iomDQa9CGAw=s96-c', 'both', '2', '$2a$12$mRMBIoeYJRBceZpMNzs1COCiz.LujBKBS/o0lrvpDBfwlRXV.enpm', 1, 1, NULL, NULL, '2026-03-05 00:44:41', '2026-03-06 13:12:27', '2026-03-05 01:02:50', NULL, NULL, '1', '2', NULL, 'en', 0, NULL, NULL, NULL, '2', 3, '1', NULL, 0, '0'),
(72, 'danuka32', 'danukadanuka21865@gmail.com', '0776121326', 0.0000, 0.0000, '2', NULL, '0776121326', NULL, NULL, 'local', '2', '$2a$12$.cOtsMTsIg6AEfYdpRPiE.dkCcgoLE7rdQC2r7M/Y.cbQc7NRyOXm', 1, 0, NULL, NULL, '2026-03-05 01:04:04', '2026-03-05 01:04:04', NULL, NULL, NULL, '1', '2', NULL, 'en', 0, NULL, NULL, NULL, '2', 3, '1', NULL, 0, '0');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_balance` (`balance`),
  ADD KEY `idx_client_type` (`client_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
