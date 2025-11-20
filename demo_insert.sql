-- Use the database
USE CondoParkingDB;

-- ----------------------------------------------------------------
-- PART 1: INITIAL DATA SETUP (STAFF, ROOMS, TENANTS, CARS)
-- ----------------------------------------------------------------
START TRANSACTION;

-- 1. Staff (No dependencies)
-- (IDs will be 1: John, 2: Jane)
INSERT INTO Staff (first_name, last_name, position, username, password_hash, access_level, is_Active)
VALUES 
('Warit', 'Yuvaniyama', 'IT Head', 'notonoty', '$2b$10$mYS40K5ikpZo8NK40NY8ieEqnif2wOwCuRLhXYpsTCFtMr75ZZA0K', 'Super-Admin', 1), -- Password: superadmin123
('Jane', 'Smith', 'Security', 'janesmith', '$2b$10$8jHpr4mv4XPcTG10NByKwuc73JPPiHALDI7OXvZmlTvedP87oJND6', 'Staff', 1), -- Password: staff123
('Mike', 'Brown', 'Security', 'mikebrown', '$2b$10$wCaDFr1nM9vd9jHqWBVBxeHKQULpmnyKUp.F7.s0pYJzB0f41si7m', 'Staff', 0), -- Password: staff123 (Inactive)
('Emily', 'Davis', 'Security', 'emilydavis', '$2b$10$mSpWNn1CuOOVkkHkm9YEYu0piyBkk/seTivO9TibEgiR1nSgDQLwq', 'Staff', 1), -- Password: staff123
('John', 'Doe', 'Manager', 'johndoe', '$2b$10$yiwyVLzCBbgsBnQ2maJqyO7QbczS7JAcvILOpu3M5xa3uwdXORddm', 'Admin', 1); -- Password: admin123

-- 2. Parking_Slot (No dependencies)
INSERT INTO Parking_Slot (parking_slot_ID, floor, slot_type) VALUES
-- Floor 1 (20 Slots)
('A-101', '1', 'Fixed_slot'),
('A-102', '1', 'Fixed_slot'),
('A-103', '1', 'Fixed_slot'),
('A-104', '1', 'Fixed_slot'),
('A-105', '1', 'Fixed_slot'),
('A-106', '1', 'Fixed_slot'),
('A-107', '1', 'Fixed_slot'),
('A-108', '1', 'Fixed_slot'),
('A-109', '1', 'Fixed_slot'),
('A-110', '1', 'Fixed_slot'),
('A-111', '1', 'Fixed_slot'),
('A-112', '1', 'Fixed_slot'),
('A-113', '1', 'Fixed_slot'),
('A-114', '1', 'Fixed_slot'),
('A-115', '1', 'Fixed_slot'),
('A-116', '1', 'Fixed_slot'),
('A-117', '1', 'Fixed_slot'),
('A-118', '1', 'Fixed_slot'),
('A-119', '1', 'Fixed_slot'),
('A-120', '1', 'Fixed_slot'),

-- Floor 2 (20 Slots)
('A-201', '2', 'Fixed_slot'),
('A-202', '2', 'Fixed_slot'),
('A-203', '2', 'Fixed_slot'),
('A-204', '2', 'Fixed_slot'),
('A-205', '2', 'Fixed_slot'),
('A-206', '2', 'Fixed_slot'),
('A-207', '2', 'Fixed_slot'),
('A-208', '2', 'Fixed_slot'),
('A-209', '2', 'Fixed_slot'),
('A-210', '2', 'Fixed_slot'),
('A-211', '2', 'Fixed_slot'),
('A-212', '2', 'Fixed_slot'),
('A-213', '2', 'Fixed_slot'),
('A-214', '2', 'Fixed_slot'),
('A-215', '2', 'Fixed_slot'),
('A-216', '2', 'Fixed_slot'),
('A-217', '2', 'Fixed_slot'),
('A-218', '2', 'Fixed_slot'),
('A-219', '2', 'Fixed_slot'),
('A-220', '2', 'Fixed_slot'),

