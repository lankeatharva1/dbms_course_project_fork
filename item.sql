CREATE TABLE item (
    item_id INT PRIMARY KEY,
    item_type_id INT,
    complaint_id INT UNIQUE,  -- 🔥 MAIN CHANGE
    status VARCHAR(10) NOT NULL,
    status_change_date DATETIME,
    FOREIGN KEY (item_type_id) REFERENCES item_type(item_type_id),
    FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id),
    CONSTRAINT chk_item_status CHECK (status IN ('lost','found'))
);
INSERT INTO item (item_id, item_type_id, complaint_id, status) VALUES
(100, 1, 1, 'lost'),
(101, 2, 2, 'lost'),
(102, 3, 3, 'lost'),

(200, 1, 4, 'lost'),
(201, 2, 5, 'lost'),

(300, 3, 6, 'lost'),
(301, 4, 7, 'lost'),

(400, 5, 8, 'lost'),
(401, 1, 9, 'lost'),

(500, 2, 10, 'lost');