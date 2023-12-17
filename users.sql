CREATE TABLE IF NOT EXISTS user (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER,
    peleton_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES role(ID),
    FOREIGN KEY (peleton_id) REFERENCES peleton(ID)
);

CREATE TABLE IF NOT EXISTS kompani (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    FOREIGN KEY (leader_id) REFERENCES user(ID)
);

CREATE TABLE IF NOT EXISTS peleton (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kompani_id INTEGER,
    FOREIGN KEY (kompani_id) REFERENCES kompani(ID)
);

CREATE TABLE IF NOT EXISTS role (
    ID INTEGER PRIMARY KEY AUTOINCREment,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parent_child (
    parent_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES user(ID),
    FOREIGN KEY (child_id) REFERENCES user(ID)
);



INSERT INTO kompani (name, leader_id) VALUES
('Alpha Kompani', 1),
('Bravo Kompani', 2),
('Charlie Kompani', 3);
 
INSERT INTO peleton (name, kompani_id) VALUES
('Peleton 1', 1),
('Peleton 2', 1),
('Peleton 3', 2),
('Peleton 4', 2),
('Peleton 5', 3);
 
 
INSERT INTO user (username, firstname, lastname, mobile, email, password, role_id, peleton_id) VALUES
('john_doe', 'John', 'Doe', '1234567890', 'john@example.com', 'password123', 1, 1),
('jane_doe', 'Jane', 'Doe', '0987654321', 'jane@example.com', 'password123', 2, 1),
('admin_user', 'Admin', 'User', '1122334455', 'admin@example.com', 'password123', 3, 2),
('parent_user', 'Parent', 'User', '5566778899', 'parent@example.com', 'password123', 4, 2);


INSERT INTO user (username, firstname, lastname, mobile, email, password, role_id, peleton_id) VALUES
('odder', 'Odd', 'Erik', '18397298', 'odd@example.com', 'password123', 1, 3);


INSERT INTO role (name) VALUES
('Soldier'),
('Leader'),
('Administrator'),
('Parent'),
('NotActivated');

INSERT INTO parent_child (parent_id, child_id) VALUES
(4, 1),
(4, 2)