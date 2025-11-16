USE CondoParkingDB;
SELECT ps.parking_slot_id, ps.floor, c.license_number
FROM parking_slot ps
JOIN parking_log pl ON ps.parking_slot_id = pl.parking_slot_id
JOIN rfid_tag rt ON pl.scanned_rfid_tid = rt.rfid_tid
JOIN car c ON rt.license_number = c.license_number
JOIN condo_room cr ON c.license_number = cr.license_number
JOIN tenant t ON cr.room_id = t.room_id
WHERE t.username = ?', [username]