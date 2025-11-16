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
('Jane', 'Smith', 'Security', 'janesmith', '$2b$10$8jHpr4mv4XPcTG10NByKwuc73JPPiHALDI7OXvZmlTvedP87oJND6', 'Staff', TRUE); -- Password: staff123

-- 2. Parking_Slot (No dependencies)
INSERT INTO Parking_Slot (parking_slot_ID, floor, slot_type)
VALUES
('A-101', 1, 'Fixed_slot'),
('A-102', 1, 'Fixed_slot'),
('G-01', 1, 'Guest'),
('B-01', 2, 'Standard');

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
INSERT INTO Condo_Room (building, floor, room_type, license_number)
VALUES
('A', 10, '1-Bedroom', 'BK-1111'), -- Room 1, assigned 'BK-1111'
('A', 10, '2-Bedroom', 'BK-2222'); -- Room 2, assigned 'BK-2222'

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