-- Floor 3 (20 Slots)
('A-301', '3', 'Fixed_slot'),
('A-302', '3', 'Fixed_slot'),
('A-303', '3', 'Fixed_slot'),
('A-304', '3', 'Fixed_slot'),
('A-305', '3', 'Fixed_slot'),
('A-306', '3', 'Fixed_slot'),
('A-307', '3', 'Fixed_slot'),
('A-308', '3', 'Fixed_slot'),
('A-309', '3', 'Fixed_slot'),
('A-310', '3', 'Fixed_slot'),
('A-311', '3', 'Fixed_slot'),
('A-312', '3', 'Fixed_slot'),
('A-313', '3', 'Fixed_slot'),
('A-314', '3', 'Fixed_slot'),
('A-315', '3', 'Fixed_slot'),
('A-316', '3', 'Fixed_slot'),
('A-317', '3', 'Fixed_slot'),
('A-318', '3', 'Fixed_slot'),
('A-319', '3', 'Fixed_slot'),
('A-320', '3', 'Fixed_slot');

COMMIT;
START TRANSACTION;

-- 3. Car (Depends on Staff)
INSERT INTO Car (license_number, brand, model, color, staff_id)
VALUES
('AB-1234', 'Toyota', 'Camry', 'Silver', 2),
('CD-5678', 'Honda', 'Civic', 'Black', 4),
('EF-9012', 'Ford', 'Ranger', 'Blue', 2),
('XY-5555', 'Nissan', 'Almera', 'White', 4),
('GT-3000', 'Mazda', '3', 'Red', 2),
('BK-1111', 'BMW', '320i', 'Gray', 4),
('BK-2222', 'Mercedes', 'C-Class', 'White', 2),
('GH-3456', 'Audi', 'A4', 'Blue', 4),
('IJ-7890', 'Lexus', 'ES300', 'Black', 4),
('AZ-1212', 'Volvo', 'S60', 'Silver', 2),
('KL-1122', 'Tesla', 'Model 3', 'Red', 4),
('RE-4567', 'Subaru', 'Outback', 'Green', 2),
('MN-3344', 'Volkswagen', 'Passat', 'White', 4),
('PP-9876', 'Hyundai', 'Sonata', 'Blue', 4),
('QW-1110', 'Kia', 'Optima', 'Gray', 2),
('ER-2233', 'Chevrolet', 'Malibu', 'Black', 4),
('TY-4455', 'Dodge', 'Charger', 'Red', 2),
('UI-6677', 'Jeep', 'Grand Cherokee', 'White', 4),
('OP-8899', 'Ram', '1500', 'Silver', 4),
('VV-1000', 'Porsche', '911', 'Yellow', 2),
('GV-1001', 'Toyota', 'Vios', 'White', 2),
('GV-1002', 'Honda', 'City', 'Black', 4),
('GV-1003', 'Mazda', '2', 'Red', 2),
('GV-1004', 'Nissan', 'Almera', 'Blue', 4),
('GV-1005', 'Suzuki', 'Swift', 'Green', 2);

COMMIT;
START TRANSACTION;

-- 4. Condo_Room (Depends on Car)
-- (IDs will be 1: A-101, 2: A-102)
INSERT INTO Condo_Room (room_id, building, floor, room_type, license_number)
VALUES
('501', 'A', '5', 'Studio', 'AB-1234'),
('502', 'A', '5', '1-Bedroom', NULL),
('503', 'A', '5', 'Studio', NULL),
('601', 'A', '6', '1-Bedroom', 'CD-5678'),
('602', 'A', '6', '2-Bedroom', 'EF-9012'),
('603', 'A', '6', '1-Bedroom', NULL),
('604', 'A', '6', '1-Bedroom', 'XY-5555'),
('801', 'A', '8', 'Studio', NULL),
('802', 'A', '8', 'Studio', NULL),
('803', 'A', '8', '2-Bedroom', 'GT-3000'),
('1001', 'A', '10', '1-Bedroom', 'BK-1111'),
('1002', 'A', '10', '2-Bedroom', 'BK-2222'),
('1003', 'A', '10', '1-Bedroom', NULL),
('1101', 'A', '11', '2-Bedroom', 'GH-3456'),
('1102', 'A', '11', '2-Bedroom', 'IJ-7890'),
('1103', 'A', '11', 'Studio', NULL),
('1104', 'A', '11', '1-Bedroom', 'AZ-1212'),
('1201', 'A', '12', '1-Bedroom', NULL),
('1202', 'A', '12', '2-Bedroom', 'KL-1122'),
('1401', 'A', '14', 'Studio', NULL),
('1402', 'A', '14', 'Studio', 'RE-4567'),
('1501', 'A', '15', '2-Bedroom', 'MN-3344'),
('1502', 'A', '15', '1-Bedroom', NULL),
('1503', 'A', '15', '2-Bedroom', NULL),
('1601', 'A', '16', '1-Bedroom', 'PP-9876'),
('1602', 'A', '16', 'Studio', NULL),
('1701', 'A', '17', '2-Bedroom', 'QW-1110'),
('1801', 'A', '18', 'Studio', 'ER-2233'),
('1802', 'A', '18', '1-Bedroom', NULL),
('1803', 'A', '18', '1-Bedroom', NULL),
('2001', 'A', '20', '2-Bedroom', 'TY-4455'),
('2002', 'A', '20', 'Studio', NULL),
('2101', 'A', '21', '1-Bedroom', 'UI-6677'),
('2201', 'A', '22', '2-Bedroom', NULL),
('2202', 'A', '22', '2-Bedroom', 'OP-8899'),
('2501', 'A', '25', 'Penthouse', 'VV-1000');

