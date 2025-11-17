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
('John', 'Doe', 'Manager', 'johndoe', '$2b$10$yiwyVLzCBbgsBnQ2maJqyO7QbczS7JAcvILOpu3M5xa3uwdXORddm', 'Admin', TRUE), -- Password: admin123
('Jane', 'Smith', 'Security', 'janesmith', '$2b$10$8jHpr4mv4XPcTG10NByKwuc73JPPiHALDI7OXvZmlTvedP87oJND6', 'Staff', TRUE), -- Password: staff123
('Mike', 'Brown', 'Security', 'mikebrown', '$2b$10$wCaDFr1nM9vd9jHqWBVBxeHKQULpmnyKUp.F7.s0pYJzB0f41si7m', 'Staff', FALSE), -- Password: staff123 (Inactive)
('Emily', 'Davis', 'Security', 'emilydavis', '$2b$10$mSpWNn1CuOOVkkHkm9YEYu0piyBkk/seTivO9TibEgiR1nSgDQLwq', 'Staff', TRUE), -- Password: staff123
('Noto', 'Noty', 'IT Head', 'notonoty', '$2b$10$RBw5ppTAHHIQRcrTtPB8oO9QxySWP4cFe1GcZqF7YfkbdvIpo0NPq', 'Super-Admin', TRUE); -- Password: Superadmin123

-- 2. Parking_Slot (No dependencies)
-- INSERT INTO Parking_Slot (parking_slot_ID, floor, slot_type)
-- VALUES
-- ('A-101', 1, 'Fixed_slot'),
-- ('A-102', 1, 'Fixed_slot'),
-- ('G-01', 1, 'Guest'),
-- ('B-01', 2, 'Standard');

-- 1. Remove any existing Building A slots to prevent conflicts
DELETE FROM parking_slot WHERE parking_slot_id LIKE 'A-%';

-- 2. Insert all 60 fixed slots for Building A (Floors 1-3)
INSERT INTO parking_slot (parking_slot_id, floor, slot_type) VALUES
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

-- 3. Car (Depends on Staff)
INSERT INTO Car (license_number, brand, model, color, staff_id)
VALUES
('BK-1111', 'Toyota', 'Camry', 'Silver', NULL),  -- Tenant Car 1
('BK-2222', 'Honda', 'Civic', 'Black', NULL),   -- Tenant Car 2
('BK-3333', 'Ford', 'Ranger', 'Blue', 2),      -- Staff Car (Jane Smith)
('BK-4444', 'Nissan', 'Almera', 'White', NULL), -- Future Guest Car
('BK-9999', 'Mazda', '3', 'Red', NULL);         -- Inactive Tenant Car

-- 4. Condo_Room (Depends on Car)
-- (IDs will be 1: A-101, 2: A-102)
INSERT INTO condo_room (room_id, building, floor, room_type, license_number) VALUES
-- ('A', 10, '1-Bedroom', 'BK-1111'), -- Room 1, assigned 'BK-1111'
-- ('A', 10, '2-Bedroom', 'BK-2222'); -- Room 2, assigned 'BK-2222'
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

-- 5. Tenant (Depends on Condo_Room)
INSERT INTO Tenant (username, password_hash, first_name, last_name, gender, tel_no, email, is_primary_contact, tenant_status, room_id)
VALUES
('test1', '$2b$10$avA.2OKf36g9La9cOz.hBuwUGr2fiwGIjqJpyRVYKcHKsXUTr7t32', 'Alice', 'Wonder', 'F', '081-111-1111', 'alice@email.com', TRUE, 'Active', 1),  -- Primary for Room 1 Pass: test1
('test2', '$2b$10$tnTj8dFLgbUYab31XaIDxORgeC6leY9Q0whBRDchGu0g0b29hrJ2m', 'Bob', 'Marley', 'M', '082-222-2222', 'bob@email.com', TRUE, 'Active', 2);   -- Primary for Room 2 Pass: test2

