
-- Create database
CREATE DATABASE IF NOT EXISTS wifi;

USE wifi;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) DEFAULT 0,
  speed VARCHAR(50),
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NULL,
  mikrotik_user VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

