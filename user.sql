CREATE TABLE users (
    user_id INT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE
);

INSERT INTO users (user_id, user_name, phone_no, email) VALUES
(1, 'aditya', '888888888', 'afdj@gmail.com'),
(2, 'suresh', '999999999', 'suresh@gmail.com'),
(3, 'Arnav', '9845634721', 'arnav@gmail.com'),
(4, 'Girish', '97888834123', 'girish@gmail.com'),
(5, 'Rahul', '8321934562', 'rahul@gmail.com');