COMMIT;
START TRANSACTION;

-- 5. Tenant (Depends on Condo_Room)
INSERT INTO Tenant (username, password_hash, first_name, last_name, gender, tel_no, email, is_primary_contact, tenant_status, room_id)
VALUES
-- Room 501 (1 tenant - primary)
('sophia_w', '$2b$10$d91Ka6c.RYrCBHYylr6uqutzYkTbV8uP7RZhM2P871YBk.IlHc3nu', 'Sophia', 'Williams', 'F', '081-111-1111', 'sophia.w@email.com', 1, 'Active', '501'),
-- Room 502 (2 tenants)
('james_b', '$2b$10$M2uf/m5fAouvVq.dl9rIc.JxH8XVGEkhgPEPXg5zlXwtOblvtyiIi', 'James', 'Brown', 'M', '081-222-2222', 'james.b@email.com', 1, 'Active', '502'),
('emma_b', '$2b$10$nOqlCQZIR8itZJyyOgfTBuoNavja7WX0zV6q8kROOQgyzk1rbTiMm', 'Emma', 'Brown', 'F', '081-222-3333', 'emma.b@email.com', 1, 'Active', '502'),
-- Room 503 (1 tenant)
('oliver_j', '$2b$10$6lEZDY26laPWeq4Lxg1.s.hlS4TYLnkyDTc20qQ3V2C0cS/kwe5bO', 'Oliver', 'Jones', 'M', '081-333-4444', 'oliver.j@email.com', 1, 'Active', '503'),
-- Room 601 (1 tenant)
('ava_g', '$2b$10$Ia7elqYDEz9zcw8V.EU0WOjAQeS9MPEp5dmcZ3jpGBCGDNVr8BkoG', 'Ava', 'Garcia', 'F', '081-444-5555', 'ava.g@email.com', 1, 'Active', '601'),
-- Room 602 (2 tenants)
('liam_m', '$2b$10$oLHKPU5ibYqA0bwb7k/ak.fBDdhcgQuCaO6Ozh6vgveJeYjAXysGy', 'Liam', 'Martinez', 'M', '081-555-6666', 'liam.m@email.com', 1, 'Active', '602'),
('mia_m', '$2b$10$hPhv04plqgn09a2pvxTo6.hGWEaRu3zGpKLqPOTYTAG33MCSMaWeO', 'Mia', 'Martinez', 'F', '081-555-7777', 'mia.m@email.com', 1, 'Active', '602'),
-- Room 603 (1 tenant)
('noah_l', '$2b$10$IySI89N6sWuhmKn6WDGPnurF5kcp37skKQIjx88JlX1i6SyrdvvJ6', 'Noah', 'Lopez', 'M', '081-666-8888', 'noah.l@email.com', 1, 'Active', '603'),
-- Room 604 (1 tenant)
('isabella_h', '$2b$10$npcVj/daoVbZxeNpTgJZluQBknM1fVYjIhgrskMunODkU52HbfU/e', 'Isabella', 'Hernandez', 'F', '081-777-9999', 'isabella.h@email.com', 1, 'Active', '604'),
-- Room 801 (1 tenant)
('ethan_g', '$2b$10$iYm/.p.QO4C9AXVZBGYKD.6ejRf0M8Zh0uJGC5Yxh.OKEVBOJcaD2', 'Ethan', 'Gonzalez', 'M', '082-111-2222', 'ethan.g@email.com', 1, 'Active', '801'),
-- Room 802 (2 tenants)
('amelia_w', '$2b$10$EzHc2yttn1EUVBkch7Fx9ejj4fUnYdY47tLo/tegxqDSQEhGaCR.e', 'Amelia', 'Wilson', 'F', '082-222-3333', 'amelia.w@email.com', 1, 'Active', '802'),
('mason_w', '$2b$10$jOTiAkUIEgON1N0UhLk6Re5kexyugfUS42TwJ8hy4GiUK3PByqw2W', 'Mason', 'Wilson', 'M', '082-222-4444', 'mason.w@email.com', 1, 'Active', '802'),
-- Room 803 (2 tenants)
('charlotte_a', '$2b$10$RAX/P0cO99lAeWbyWnLRcecb59tuUZ2vGftBAVtZIiaacB9fdP8.G', 'Charlotte', 'Anderson', 'F', '082-333-5555', 'charlotte.a@email.com', 1, 'Active', '803'),
('elijah_a', '$2b$10$rq7dJlQhVKfiMBXqjdS9aeF1CizgYjxH45IlsXu3ig.aple/GJ.lS', 'Elijah', 'Anderson', 'M', '082-333-6666', 'elijah.a@email.com', 1, 'Active', '803'),
-- Room 1001 (1 tenant)
('harper_t', '$2b$10$yiOaL4aUtIS.kIq8fDK2U.E0VghYj6/eFha8E7QwWUheGGx3/4e8i', 'Harper', 'Thomas', 'F', '082-444-7777', 'harper.t@email.com', 1, 'Active', '1001'),
-- Room 1002 (2 tenants)
('william_j', '$2b$10$zPOpOunt8tuR/kFO96foruSb4eWr1epGTZnnnhnBn/6ohBp2Fx0NK', 'William', 'Jackson', 'M', '082-555-8888', 'william.j@email.com', 1, 'Active', '1002'),
('evelyn_j', '$2b$10$wIPDX.jb12wWwe5GDFKIg.LHiwvmafnhNdDDBeB3uanV0UTuku6hW', 'Evelyn', 'Jackson', 'F', '082-555-9999', 'evelyn.j@email.com', 1, 'Active', '1002'),
-- Room 1003 (1 tenant)
('benjamin_w', '$2b$10$Bsbsy885tzuryOYYyGECiOpB3ymcapqI0GWct/nDcbnuw9WLIL13.', 'Benjamin', 'White', 'M', '082-666-1111', 'benjamin.w@email.com', 1, 'Active', '1003'),
-- Room 1101 (2 tenants)
('abigail_h', '$2b$10$ofwkSATagglJ6b1NVwhmzujC6LEH2IZfUT1OEJJdxshfHbUWpot2u', 'Abigail', 'Harris', 'F', '082-777-2222', 'abigail.h@email.com', 1, 'Active', '1101'),
('lucas_h', '$2b$10$dBpXXsYAjvhMTFfEHiq1iOivKD9Y/Vs7UX2xZhqer5HfCf9qgd49m', 'Lucas', 'Harris', 'M', '082-777-3333', 'lucas.h@email.com', 1, 'Active', '1101'),
-- Room 1102 (2 tenants)
('ella_m', '$2b$10$XbnO87bCeBXnAVS3vts7Me6PoMHdLNAgqQIi58mMxT0.y6j1JqiJ6', 'Ella', 'Martin', 'F', '082-888-4444', 'ella.m@email.com', 1, 'Active', '1102'),
('henry_m', '$2b$10$qfK4AQsJeXYz7v6nxy269ezz8FQ6ilESoBA/qWnznOVyg00TRQsqO', 'Henry', 'Martin', 'M', '082-888-5555', 'henry.m@email.com', 1, 'Active', '1102'),
-- Room 1103 (1 tenant)
('scarlett_t', '$2b$10$jfImrmcQU2XBEeYUbTIzHuIlpFQy8maan4eXFREfNApTorC2xaFmC', 'Scarlett', 'Thompson', 'F', '082-999-6666', 'scarlett.t@email.com', 1, 'Active', '1103'),
-- Room 1104 (1 tenant)
('sebastian_g', '$2b$10$TZDtBCVAyLivdda2PEr9VueuRon4C.xkgxQL0wkLD../S9QZBfU3.', 'Sebastian', 'Garcia', 'M', '083-111-7777', 'sebastian.g@email.com', 1, 'Active', '1104'),
-- Room 1201 (1 tenant)
('aria_r', '$2b$10$fHYs9ikFinSzUZ8Nwst8GenFXdm.GTxzLyp7lLfHdhbz0F58w71Ne', 'Aria', 'Rodriguez', 'F', '083-222-8888', 'aria.r@email.com', 1, 'Active', '1201'),
-- Room 1202 (2 tenants)
('jackson_l', '$2b$10$CqTlvLHZbXm3zETVpyW9BuTQnVV7v1frmP1/Q4MKtcf9T6H9dasi6', 'Jackson', 'Lee', 'M', '083-333-9999', 'jackson.l@email.com', 1, 'Active', '1202'),
('grace_l', '$2b$10$ozH.QEncF5rrCfa8dzgPHuFj/2Zg5ROL3no6AqSmHYWRwaDTeznn2', 'Grace', 'Lee', 'F', '083-333-1010', 'grace.l@email.com', 1, 'Active', '1202'),
-- Room 1401 (1 tenant)
('aiden_w', '$2b$10$Y3wbbdCw1y/CbM8qner3bukbusUxcHwa0gAaTnpB0TzfhRxZ3aRia', 'Aiden', 'Walker', 'M', '083-444-2020', 'aiden.w@email.com', 1, 'Active', '1401'),
-- Room 1402 (1 tenant)
('chloe_h', '$2b$10$zAEEJRoAbJTjVjkqqwSmgOAhRp3NT2bG3yOvZMwQjd2g/aodT59jC', 'Chloe', 'Hall', 'F', '083-555-3030', 'chloe.h@email.com', 1, 'Active', '1402'),
-- Room 1501 (2 tenants)
('matthew_a', '$2b$10$pkYYijiMqSd03opejQKiDOYnXvl2JtdohmMjmG/vbR/CnMVgvLCYu', 'Matthew', 'Allen', 'M', '083-666-4040', 'matthew.a@email.com', 1, 'Active', '1501'),
('victoria_a', '$2b$10$z/L6jr5CiS.gN/PbA2wbY.FEfp1oHVJLXAETZJbuqII.1NcoWpMvO', 'Victoria', 'Allen', 'F', '083-666-5050', 'victoria.a@email.com', 1, 'Active', '1501'),
-- Room 1502 (1 tenant)
('daniel_y', '$2b$10$Ch5BAHKUav4qbDA7ZXMhs.J2bg7oxQjjE6IyUxGOR4rIc9YeGCCHG', 'Daniel', 'Young', 'M', '083-777-6060', 'daniel.y@email.com', 1, 'Active', '1502'),
-- Room 1503 (2 tenants)
('luna_k', '$2b$10$CRAfxzKnhWrI31n00t2U8OgtsIPofZiC2RpSj/p2q1HGPz23ZlzPS', 'Luna', 'King', 'F', '083-888-7070', 'luna.k@email.com', 1, 'Active', '1503'),
('david_k', '$2b$10$Otk1/8CWd/P5MD3k2fOcqupx2TTHGMBLxVE9mgarc0MB7Nb1xoDoK', 'David', 'King', 'M', '083-888-8080', 'david.k@email.com', 1, 'Active', '1503'),
-- Room 1601 (1 tenant)
('zoe_w', '$2b$10$cZtCIkNPIJqW2wbWqAjZBudsDKccUn5G19JFdaolWP1qbKPbUED9e', 'Zoe', 'Wright', 'F', '083-999-9090', 'zoe.w@email.com', 1, 'Active', '1601'),
-- Room 1602 (1 tenant)
('joseph_s', '$2b$10$cZtCIkNPIJqW2wbWqAjZBudsDKccUn5G19JFdaolWP1qbKPbUED9e', 'Joseph', 'Scott', 'M', '084-111-1010', 'joseph.s@email.com', 1, 'Active', '1602'),
-- Room 1701 (2 tenants)
('penelope_g', '$2b$10$PAflZKVA5zpDDw9TavEf6ONVEkD/lg8g/Hkr8iZenrYkyGzxTVC0e', 'Penelope', 'Green', 'F', '084-222-2020', 'penelope.g@email.com', 1, 'Active', '1701'),
('samuel_g', '$2b$10$eAWZ5BcK.mWXA6R4Htadb.aJyK28pkz4E6GC9OOiocz/daHkKtmQO', 'Samuel', 'Green', 'M', '084-222-3030', 'samuel.g@email.com', 1, 'Active', '1701'),
-- Room 1801 (1 tenant)
('layla_b', '$2b$10$Y2pTCZClLlOVST4R2ppdRuiwZrqiVWnhFeIaXWLYktGIDQoZlHAFe', 'Layla', 'Baker', 'F', '084-333-4040', 'layla.b@email.com', 1, 'Active', '1801'),
-- Room 1802 (1 tenant)
('jack_n', '$2b$10$NDR5JoCBvctEs2YuLTl5.eknJ/FBLeeHDYUh/3uHBS9OPGkAqayhm', 'Jack', 'Nelson', 'M', '084-444-5050', 'jack.n@email.com', 1, 'Active', '1802'),
-- Room 1803 (1 tenant)
('nora_c', '$2b$10$1PEs8zh1UoRngfPhYQvMNOus.CJn0A5wx95mDmMgzITXvD4Y9e0wi', 'Nora', 'Carter', 'F', '084-555-6060', 'nora.c@email.com', 1, 'Active', '1803'),
-- Room 2001 (2 tenants)
('ryan_m', '$2b$10$XLujff1p7IxQGq8j/i4tlOKhvkREvpIkzyvZ6luwUjgZ8/4VD7pXC', 'Ryan', 'Mitchell', 'M', '084-666-7070', 'ryan.m@email.com', 1, 'Active', '2001'),
('lily_m', '$2b$10$A535NKP9ESO8uU1wN5d5CumZZQthvr5AH71GHQ1u9JR1XOsn3xq52', 'Lily', 'Mitchell', 'F', '084-666-8080', 'lily.m@email.com', 1, 'Active', '2001'),
-- Room 2002 (1 tenant)
('hannah_p', '$2b$10$hDBIUkpReqmrlDSjYkGafuwi3c1pNQ2BGA852E3ShYrhmhVQa3rXW', 'Hannah', 'Perez', 'F', '084-777-9090', 'hannah.p@email.com', 1, 'Active', '2002'),
-- Room 2101 (1 tenant)
('wyatt_r', '$2b$10$pr6jE2vaUGZ4sXCfA41ncuIpV8pvmrH82GihbtxLviZhc16vq7aIC', 'Wyatt', 'Roberts', 'M', '084-888-1010', 'wyatt.r@email.com', 1, 'Active', '2101'),
-- Room 2201 (1 tenant)
('zoey_t', '$2b$10$CyWwIb6mmB4b26iQOQpn/O2/N0BKVEhPqodZ17g4aUNUDYnrrbkI6', 'Zoey', 'Turner', 'F', '084-999-2020', 'zoey.t@email.com', 1, 'Active', '2201'),
-- Room 2202 (2 tenants)
('nathan_p', '$2b$10$6J9HY8mAyr01YRLpiMJl2.4AGP0usqHIFPmV5Af0tSkjuZ./OgeFq', 'Nathan', 'Phillips', 'M', '085-111-3030', 'nathan.p@email.com', 1, 'Active', '2202'),
('audrey_p', '$2b$10$V.rv7/suk0ViU1invdi8KOGSC3u4dG2939FU8H9dRDtaVWjXgbQMG', 'Audrey', 'Phillips', 'F', '085-111-4040', 'audrey.p@email.com', 1, 'Active', '2202'),
-- Room 2501 (2 tenants - Penthouse)
('alexander_c', '$2b$10$i/SwD8IeMwArm2DboSxQueJkjqe5ifhQYnBFyv1cOu6Qdpdm4j6u.', 'Alexander', 'Campbell', 'M', '085-222-5050', 'alexander.c@email.com', 1, 'Active', '2501'),
('madison_c', '$2b$10$lfe8Fht7kiYA.7zYddNlk.QyZg/LEF2ryFYPvJoxk6N6GPM7YdLG2', 'Madison', 'Campbell', 'F', '085-222-6060', 'madison.c@email.com', 1, 'Active', '2501');


