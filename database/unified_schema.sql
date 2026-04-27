-- Lost and Found Portal - Unified Database Schema
-- Combines original structure with enhanced features

CREATE DATABASE IF NOT EXISTS lost_found_db;
USE lost_found_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS complaint;
DROP TABLE IF EXISTS item_type;
DROP TABLE IF EXISTS users;


-- ORIGINAL STRUCTURE (from GitHub repo)


-- Users Table (Original)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- Added for authentication
    role ENUM('user', 'admin') DEFAULT 'user',  -- Added for role-based access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Item Type Table (Original)
CREATE TABLE item_type (
    item_type_id INT AUTO_INCREMENT PRIMARY KEY,
    item_description VARCHAR(50) NOT NULL
);

-- Complaint Table (Original - represents lost/found reports)
CREATE TABLE complaint (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    location VARCHAR(100) NOT NULL,
    complaint_date DATE NOT NULL,
    complaint_status VARCHAR(20) NOT NULL DEFAULT 'open',
    complaint_closure_date DATETIME,
    item_name VARCHAR(100),  -- Added
    item_description TEXT,  -- Added
    contact_email VARCHAR(100),  -- Added
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_complaint_status CHECK (complaint_status IN ('open','closed')),
    INDEX idx_status (complaint_status),
    INDEX idx_user (user_id)
);

-- Item Table (Original - represents actual items)
CREATE TABLE item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_type_id INT,
    complaint_id INT UNIQUE,
    status VARCHAR(10) NOT NULL,
    status_change_date DATETIME,
    tracking_id VARCHAR(20) UNIQUE,  -- Added for tracking
    FOREIGN KEY (item_type_id) REFERENCES item_type(item_type_id),
    FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    CONSTRAINT chk_item_status CHECK (status IN ('lost','found')),
    INDEX idx_tracking (tracking_id),
    INDEX idx_status (status)
);


-- ENHANCED FEATURES


-- Claims Table (for claiming items)
CREATE TABLE claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT,
    claim_description TEXT,
    claim_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_claim_status (claim_status)
);


-- TRIGGERS (from original repo)


-- Trigger: Auto-update status_change_date when item status changes
DELIMITER //
CREATE TRIGGER update_item_status_date
BEFORE UPDATE ON item
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        SET NEW.status_change_date = NOW();
    END IF;
END//
DELIMITER ;

-- Trigger: Auto-close complaint when item status changes to 'found'
DELIMITER //
CREATE TRIGGER close_complaint_on_found
AFTER UPDATE ON item
FOR EACH ROW
BEGIN
    IF NEW.status = 'found' AND OLD.status = 'lost' THEN
        UPDATE complaint 
        SET complaint_status = 'closed', 
            complaint_closure_date = NOW()
        WHERE complaint_id = NEW.complaint_id;
    END IF;
END//
DELIMITER ;


-- SAMPLE DATA


