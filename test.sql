USE CondoParkingDB;
SELECT * FROM STAFF;

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