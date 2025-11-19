-- D:
-- cd D:\MAMP\bin\mysql\bin
-- mysql -u root -p
-- Enter password: root

CREATE DATABASE IF NOT EXISTS CondoParkingDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE CondoParkingDB;
SELECT DATABASE();

-- ```  ----------------------------------
--     | Object name                     |
--     | ------------------------------- |
--     | Condo_Room                      |
--     | Tenant                          |
--     | Staff                           |
--     | Car                             |
--     | Parking_Slot                    |
--     | RFID_Tag                        |
--     | Guest_Visit                     |
--     | Gate_Arrival_Departure          |
--     | Parking_Log                     |
-- ``` ----------------------------------

START TRANSACTION;
-- Table: Staff
CREATE TABLE IF NOT EXISTS Staff (
    staff_id INT AUTO_INCREMENT,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    position VARCHAR(50),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    access_level ENUM('Super-Admin', 'Admin', 'Staff') NOT NULL,
    is_Active BOOLEAN DEFAULT TRUE,
    CONSTRAINT PK_Staff PRIMARY KEY (staff_id)
);

-- Table: Parking_Slot
CREATE TABLE IF NOT EXISTS Parking_Slot (
    parking_slot_ID VARCHAR(50) UNIQUE,
    floor INT,
    slot_type ENUM('Fixed_slot', 'Standard', 'Handicap', 'Guest', 'EV_charging'),
    CONSTRAINT PK_Parking_Slot PRIMARY KEY (parking_slot_ID)
);

-- Table: Car
CREATE TABLE IF NOT EXISTS Car (
    license_number VARCHAR(20) UNIQUE,
    brand VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    staff_id INT,
    CONSTRAINT PK_Car PRIMARY KEY (license_number),
    CONSTRAINT FK_Car_Staff FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE SET NULL -- If the referenced staff is deleted, set staff_id FK to NULL (instead of deleting the Car record)
        ON UPDATE CASCADE  -- If the staff_id in Staff is updated, cascade the change to Car records
);