-- Insert sample users
INSERT INTO users (user_name, phone_no, email, password_hash, role) VALUES
('Admin User', '9999999999', 'admin@portal.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'admin'),
('Aditya', '8888888888', 'aditya@gmail.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'user'),
('Suresh', '9999999999', 'suresh@gmail.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'user'),
('Arnav', '9845634721', 'arnav@gmail.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'user'),
('Girish', '9788834123', 'girish@gmail.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'user'),
('Rahul', '8321934562', 'rahul@gmail.com', '$2a$10$rZ8qH5YxJ5YxJ5YxJ5YxJOqH5YxJ5YxJ5YxJ5YxJ5YxJ5YxJ5YxJO', 'user');

-- Insert item types
INSERT INTO item_type (item_description) VALUES
('Camera'),
('Jewellery'),
('Phone'),
('Money'),
('Documents'),
('Electronics'),
('Clothing'),
('Accessories'),
('Keys'),
('Other');

-- Insert sample complaints (lost/found reports)
INSERT INTO complaint (user_id, location, complaint_date, complaint_status, item_name, item_description, contact_email) VALUES
(2, 'Indiranagar', '2025-06-10', 'open', 'Blue Backpack', 'Navy blue Wildcraft backpack with laptop sleeve', 'aditya@gmail.com'),
(2, 'Kondwa', '2025-06-11', 'open', 'iPhone 13', 'Black iPhone 13 with cracked screen protector', 'aditya@gmail.com'),
(2, 'Sinhagad', '2025-06-09', 'closed', 'Student ID Card', 'ID card of Priya Sharma, Dept. of CS', 'aditya@gmail.com'),
(3, 'Sahakarnagar', '2025-06-12', 'open', 'Car Keys', 'Honda car keys with red keychain', 'suresh@gmail.com'),
(3, 'Katraj', '2025-06-08', 'open', 'Wired Earphones', 'White Sony earphones in black pouch', 'suresh@gmail.com'),
(4, 'Sinhagad', '2025-06-13', 'closed', 'Leather Wallet', 'Brown leather wallet with cash and cards', 'arnav@gmail.com'),
(4, 'Kondwa', '2025-06-14', 'open', 'Gold Ring', 'Gold ring with diamond', 'arnav@gmail.com'),
(5, 'Bibwewadi', '2025-06-15', 'open', 'Laptop', 'Dell Inspiron 15 laptop', 'girish@gmail.com'),
(5, 'Tilak Road', '2025-06-16', 'open', 'Umbrella', 'Black umbrella with wooden handle', 'girish@gmail.com'),
(6, 'Kasba Peth', '2025-06-17', 'open', 'Water Bottle', 'Blue Milton water bottle', 'rahul@gmail.com');

-- Insert sample items
INSERT INTO item (item_type_id, complaint_id, status, tracking_id) VALUES
(7, 1, 'lost', 'LF-1001'),  -- Backpack (Clothing)
(3, 2, 'found', 'LF-1002'), -- iPhone (Phone)
(5, 3, 'lost', 'LF-1003'),  -- ID Card (Documents)
(9, 4, 'found', 'LF-1004'), -- Keys
(6, 5, 'lost', 'LF-1005'),  -- Earphones (Electronics)
(8, 6, 'found', 'LF-1006'), -- Wallet (Accessories)
(2, 7, 'lost', 'LF-1007'),  -- Ring (Jewellery)
(6, 8, 'lost', 'LF-1008'),  -- Laptop (Electronics)
(10, 9, 'found', 'LF-1009'), -- Umbrella (Other)
(10, 10, 'lost', 'LF-1010'); -- Water Bottle (Other)


-- VIEWS FOR EASY QUERYING


-- View: Complete item details with user and type info
CREATE OR REPLACE VIEW v_item_details AS
SELECT 
    i.item_id,
    i.tracking_id,
    i.status,
    i.status_change_date,
    it.item_description as category,
    c.item_name,
    c.item_description as description,
    c.location,
    c.complaint_date as item_date,
    c.complaint_status,
    c.contact_email,
    u.user_name,
    u.phone_no,
    u.email as user_email
FROM item i
JOIN item_type it ON i.item_type_id = it.item_type_id
JOIN complaint c ON i.complaint_id = c.complaint_id
LEFT JOIN users u ON c.user_id = u.user_id;


-- STORED PROCEDURES


-- Procedure: Find matching items
DELIMITER //
CREATE PROCEDURE find_matches(
    IN p_item_id INT,
    IN p_category VARCHAR(50),
    IN p_location VARCHAR(100),
    IN p_date DATE,
    IN p_status VARCHAR(10)
)
BEGIN
    DECLARE opposite_status VARCHAR(10);
    
    -- Determine opposite status
    IF p_status = 'lost' THEN
        SET opposite_status = 'found';
    ELSE
        SET opposite_status = 'lost';
    END IF;
    
    -- Find matches with scoring
    SELECT 
        i.item_id,
        i.tracking_id,
        i.status,
        it.item_description as category,
        c.item_name,
        c.location,
        c.complaint_date as item_date,
        c.contact_email,
        (
            CASE WHEN it.item_description = p_category THEN 3 ELSE 0 END +
            CASE WHEN c.location LIKE CONCAT('%', p_location, '%') THEN 2 ELSE 0 END +
            CASE WHEN ABS(DATEDIFF(c.complaint_date, p_date)) <= 7 THEN 1 ELSE 0 END
        ) as match_score
    FROM item i
    JOIN item_type it ON i.item_type_id = it.item_type_id
    JOIN complaint c ON i.complaint_id = c.complaint_id
    WHERE i.status = opposite_status 
        AND c.complaint_status = 'open'
        AND i.item_id != p_item_id
    HAVING match_score > 0
    ORDER BY match_score DESC
    LIMIT 10;
END//
DELIMITER ;


-- INDEXES FOR PERFORMANCE


CREATE INDEX idx_complaint_date ON complaint(complaint_date);
CREATE INDEX idx_complaint_location ON complaint(location);
CREATE INDEX idx_item_status_date ON item(status, status_change_date);

-- Display success message
SELECT 'Database setup completed successfully!' as Status;
SELECT COUNT(*) as 'Total Users' FROM users;
SELECT COUNT(*) as 'Total Items' FROM item;
SELECT COUNT(*) as 'Total Complaints' FROM complaint;