-- 6. RFID_Tag (Depends on Car)
INSERT INTO RFID_Tag (RFID_TID, current_EPC, tag_type, tag_status, license_number)
VALUES
('TID_TENANT_501', 'EPC_TENANT_501', 'Tenant', 'Active', 'AB-1234'),
('TID_TENANT_601', 'EPC_TENANT_601', 'Tenant', 'Active', 'CD-5678'),
('TID_TENANT_602', 'EPC_TENANT_602', 'Tenant', 'Active', 'EF-9012'),
('TID_TENANT_604', 'EPC_TENANT_604', 'Tenant', 'Active', 'XY-5555'),
('TID_TENANT_803', 'EPC_TENANT_803', 'Tenant', 'Active', 'GT-3000'),
('TID_TENANT_1001', 'EPC_TENANT_1001', 'Tenant', 'Active', 'BK-1111'),
('TID_TENANT_1002', 'EPC_TENANT_1002', 'Tenant', 'Active', 'BK-2222'),
('TID_TENANT_1101', 'EPC_TENANT_1101', 'Tenant', 'Active', 'GH-3456'),
('TID_TENANT_1102', 'EPC_TENANT_1102', 'Tenant', 'Active', 'IJ-7890'),
('TID_TENANT_1104', 'EPC_TENANT_1104', 'Tenant', 'Active', 'AZ-1212'),
('TID_TENANT_1202', 'EPC_TENANT_1202', 'Tenant', 'Active', 'KL-1122'),
('TID_TENANT_1402', 'EPC_TENANT_1402', 'Tenant', 'Active', 'RE-4567'),
('TID_TENANT_1501', 'EPC_TENANT_1501', 'Tenant', 'Active', 'MN-3344'),
('TID_TENANT_1601', 'EPC_TENANT_1601', 'Tenant', 'Inactive', 'PP-9876'),
('TID_TENANT_1701', 'EPC_TENANT_1701', 'Tenant', 'Active', 'QW-1110'),
('TID_TENANT_1801', 'EPC_TENANT_1801', 'Tenant', 'Active', 'ER-2233'),
('TID_TENANT_2001', 'EPC_TENANT_2001', 'Tenant', 'Active', 'TY-4455'),
('TID_TENANT_2101', 'EPC_TENANT_2101', 'Tenant', 'Active', 'UI-6677'),
('TID_TENANT_2202', 'EPC_TENANT_2202', 'Tenant', 'Active', 'OP-8899'),
('TID_TENANT_2501', 'EPC_TENANT_2501', 'Tenant', 'Active', 'VV-1000'),
('TID_GUEST_001', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_002', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_003', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_004', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_005', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_006', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_007', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_008', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_009', NULL, 'Guest', 'Available', NULL),
('TID_GUEST_010', NULL, 'Guest', 'Available', NULL);

