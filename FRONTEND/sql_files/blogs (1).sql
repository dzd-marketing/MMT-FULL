-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 09, 2026 at 07:08 AM
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
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `short_description` text DEFAULT NULL,
  `full_description` longtext DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `slug`, `short_description`, `full_description`, `featured_image`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'Getting Started with SMM Marketing in 2026', 'getting-started-with-smm-marketing-2026', 'Learn the fundamentals of social media marketing and how to boost your online presence effectively.', '<h2>Introduction to SMM Marketing</h2><p>Social Media Marketing (SMM) has become an essential part of any business strategy. With billions of active users across various platforms, the potential reach is enormous.</p><h3>Why SMM Matters</h3><p>In today\'s digital age, your customers are on social media. Whether it\'s Instagram, TikTok, Facebook, or LinkedIn, having a strong social media presence can:</p><ul><li>Increase brand awareness</li><li>Drive website traffic</li><li>Generate leads and sales</li><li>Build customer loyalty</li></ul><h3>Getting Started</h3><p>To begin your SMM journey, you need to:</p><ol><li>Identify your target audience</li><li>Choose the right platforms</li><li>Create engaging content</li><li>Track and analyze results</li></ol><p>With MAKE ME TREND, you can accelerate your growth with our premium SMM services.</p>', 'https://files.catbox.moe/9np11k.png', '2026-03-07 16:27:25', '2026-03-07 16:27:25', '2026-03-07 16:27:25'),
(2, 'Top 10 TikTok Trends to Watch in 2026', 'top-10-tiktok-trends-2026', 'Stay ahead of the curve with these viral TikTok trends that are taking over the platform this year.', '<h2>TikTok Trends 2026</h2><p>TikTok continues to dominate the social media landscape with new trends emerging every week. Here are the top trends you need to know:</p><h3>1. AI-Generated Content</h3><p>Creators are using AI tools to generate unique content, from music to visual effects.</p><h3>2. Interactive Livestreams</h3><p>Live shopping and interactive Q&A sessions are becoming increasingly popular.</p><h3>3. Niche Communities</h3><p>Smaller, focused communities are growing faster than general content.</p><h3>4. Educational Content</h3><p>\'Edutainment\' (education + entertainment) is on the rise.</p><h3>5. Brand Collaborations</h3><p>Authentic partnerships with micro-influencers are outperforming big-budget ads.</p><p>Want to boost your TikTok presence? Check out our TikTok services!</p>', 'https://files.catbox.moe/9np11k.png', '2026-03-07 16:27:25', '2026-03-07 16:27:25', '2026-03-07 16:27:25'),
(3, 'How to Choose the Right SMM Panel', 'how-to-choose-right-smm-panel', 'Not all SMM panels are created equal. Learn what to look for when selecting a service provider.', '<h2>Choosing an SMM Panel</h2><p>With so many SMM panels available, how do you choose the right one? Here are key factors to consider:</p><h3>1. Service Quality</h3><p>Look for panels that offer real, high-quality engagement rather than bot traffic.</p><h3>2. Delivery Speed</h3><p>Fast delivery is important, but instant delivery isn\'t always best (can look suspicious).</p><h3>3. Customer Support</h3><p>24/7 support is essential when you need help with your orders.</p><h3>4. Pricing</h3><p>Compare prices, but remember: the cheapest isn\'t always the best.</p><h3>5. API Access</h3><p>If you\'re a developer or reseller, API access is crucial.</p><p>MAKE ME TREND excels in all these areas. Try us today!</p>', 'https://files.catbox.moe/9np11k.png', '2026-03-07 16:27:25', '2026-03-07 16:27:25', '2026-03-07 16:27:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
