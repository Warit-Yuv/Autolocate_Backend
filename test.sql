USE CondoParkingDB;
SELECT 
Date(ps.recorded_time) as rec_date,
Time(ps.recorded_time) as rec_time,
ps.parking_log_id,
ps.scanned_RFID_TID as CarID,
rt.license_number as car_license_no
FROM parking_log ps JOIN rfid_tag rt
on rt.RFID_TID= ps.scanned_RFID_TID;


-- SELECT 
-- Date(ps.recorded_time) as rec_date,
-- Time(ps.recorded_time) as rec_time,
-- ps.RFID_TID as CarID,
-- rt.license_number as car_license_no
-- FROM parking_log ps JOIN rfid_tag rt
-- on rt.RFID_TID= ps.scanned_RFID_TID


-- SELECT ps.*,rt.license_number
-- FROM parking_log ps JOIN rfid_tag rt
-- on rt.RFID_TID= ps.scanned_RFID_TID