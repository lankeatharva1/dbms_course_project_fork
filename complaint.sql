CREATE TABLE complaint (
    complaint_id INT PRIMARY KEY,
    user_id INT,
    location VARCHAR(100) NOT NULL,
    complaint_date DATE NOT NULL,
    complaint_status VARCHAR(20) NOT NULL,
    complaint_closure_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT chk_status CHECK (complaint_status IN ('open','closed'))
);

INSERT INTO complaint (complaint_id, user_id, location, complaint_date, complaint_status) VALUES

(1, 1, 'indiranagar', '2026-03-19', 'open'),
(2, 1, 'kondwa', '2026-03-21', 'open'),
(3, 1, 'sinhagad', '2026-03-22', 'open'),
(4, 2, 'sahakarnagar', '2025-08-31', 'open'),
(5, 2, 'katraj', '2025-09-29', 'open'),
(6, 3, 'sinhagad', '2026-03-23', 'open'),
(7, 3, 'kondwa', '2026-03-24', 'open'),
(8, 4, 'Bibwewadi', '2025-12-29', 'open'),
(9, 4, 'Tilak road', '2025-11-22', 'open'),
(10, 5, 'kasba peth', '2025-10-23', 'open');