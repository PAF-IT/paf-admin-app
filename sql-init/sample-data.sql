CREATE DATABASE `paf-admin`;
USE `paf-admin`;


CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mattress_balance` int(11) NOT NULL DEFAULT 0,
  `mattress_reserved` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: api_tokens
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `api_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `name` varchar(64) NOT NULL,
  `type` varchar(64) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 11835 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: bankruns
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `bankruns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `invoices` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `total_amount_cash` int(10) unsigned NOT NULL,
  `total_amount_cheque` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 40 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: bookings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_date` date DEFAULT NULL,
  `mattress_booking` tinyint(1) NOT NULL DEFAULT 0,
  `name` varchar(128) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `sci_member` tinyint(1) DEFAULT 0,
  `email` varchar(128) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `city` varchar(128) DEFAULT NULL,
  `arrival` date NOT NULL,
  `departure` date NOT NULL,
  `people_count` int(11) DEFAULT 1,
  `membership_count` int(11) DEFAULT 0,
  `info` varchar(1024) DEFAULT '',
  `cancelled` tinyint(1) DEFAULT 0,
  `show_on_website` tinyint(4) NOT NULL DEFAULT 1,
  `paid` tinyint(1) DEFAULT 0,
  `date_paid` date DEFAULT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `invoice_nr` varchar(64) NOT NULL DEFAULT '',
  `no_stay_pay` tinyint(1) DEFAULT 0,
  `no_meal_pay` tinyint(1) DEFAULT 0,
  `longstayer` tinyint(1) DEFAULT 0,
  `group_name` varchar(128) DEFAULT '',
  `stay_days` int(11) DEFAULT 0,
  `paf_events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `stay_rate` int(10) unsigned DEFAULT 0,
  `institutional` tinyint(1) DEFAULT 0,
  `stay_amount` int(11) DEFAULT 0,
  `membership_amount` int(11) DEFAULT 0,
  `meals_amount` int(11) DEFAULT 0,
  `custom_amount` int(10) unsigned DEFAULT 0,
  `mattress_donation` int(10) unsigned DEFAULT 0,
  `total_amount` int(11) DEFAULT 0,
  `sci_days_used` int(11) NOT NULL DEFAULT 0,
  `stay_amount_orig` int(11) NOT NULL DEFAULT 0,
  `membership_amount_orig` int(11) DEFAULT 0,
  `meals_amount_orig` int(11) NOT NULL DEFAULT 0,
  `early_pay` tinyint(1) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5767 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: events
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `abbreviation` varchar(16) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `contact_email` varchar(64) DEFAULT NULL,
  `announcement_link` varchar(512) DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `participant_count` int(11) NOT NULL DEFAULT 0,
  `bookings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `info` tinytext DEFAULT NULL,
  `event_price_day` decimal(3, 0) DEFAULT 0,
  `meal_price_day` decimal(3, 0) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 45 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: invoices
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_nr` varchar(32) NOT NULL,
  `name` varchar(128) NOT NULL,
  `address` varchar(256) NOT NULL,
  `city` varchar(32) NOT NULL,
  `zip` varchar(16) NOT NULL,
  `country` varchar(32) NOT NULL,
  `email` varchar(128) NOT NULL,
  `date` date NOT NULL,
  `total_amount` int(11) NOT NULL DEFAULT 0,
  `stay_label` varchar(512) DEFAULT NULL,
  `stay_amount` int(11) DEFAULT 0,
  `stay_start` date DEFAULT NULL,
  `stay_end` date DEFAULT NULL,
  `membership_label` varchar(512) DEFAULT NULL,
  `membership_amount` int(11) DEFAULT 0,
  `meals_label` varchar(512) DEFAULT NULL,
  `meals_amount` int(11) DEFAULT 0,
  `custom_amount` decimal(10, 0) DEFAULT 0,
  `custom_label` varchar(512) DEFAULT NULL,
  `pdf_path` varchar(256) DEFAULT NULL,
  `payment_type` varchar(8) NOT NULL,
  `date_paid` date DEFAULT NULL,
  `date_deposited` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2070 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: mattress_transactions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `mattress_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `allocator` varchar(128) DEFAULT NULL,
  `transaction` varchar(8) NOT NULL,
  `type` varchar(32) NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` varchar(512) NOT NULL,
  `booking_id` int(10) unsigned DEFAULT NULL,
  `booking_nights` int(10) unsigned DEFAULT NULL,
  `amount` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2120 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: members
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `members` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `renew_date` date NOT NULL,
  `name` varchar(128) NOT NULL,
  `email` varchar(128) NOT NULL,
  `address` varchar(512) NOT NULL,
  `zip` varchar(16) NOT NULL,
  `city` varchar(128) NOT NULL,
  `country` varchar(64) NOT NULL,
  `newsletter` tinyint(1) DEFAULT 0,
  `sci_member` tinyint(1) DEFAULT 0,
  `sci_days_used` tinyint(4) DEFAULT 0,
  `sci_days_used_prev_year` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `pdf_path` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 7030 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: settings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_nr` int(10) unsigned NOT NULL,
  `deleted_invoice_nrs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`deleted_invoice_nrs`)),
  `short_stay_duration` int(10) unsigned NOT NULL,
  `price_meals` int(11) NOT NULL,
  `price_membership` int(11) NOT NULL,
  `price_stay` int(11) NOT NULL,
  `price_stay_short` int(11) NOT NULL,
  `price_stay_month` int(10) unsigned NOT NULL,
  `mattress_membership` int(10) unsigned NOT NULL,
  `house_capacity` int(10) unsigned NOT NULL,
  `text_meals` varchar(512) NOT NULL,
  `text_membership` varchar(512) NOT NULL,
  `text_stay` varchar(512) NOT NULL,
  `sci_days` int(11) NOT NULL,
  `last_sci_days_reset` year(4) NOT NULL,
  `last_newsletter_retrieval` date DEFAULT NULL,
  `app_version` tinytext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` varchar(128) NOT NULL,
  `role` tinytext NOT NULL,
  `password` varchar(128) NOT NULL,
  `remember_me_token` varchar(128) DEFAULT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8mb3 COLLATE = utf8mb3_general_ci;


-- Some sample settings data...
INSERT INTO
  `settings` (
    `id`,
    `invoice_nr`,
    `deleted_invoice_nrs`,
    `short_stay_duration`,
    `price_meals`,
    `price_membership`,
    `price_stay`,
    `price_stay_short`,
    `price_stay_month`,
    `mattress_membership`,
    `house_capacity`,
    `text_meals`,
    `text_membership`,
    `text_stay`,
    `sci_days`,
    `last_sci_days_reset`,
    `last_newsletter_retrieval`,
    `app_version`
  )
VALUES
  (
    1,
    250365,
    '[]',
    4,
    15,
    20,
    18,
    20,
    16,
    8,
    45,
    'Frais séminaires',
    'Frais d\'adhesion',
    'Participation aux frais de fonctionnement pour la période du',
    33,
    '2025',
    '2023-11-01',
    '1.2.4'
  );