COMMIT;

-- ----------------------------------------------------------------
-- PART 2: DEMO GUEST CHECK-IN (trg_GuestCheckIn)
-- ----------------------------------------------------------------
START TRANSACTION;

-- This INSERT will fire 'trg_GuestCheckIn'
INSERT INTO Guest_Visit (guest_first_name, guest_last_name, guest_gender, check_in_time, note, room_id, license_number, guest_RFID_TID, visit_EPC, staff_id)
VALUES
('Mike', 'Ross', 'M', NOW() - INTERVAL 16.5 HOUR, 'Visiting tenant in room 501', '501', 'GV-1001', 'TID_GUEST_001', 'EPC_GUEST_001', 2),
('Sarah', 'Connor', 'F', NOW() - INTERVAL 4.03 HOUR, 'Family visit to room 602', '602', 'GV-1002', 'TID_GUEST_002', 'EPC_GUEST_002', 4),
('Tom', 'Hardy', 'M', NOW() - INTERVAL 2.7 HOUR, 'Friend visiting room 1002', '1002', 'GV-1003', 'TID_GUEST_003', 'EPC_GUEST_003', 2),
('Emily', 'Stone', 'F', NOW() - INTERVAL 1.45 HOUR, 'Business meeting at room 1501', '1501', 'GV-1004', 'TID_GUEST_004', 'EPC_GUEST_004', 4),
('David', 'Lee', 'M', NOW(), 'Visiting room 2001', '2001', 'GV-1005', 'TID_GUEST_005', 'EPC_GUEST_005', 2);

