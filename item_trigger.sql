DROP TRIGGER IF EXISTS chg_item_status;

DELIMITER //

CREATE TRIGGER chg_item_status
BEFORE UPDATE ON item
FOR EACH ROW
BEGIN
    -- When item changes from lost → found
    IF NEW.status = 'found' AND OLD.status = 'lost' THEN
        
        -- set item timestamp
        SET NEW.status_change_date = NOW();
        UPDATE complaint
        SET complaint_status = 'closed',
            complaint_closure_date = NOW()
        WHERE complaint_id = NEW.complaint_id;

    END IF;
END//

DELIMITER ;