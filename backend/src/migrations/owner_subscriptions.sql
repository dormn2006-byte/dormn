-- migration SQL for owner subscriptions

-- 1. Alter the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier ENUM('free','standard','pro','custom') DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('trial','active','expired','cancelled') DEFAULT 'trial';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cycle ENUM('monthly','yearly') NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_pg_listings INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_plan_config JSON DEFAULT NULL;

-- 2. Create the owner_subscriptions table
CREATE TABLE IF NOT EXISTS owner_subscriptions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   owner_id INT NOT NULL,
   plan_name VARCHAR(50) NOT NULL,
   billing_cycle ENUM('monthly','yearly') NOT NULL,
   amount DECIMAL(10,2) NOT NULL,
   razorpay_order_id VARCHAR(255),
   razorpay_payment_id VARCHAR(255),
   razorpay_signature VARCHAR(255),
   status ENUM('created','successful','failed','refunded') DEFAULT 'created',
   valid_from DATETIME NOT NULL,
   valid_until DATETIME NOT NULL,
   cancelled_at DATETIME NULL,
   custom_plan_config JSON DEFAULT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
   INDEX (owner_id),
   INDEX (status),
   INDEX (razorpay_order_id)
);