COMMIT;

-- (You can verify this by running: SELECT * FROM RFID_Tag WHERE RFID_TID = 'TID_GUEST_001';)

-- ----------------------------------------------------------------
-- PART 3: DEMO GATE AUTHENTICATION (sp_AuthenticateGate_RFID)
-- ----------------------------------------------------------------
-- This procedure logs all attempts to 'Gate_Arrival_Departure'

-- Success: Tenant from room 501 arrives
CALL sp_AuthenticateGate_RFID('TID_TENANT_501', 'EPC_TENANT_501', 'Main Gate', @status, @msg, @success);
SELECT 'Tenant Room 501' AS user, @status, @msg, @success;

-- Success: Tenant from room 1001 arrives
CALL sp_AuthenticateGate_RFID('TID_TENANT_1001', 'EPC_TENANT_1001', 'Main Gate', @status, @msg, @success);
SELECT 'Tenant Room 1001' AS user, @status, @msg, @success;

-- Success: Guest Mike Ross arrives
CALL sp_AuthenticateGate_RFID('TID_GUEST_001', 'EPC_GUEST_001', 'Main Gate', @status, @msg, @success);
SELECT 'Guest Mike Ross' AS user, @status, @msg, @success;

-- Failure (Bad Status): Inactive tenant tries to enter
CALL sp_AuthenticateGate_RFID('TID_TENANT_1601', 'EPC_TENANT_1601', 'Main Gate', @status, @msg, @success);
SELECT 'Inactive Tenant' AS user, @status, @msg, @success;

