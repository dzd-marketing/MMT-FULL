-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2026 at 12:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `config`
--

CREATE TABLE `config` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `config`
--

INSERT INTO `config` (`id`, `config_key`, `config_value`, `created_at`, `updated_at`) VALUES
(1, 'maintenance_mode', '0', '2026-03-09 07:24:07', '2026-03-09 16:22:58'),
(3, 'site_logo', '/uploads/config/config-1773077210474-917378008.png', '2026-03-09 07:24:07', '2026-03-09 17:26:50'),
(4, 'alert_message', 'test', '2026-03-09 07:24:07', '2026-03-09 13:51:07'),
(5, 'alert_enabled', '1', '2026-03-09 07:24:07', '2026-03-09 15:19:32'),
(6, 'alert_type', 'info', '2026-03-09 07:24:07', '2026-03-09 15:19:32'),
(7, 'site_keywords', 'SMM Panel, Social Media Marketing, Buy Followers, Sri Lanka', '2026-03-09 12:46:58', '2026-03-09 12:46:58'),
(8, 'contact_email', 'support@makemetrend.com', '2026-03-09 12:50:31', '2026-03-09 16:41:44'),
(13, 'site_description', 'Best SMM Panel in Sri Lanka. Buy Facebook, Instagram, TikTok, YouTube followers, likes, views at cheapest price.', '2026-03-09 13:19:35', '2026-03-09 13:19:35'),
(14, 'site_name', 'MAKE ME TREND', '2026-03-09 13:32:01', '2026-03-09 13:32:01'),
(15, 'site_title', 'MAKE ME TREND - Best SMM Panel in Sri Lanka', '2026-03-09 13:32:01', '2026-03-09 13:32:01'),
(16, 'alert_heading', 'Site update', '2026-03-09 13:32:01', '2026-03-09 13:32:53'),
(17, 'alert_description', 'kjb\'rtjmb\'rktmb\'rtk', '2026-03-09 13:32:01', '2026-03-09 13:32:58'),
(18, 'contact_phone', '+94 77 123 4346', '2026-03-09 13:32:01', '2026-03-09 16:42:48'),
(19, 'contact_whatsapp', '94743404814', '2026-03-09 13:32:01', '2026-03-09 15:17:47'),
(20, 'facebook_url', 'https://whatsapp.com/channel/0029Vb6wKyZ0LKZLFKIngy2J', '2026-03-09 13:32:01', '2026-03-09 15:09:55'),
(24, 'telegram_url', 'https://whatsapp.com/channel/0029Vb6wKyZ0LKZLFKIngy2J', '2026-03-09 13:32:01', '2026-03-09 15:09:55'),
(26, 'address', 'D/87, Main Street, Colombo, Sri Lanka', '2026-03-09 13:32:01', '2026-03-09 17:28:27'),
(46, 'whatsapp_channel', 'https://whatsapp.com/channel/0029Vb6wKyZ0LKZLFKIngy2J', '2026-03-09 14:22:58', '2026-03-09 15:08:05'),
(53, 'whatsapp_url', 'https://wa.me/94771234567', '2026-03-09 15:17:47', '2026-03-09 15:17:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `config`
--
ALTER TABLE `config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
