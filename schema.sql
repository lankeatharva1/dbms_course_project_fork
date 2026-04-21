-- Lost and Found Portal Database Schema

CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Items Table
CREATE TABLE IF NOT EXISTS items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  user_id INT,
  item_type ENUM('lost', 'found') NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  location VARCHAR(200) NOT NULL,
  item_date DATE NOT NULL,
  description TEXT,
  contact_email VARCHAR(100) NOT NULL,
  status ENUM('pending', 'resolved', 'closed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_tracking (tracking_id),
  INDEX idx_type (item_type),
  INDEX idx_status (status),
  INDEX idx_category (category)
);

-- Claims Table
CREATE TABLE IF NOT EXISTS claims (
  claim_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  user_id INT,
  claim_description TEXT,
  claim_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_item (item_id),
  INDEX idx_status (claim_status)
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (full_name, email, password_hash, role) VALUES 
('Admin User', 'admin@portal.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'admin');

-- Insert sample items
INSERT INTO items (tracking_id, item_type, item_name, category, location, item_date, description, contact_email, status) VALUES
('LF-1001', 'lost', 'Blue Backpack', 'Clothing', 'Library Block A', '2025-06-10', 'Navy blue Wildcraft backpack with laptop sleeve.', 'rahul@example.com', 'pending'),
('LF-1002', 'found', 'iPhone 13', 'Electronics', 'Cafeteria', '2025-06-11', 'Black iPhone 13 with cracked screen protector.', 'admin@portal.com', 'pending'),
('LF-1003', 'lost', 'Student ID Card', 'Documents', 'Parking Lot', '2025-06-09', 'ID card of Priya Sharma, Dept. of CS.', 'priya@example.com', 'resolved'),
('LF-1004', 'found', 'Car Keys', 'Keys', 'Gym Entrance', '2025-06-12', 'Honda car keys with a red keychain.', 'admin@portal.com', 'pending'),
('LF-1005', 'lost', 'Wired Earphones', 'Electronics', 'Lecture Hall 3', '2025-06-08', 'White Sony earphones in a black pouch.', 'amit@example.com', 'pending'),
('LF-1006', 'found', 'Leather Wallet', 'Accessories', 'Canteen', '2025-06-13', 'Brown leather wallet with some cash and cards.', 'admin@portal.com', 'resolved');