-- Failure (Bad EPC): Alice's tag is scanned with a wrong EPC
CALL sp_AuthenticateGate_RFID('TID_TENANT_501', 'EPC_WRONG_PASSWORD', 'Main Gate', @status, @msg, @success);
SELECT 'Bad EPC' AS user, @status, @msg, @success;

-- (You can verify this by running: SELECT * FROM Gate_Arrival_Departure;)

-- ----------------------------------------------------------------
-- PART 4: DEMO NIGHT PATROL (Parking_Log)
-- ----------------------------------------------------------------
START TRANSACTION;

-- Staff Jane (ID 2) does her patrol.

-- 1. Scans Slot A-101, finds tenant from room 501's car (AB-1234). All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Vehicle matches slot.', 'TID_TENANT_501', 'EPC_TENANT_501', 'A-101', 2);

-- 2. Scans Slot A-102, finds tenant from room 601's car (CD-5678). All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Vehicle matches slot.', 'TID_TENANT_601', 'EPC_TENANT_601', 'A-102', 2);

-- 3. Scans Slot A-103, finds guest Mike Ross's car (GV-1001). All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Guest vehicle present.', 'TID_GUEST_001', 'EPC_GUEST_001', 'A-103', 2);

-- 4. Scans Slot A-104, finds it empty.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Slot empty.', NULL, NULL, 'A-104', 2);

COMMIT;

-- ----------------------------------------------------------------
-- PART 5: DEMO GUEST CHECK-OUT (trg_GuestCheckOut)
-- ----------------------------------------------------------------
START TRANSACTION;

-- Guest Mike Ross (Visit ID 1) is leaving.
-- The system updates his visit record with a check_out_time.

-- This UPDATE will fire 'trg_GuestCheckOut'
-- (Assuming visit_id is 1, as it's the first guest insert)
UPDATE Guest_Visit
SET 
    check_out_time = NOW()
WHERE 
    visit_id = 1;

-- AFTER THIS COMMIT, 'trg_GuestCheckOut' will have automatically updated
-- RFID_Tag 'TID_GUEST_001' back to:
-- status = 'Available'
-- current_EPC = NULL
COMMIT;

-- (You can verify this by running: SELECT * FROM RFID_Tag WHERE RFID_TID = 'TID_GUEST_001';)
USE CondoParkingDB;
SELECT * FROM Staff;
SELECT * FROM Tenant;
SELECT * FROM Condo_Room;
SELECT * FROM Car;