-- 6. RFID_Tag (Depends on Car)
INSERT INTO RFID_Tag (RFID_TID, current_EPC, tag_type, tag_status, license_number)
VALUES
('TID_TENANT_001', 'EPC_TENANT_A', 'Tenant', 'Active', 'BK-1111'), -- Alice's Tag
('TID_TENANT_002', 'EPC_TENANT_B', 'Tenant', 'Active', 'BK-2222'), -- Bob's Tag
('TID_STAFF_001', 'EPC_STAFF_A', 'Tenant', 'Active', 'BK-3333'),  -- Jane's Tag (schema says tag_type is Tenant/Guest, so we use 'Tenant' for staff)
('TID_TENANT_999', 'EPC_INACTIVE', 'Tenant', 'Inactive', 'BK-9999'), -- Inactive Tag
('TID_GUEST_001', NULL, 'Guest', 'Available', NULL),             -- Available Guest Tag 1
('TID_GUEST_002', NULL, 'Guest', 'Available', NULL);             -- Available Guest Tag 2

COMMIT;

-- ----------------------------------------------------------------
-- PART 2: DEMO GUEST CHECK-IN (trg_GuestCheckIn)
-- ----------------------------------------------------------------
START TRANSACTION;

-- A guest, Mike Ross, arrives to visit Room 1 (Alice).
-- Staff member Jane (ID 2) checks him in.
-- He is driving car 'BK-4444' and is given guest tag 'TID_GUEST_001'.
-- Jane programs the tag with a temporary EPC: 'EPC_VISIT_XYZ123'.

-- This INSERT will fire 'trg_GuestCheckIn'
INSERT INTO Guest_Visit (guest_first_name, guest_last_name, guest_gender, check_in_time, note, room_id, license_number, guest_RFID_TID, visit_EPC, staff_id)
VALUES
('Mike', 'Ross', 'M', NOW(), 'Visiting Alice in A-101', 1, 'BK-4444', 'TID_GUEST_001', 'EPC_VISIT_XYZ123', 2);

-- AFTER THIS COMMIT, 'trg_GuestCheckIn' will have automatically updated
-- RFID_Tag 'TID_GUEST_001' to:
-- status = 'InUse'
-- current_EPC = 'EPC_VISIT_XYZ123'
COMMIT;

-- (You can verify this by running: SELECT * FROM RFID_Tag WHERE RFID_TID = 'TID_GUEST_001';)

-- ----------------------------------------------------------------
-- PART 3: DEMO GATE AUTHENTICATION (sp_AuthenticateGate_RFID)
-- ----------------------------------------------------------------
-- This procedure logs all attempts to 'Gate_Arrival_Departure'

-- Success: Tenant Alice arrives
CALL sp_AuthenticateGate_RFID('TID_TENANT_001', 'EPC_TENANT_A', 'Main Gate', @status, @msg, @success);
SELECT 'Tenant Alice' AS user, @status, @msg, @success;

-- Success: Guest Mike Ross arrives
CALL sp_AuthenticateGate_RFID('TID_GUEST_001', 'EPC_VISIT_XYZ123', 'Main Gate', @status, @msg, @success);
SELECT 'Guest Mike' AS user, @status, @msg, @success;

-- Failure (Bad Status): Inactive tenant tries to enter
CALL sp_AuthenticateGate_RFID('TID_TENANT_999', 'EPC_INACTIVE', 'Main Gate', @status, @msg, @success);
SELECT 'Inactive Tenant' AS user, @status, @msg, @success;

-- Failure (Bad EPC): Alice's tag is scanned with a wrong EPC
CALL sp_AuthenticateGate_RFID('TID_TENANT_001', 'EPC_WRONG_PASSWORD', 'Main Gate', @status, @msg, @success);
SELECT 'Bad EPC' AS user, @status, @msg, @success;

-- (You can verify this by running: SELECT * FROM Gate_Arrival_Departure;)

-- ----------------------------------------------------------------
-- PART 4: DEMO NIGHT PATROL (Parking_Log)
-- ----------------------------------------------------------------
START TRANSACTION;

-- Staff Jane (ID 2) does her patrol.

-- 1. Scans Slot A-101, finds Alice's car. All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Vehicle matches slot.', 'TID_TENANT_001', 'EPC_TENANT_A', 'A-101', 2);

-- 2. Scans Slot A-102, finds Bob's car. All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Vehicle matches slot.', 'TID_TENANT_002', 'EPC_TENANT_B', 'A-102', 2);

-- 3. Scans Guest slot G-01, finds Mike's guest car. All good.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Guest vehicle present.', 'TID_GUEST_001', 'EPC_VISIT_XYZ123', 'G-01', 2);

-- 4. Scans Standard slot B-01, finds it empty.
INSERT INTO Parking_Log (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
VALUES
(NOW(), 'Slot empty.', NULL, NULL, 'B-01', 2);

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