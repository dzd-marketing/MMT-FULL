-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 05, 2026 at 02:29 PM
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
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `available_balance` decimal(15,2) DEFAULT 0.00,
  `spent_balance` decimal(15,2) DEFAULT 0.00,
  `total_history_balance` decimal(15,2) DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'USD',
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`id`, `user_id`, `email`, `available_balance`, `spent_balance`, `total_history_balance`, `currency`, `last_updated`) VALUES
(1, 1, 'danukadanuka21865@gmail.com', 0.00, 0.00, 0.00, 'USD', '2026-03-04 16:36:06'),
(2, 32, 'educatelux1@gmail.com', 0.00, 0.00, 0.00, 'USD', '2026-03-04 16:36:06'),
(3, 2, 'makemetrendweb@gmail.com', 0.00, 0.00, 0.00, 'USD', '2026-03-04 16:36:06'),
(4, 33, 'nomsaraakash@gmail.com', 1.00, 0.00, 0.00, 'USD', '2026-03-04 17:15:39'),
(5, 31, 'quizz.world1@gmail.com', 0.00, 0.00, 0.00, 'USD', '2026-03-04 16:36:06'),
(6, 34, 'uvaktrading@gmail.com', 1.00, 1.00, 0.00, 'USD', '2026-03-04 17:15:53'),
(8, 35, 'nimsaraakash194@gmail.com', 1.00, 1.00, 0.00, 'USD', '2026-03-04 17:15:49'),
(9, 36, 'nimsaraakash919@gmail.com', 1.00, 1.00, 0.00, 'USD', '2026-03-04 17:15:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
