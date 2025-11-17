USE CondoParkingDB;
-- SELECT gad.direction AS vehicleDirection, gad.time_stamp, gad.gate_name,
-- gad.scanned_RFID_TID, gad.scanned_EPC, rt.license_number
-- FROM gate_arrival_departure gad
-- JOIN rfid_tag rt ON gad.scanned_RFID_TID = rt.RFID_TID
-- WHERE rt.license_number = "BK-9999"
-- ORDER BY gad.time_stamp DESC LIMIT 1;

SELECT gad.direction AS vehicleDirection, gad.time_stamp,
gad.scanned_RFID_TID FROM gate_arrival_departure gad
JOIN rfid_tag rt ON gad.scanned_RFID_TID = rt.RFID_TID
WHERE rt.license_number = "BK-9999" ORDER BY gad.time_stamp DESC LIMIT 1;

-- SELECT gv.visit_id, gv.guest_first_name, 
--        gv.guest_last_name, gv.license_number, gv.note,
--        gv.check_in_time, gv.check_out_time, gv.room_id,
--        t.tenant_id AS host_id, t.username AS host_username, t.first_name AS host_first_name, t.last_name AS host_last_name
--        FROM Guest_Visit gv
--        LEFT JOIN Condo_Room cr ON gv.room_id = cr.room_id
--        LEFT JOIN Tenant t ON cr.room_id = t.room_id
    --    WHERE 1=1 AND check_out_time IS NULL;

-- ----------------------------------------------------------------
-- SELECT * FROM Guest_Visit;

-- SELECT * FROM Parking_Log;

-- SELECT * FROM Gate_Arrival_Departure;


-- SELECT * FROM STAFF;

-- SELECT rt.tag_status as tag_status, 
-- count(rt.RFID_TID) as num
-- FROM RFID_Tag rt where rt.tag_type="Guest"
-- Group by tag_status;

-- SELECT staff_id as 'Staff ID',
--             first_name, last_name,
--             position as 'Position',
--             username as 'Username',
--             password_hash as 'Password Hash',
--             access_level as 'Access Level',
--             is_Active as 'Active'
--             FROM Staff;