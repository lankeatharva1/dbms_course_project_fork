CREATE TABLE item_type (
    item_type_id INT PRIMARY KEY,
    item_description VARCHAR(50) NOT NULL
);

INSERT INTO item_type (item_type_id, item_description) VALUES
(1, 'camera'),
(2, 'jewellery'),
(3, 'Phone'),
(4, 'Money'),
(5, 'Documents');