-- Table: RFID_Tag
CREATE TABLE IF NOT EXISTS RFID_Tag (
    RFID_TID VARCHAR(100) NOT NULL,
    current_EPC VARCHAR(255) NULL DEFAULT NULL,
    tag_type ENUM('Tenant', 'Guest') NOT NULL,
    tag_status ENUM('Active', 'Inactive', 'Lost', 'Available', 'InUse') NOT NULL,
    license_number VARCHAR(20) NULL DEFAULT NULL,
    CONSTRAINT PK_RFID_Tag PRIMARY KEY (RFID_TID),
    CONSTRAINT FK_RFID_Tag_Car FOREIGN KEY (license_number) REFERENCES Car(license_number)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
-- current_EPC can be NULL for 'Available' guest tags

-- Table: Gate_Arrival_Departure
CREATE TABLE IF NOT EXISTS Gate_Arrival_Departure (
    gate_log_id INT AUTO_INCREMENT,
    direction ENUM('Arrival', 'Departure'),
    time_stamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gate_name VARCHAR(50),
    scanned_RFID_TID VARCHAR(100),
    scanned_EPC VARCHAR(255),
    CONSTRAINT PK_Gate_Arrival_Departure PRIMARY KEY (gate_log_id),
    CONSTRAINT FK_Gate_Arrival_Departure_RFID_Tag FOREIGN KEY (scanned_RFID_TID) REFERENCES RFID_Tag(RFID_TID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
-- Incase we want to link Car to Gate_Arrival_Departure with license_number in the future  --
-- license_number VARCHAR(20),  --
-- CONSTRAINT FK_Gate_Arrival_Departure_Car FOREIGN KEY (license_number) REFERENCES Car(license_number)  --

-- Table: Condo_Room
CREATE TABLE IF NOT EXISTS Condo_Room (
    room_id INT AUTO_INCREMENT,
    building VARCHAR(50),
    floor INT,
    room_type VARCHAR(50),
    license_number VARCHAR(20) UNIQUE,
    CONSTRAINT PK_Condo_Room PRIMARY KEY (room_id),
    CONSTRAINT FK_Condo_Room_Car FOREIGN KEY (license_number) REFERENCES Car(license_number)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
-- Add UNIQUE constraint to license_number to enforce that one car can only be assigned to one room

-- Table: Tenant
CREATE TABLE IF NOT EXISTS Tenant (
    tenant_id INT AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    gender CHAR(1),
    tel_no VARCHAR(15),
    email VARCHAR(100),
    is_primary_contact BOOLEAN,
    tenant_status VARCHAR(50) DEFAULT 'Active',
    room_id INT,
    CONSTRAINT PK_Tenant PRIMARY KEY (tenant_id),
    CONSTRAINT FK_Tenant_Condo_Room FOREIGN KEY (room_id) REFERENCES Condo_Room(room_id)
        ON DELETE RESTRICT  -- Prevent deletion of Condo_Room if referenced by Tenant
        ON UPDATE CASCADE
);

-- Table: Guest_Visit
CREATE TABLE IF NOT EXISTS Guest_Visit (
    visit_id INT AUTO_INCREMENT,
    guest_first_name VARCHAR(50),
    guest_last_name VARCHAR(50),
    guest_gender CHAR(1),
    check_in_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time DATETIME NULL DEFAULT NULL,
    note VARCHAR(255),
    room_id INT,
    license_number VARCHAR(20),
    guest_RFID_TID VARCHAR(100),
    visit_EPC VARCHAR(255),
    staff_id INT,
    CONSTRAINT PK_Guest_Visit PRIMARY KEY (visit_id),
    CONSTRAINT FK_Guest_Visit_Condo_Room FOREIGN KEY (room_id) REFERENCES Condo_Room(room_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Guest_Visit_Car FOREIGN KEY (license_number) REFERENCES Car(license_number)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Guest_Visit_RFID_Tag FOREIGN KEY (guest_RFID_TID) REFERENCES RFID_Tag(RFID_TID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Guest_Visit_Staff FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Table: Parking_Log
CREATE TABLE IF NOT EXISTS Parking_Log (
    parking_log_id INT AUTO_INCREMENT,
    recorded_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    scanned_RFID_TID VARCHAR(100),
    scanned_EPC VARCHAR(255),
    parking_slot_ID VARCHAR(50),
    staff_id INT,
    CONSTRAINT PK_Parking_Log PRIMARY KEY (parking_log_id),
    CONSTRAINT FK_Parking_Log_RFID_Tag FOREIGN KEY (scanned_RFID_TID) REFERENCES RFID_Tag(RFID_TID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Parking_Log_Parking_Slot FOREIGN KEY (parking_slot_ID) REFERENCES Parking_Slot(parking_slot_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Parking_Log_Staff FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

COMMIT;

START TRANSACTION;
-- Create Trigger and Procedure

DELIMITER $$
-- -- Stored Procedure to authenticate gate entry using RFID (TID + EPC) ----
-- =============================================
-- Description: Authenticates entry at an automated gate
--              using only RFID (TID + EPC).
--              Logs every attempt.
-- =============================================
CREATE PROCEDURE sp_AuthenticateGate_RFID (
    -- Input parameters from the scanner
    IN p_rfid_tid VARCHAR(100),
    IN p_rfid_epc VARCHAR(255),
    IN p_gate_name VARCHAR(50),
    
    -- Output parameters for the application/gate
    OUT p_auth_status VARCHAR(20),  -- 'Success' or 'Denied'
    OUT p_message VARCHAR(255),     -- Message for logging
    OUT p_auth_success BOOLEAN      -- True on success, False on failure
)
BEGIN
    DECLARE v_tag_status VARCHAR(50);
    DECLARE v_tag_type VARCHAR(50);

    -- 1. Try to find a tag that matches BOTH the TID and the current EPC
    SELECT
        tag_status,
        tag_type
    INTO
        v_tag_status,
        v_tag_type
    FROM
        RFID_Tag
    WHERE
        RFID_TID = p_rfid_tid AND current_EPC = p_rfid_epc;

    -- 2. Check if a match was found
    IF v_tag_status IS NULL THEN
        -- No tag matched the TID/EPC pair
        SET p_auth_status = 'Denied';
        SET p_message = 'Invalid TID/EPC pair. Access Denied.';
        SET p_auth_success = FALSE;
        
        -- Log the FAILED attempt
        INSERT INTO Gate_Arrival_Departure 
            (direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC)
        VALUES 
            ('Arrival', NOW(), p_gate_name, p_rfid_tid, p_rfid_epc);
            
    ELSE
        -- A tag was found, now check its status
        IF v_tag_status = 'Active' THEN
            -- 'Active' tag found, grant access
            SET p_auth_status = 'Success';
            SET p_message = CONCAT('Access Granted. Type: ', v_tag_type);
            SET p_auth_success = TRUE;

            -- Log the SUCCESSFUL attempt
            INSERT INTO Gate_Arrival_Departure 
                (direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC)
            VALUES 
                ('Arrival', NOW(), p_gate_name, p_rfid_tid, p_rfid_epc);
        ELSE
            -- Tag was found but has a bad status (e.g., 'Inactive', 'Lost')
            SET p_auth_status = 'Denied';
            SET p_message = CONCAT('Access Denied. Tag status: ', v_tag_status);
            SET p_auth_success = FALSE;
            
            -- Log the DENIED (but found) attempt
            INSERT INTO Gate_Arrival_Departure 
                (direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC)
            VALUES 
                ('Arrival', NOW(), p_gate_name, p_rfid_tid, p_rfid_epc);
        END IF;
    END IF;

END;$$
DELIMITER ;

---- Trigger to Automate Guest Tag Activation for Guest Check-In ----
-- =============================================
-- Description: When guard inserts a new Guest_Visit record (check-in),
--              trigger would activate the guest's RFID tag by setting
--              its status to 'InUse' and updating the current_EPC.
-- =============================================
USE condoparkingdb;
DELIMITER $$
CREATE TRIGGER trg_GuestCheckIn
AFTER INSERT ON Guest_Visit
FOR EACH ROW
BEGIN
    -- Set the guest tag's status to 'InUse'
    -- and copy the 'visit_EPC' into the tag's 'current_EPC'
    UPDATE RFID_Tag
    SET 
        tag_status = 'InUse',
        current_EPC = NEW.visit_EPC
    WHERE 
        RFID_TID = NEW.guest_RFID_TID;
END$$
DELIMITER ;

---- Trigger to Automate Guest Tag Deactivation for Guest Check-Out ----
-- =============================================
-- Description: When guard updates a Guest_Visit record with check-out time,
--              trigger would deactivate the guest's RFID tag by setting
--              its status to 'Available' and clearing the current_EPC.
-- =============================================
DELIMITER $$
CREATE TRIGGER trg_GuestCheckOut
AFTER UPDATE ON Guest_Visit
FOR EACH ROW
BEGIN
    -- Check if the check_out_time was just set (i.e., went from NULL to a value)
    IF OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN
        -- Set the guest tag's status to 'Available'
        -- and clear the 'current_EPC'
        UPDATE RFID_Tag
        SET 
            tag_status = 'Available',
            current_EPC = NULL
        WHERE 
            RFID_TID = NEW.guest_RFID_TID;
    END IF;
END$$
DELIMITER ;

COMMIT;